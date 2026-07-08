import { Prisma } from "@prisma/client";

import { apiError, internalServerError, DomainError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateCharge, calculateNights, classifyMissingStay } from "@/lib/stays/check-out";
import { sendCheckOutReceipt } from "@/lib/email/send";

type CheckOutBody = { amount?: unknown; method?: unknown };

/**
 * POST /api/rooms/[roomNumber]/check-out
 * UC「チェックアウトする」#11 msg5〜8：支払い処理・チェックアウト確定。
 * body: { amount, method }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomNumber: string }> },
) {
  const { roomNumber } = await params;
  if (!roomNumber) {
    return apiError(400, "VALIDATION_ERROR", "部屋番号が指定されていません。");
  }

  let body: CheckOutBody;
  try {
    body = (await request.json()) as CheckOutBody;
  } catch {
    return apiError(400, "VALIDATION_ERROR", "リクエスト本文が不正です。");
  }

  const ALLOWED_METHODS = ["現金", "クレジットカード"];
  const method = typeof body.method === "string" ? body.method.trim() : "";
  if (method.length === 0) {
    return apiError(400, "VALIDATION_ERROR", "支払い方法を指定してください。", [
      { field: "method", message: "支払い方法を選択してください。" },
    ]);
  }
  if (!ALLOWED_METHODS.includes(method)) {
    return apiError(400, "VALIDATION_ERROR", "支払い方法が不正です。", [
      { field: "method", message: "「現金」または「クレジットカード」を選択してください。" },
    ]);
  }
  const submittedAmount = Number(body.amount);
  if (!Number.isInteger(submittedAmount) || submittedAmount < 0) {
    return apiError(400, "VALIDATION_ERROR", "支払い金額が不正です。");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // msg3-4: 宿泊を特定する / 状態を確認する（E1 / E2）。
      const activeStay = await tx.stay.findFirst({
        where: { room: { roomNumber }, checkedOutAt: null },
        include: {
          reservation: {
            include: {
              guest: { select: { name: true, email: true } },
              roomType: { select: { name: true, baseRate: true } },
            },
          },
        },
      });
      if (!activeStay) {
        const anyStay = await tx.stay.findFirst({ where: { room: { roomNumber } } });
        const rejection = classifyMissingStay(Boolean(anyStay));
        throw new DomainError(rejection.code, rejection.status, rejection.message);
      }

      const reservation = activeStay.reservation;
      const nights = calculateNights(reservation.checkInDate, reservation.checkOutDate);
      const amount = calculateCharge({ baseRate: reservation.roomType.baseRate, nights });

      // msg5〜7: 支払い処理（E3）。表示額との不一致は支払い失敗として扱う。
      if (submittedAmount !== amount) {
        throw new DomainError(
          "PAYMENT_AMOUNT_MISMATCH",
          409,
          "支払い金額が請求額と一致しません。最新の料金で再度お試しください。",
        );
      }

      // msg5 «create»: 宿泊料金を作成する。
      const charge = await tx.lodgingCharge.create({
        data: { stayId: activeStay.id, amount },
      });

      // msg7 «create»: 支払いを処理する。
      const payment = await tx.payment.create({
        data: {
          lodgingChargeId: charge.id,
          amount,
          method,
          paidAt: new Date(),
        },
      });

      // msg8: チェックアウト日時を記録する。
      const stay = await tx.stay.update({
        where: { id: activeStay.id },
        data: { checkedOutAt: new Date() },
      });

      // #11 に明示メッセージは無いが、予約を CHECKED_OUT にする（状態整合のため必須）。
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "CHECKED_OUT" },
      });

      return { reservation, stay, charge, payment };
    });

    // チェックアウト後メール送信（失敗しても 200 を返す）。
    const nights = calculateNights(
      result.reservation.checkInDate,
      result.reservation.checkOutDate,
    );
    void sendCheckOutReceipt(result.reservation.guest.email, {
      guestName: result.reservation.guest.name,
      reservationNumber: result.reservation.reservationNumber,
      roomNumber,
      roomTypeName: result.reservation.roomType.name,
      checkInDate: result.reservation.checkInDate.toISOString().slice(0, 10),
      checkOutDate: result.reservation.checkOutDate.toISOString().slice(0, 10),
      nights,
      amount: result.charge.amount,
      method: result.payment.method,
    });

    // msg9: 結果を返す（完了と支払い内容）。msg11 の表示材料。
    return Response.json({
      checkOut: {
        roomNumber,
        reservationNumber: result.reservation.reservationNumber,
        roomTypeName: result.reservation.roomType.name,
        amount: result.charge.amount,
        method: result.payment.method,
        paidAt: result.payment.paidAt.toISOString(),
        checkedOutAt: result.stay.checkedOutAt ? result.stay.checkedOutAt.toISOString() : null,
      },
    });
  } catch (error) {
    // msg10: エラーを表示する（単一集約）。
    if (error instanceof DomainError) {
      return apiError(error.status, error.code, error.message);
    }
    // LodgingCharge.stayId の一意制約 = 同時に別リクエストがチェックアウト済み。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError(409, "ALREADY_CHECKED_OUT", "この部屋は既にチェックアウト済みです。");
    }
    console.error("Failed to check out", error);
    return internalServerError();
  }
}

