import { apiError, internalServerError, DomainError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateCancellationPolicy, evaluateCancellation } from "@/lib/reservations/cancellation";
import { sendReservationCancellation } from "@/lib/email/send";

/**
 * POST /api/reservations/[reservationNumber]/cancel
 * UC「予約をキャンセルする」：予約状態のキャンセル更新（確定）。
 * body: { familyName, givenName }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reservationNumber: string }> },
) {
  const { reservationNumber } = await params;
  if (!reservationNumber) {
    return apiError(400, "VALIDATION_ERROR", "予約番号が指定されていません。");
  }

  let familyName = "";
  let givenName = "";
  try {
    const body = (await request.json()) as { familyName?: string; givenName?: string };
    familyName = body.familyName?.trim() ?? "";
    givenName = body.givenName?.trim() ?? "";
  } catch {
    // body なしは空文字のまま、下の validation で弾く。
  }
  if (!familyName || !givenName) {
    return apiError(400, "VALIDATION_ERROR", "姓と名を入力してください。");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 予約を特定する（E1）。
      const reservation = await tx.reservation.findUnique({
        where: { reservationNumber },
        include: {
          guest: { select: { name: true, email: true } },
          roomType: { select: { name: true, baseRate: true } },
        },
      });

      // 名前照合（quote と同じロジック）。
      const inputName = `${familyName} ${givenName}`.replace(/\s+/g, " ").trim();
      const storedName = reservation?.guest.name.replace(/\s+/g, " ").trim();
      if (!reservation || storedName !== inputName) {
        throw new DomainError("RESERVATION_NOT_FOUND", 404, "入力内容に一致する予約が見つかりませんでした。");
      }

      // 状態を確認する（キャンセル済み / チェックイン済み等）。
      const evaluation = evaluateCancellation(reservation.status);
      if (!evaluation.ok) {
        throw new DomainError(evaluation.code, evaluation.status, evaluation.message);
      }
      const policy = calculateCancellationPolicy({
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        baseRate: reservation.roomType.baseRate,
      });

      // 条件付き更新で確定（find→update 間に別トランザクションがチェックインを差し込む隙をガード）。
      const updated = await tx.reservation.updateMany({
        where: { reservationNumber, status: "RESERVED" },
        data: { status: "CANCELLED" },
      });
      if (updated.count === 0) {
        throw new DomainError(
          "INVALID_RESERVATION_STATUS",
          409,
          "この予約はキャンセルできない状態に変化しました。もう一度お試しください。",
        );
      }

      return { reservation, policy };
    });

    // キャンセル確定メール送信（失敗しても 200 を返す）。
    void sendReservationCancellation(result.reservation.guest.email, {
      guestName: result.reservation.guest.name,
      reservationNumber: result.reservation.reservationNumber,
      roomTypeName: result.reservation.roomType.name,
      checkInDate: result.reservation.checkInDate.toISOString().slice(0, 10),
      checkOutDate: result.reservation.checkOutDate.toISOString().slice(0, 10),
      guestCount: result.reservation.guestCount,
      totalCharge: result.policy.totalCharge,
      cancellationFee: result.policy.cancellationFee,
      cancellationPolicy: result.policy.label,
    });

    return Response.json({
      cancellation: {
        reservationNumber: result.reservation.reservationNumber,
        roomTypeName: result.reservation.roomType.name,
        checkInDate: result.reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: result.reservation.checkOutDate.toISOString().slice(0, 10),
        guestCount: result.reservation.guestCount,
        totalCharge: result.policy.totalCharge,
        cancellationFee: result.policy.cancellationFee,
        cancellationPolicy: result.policy.label,
        status: "CANCELLED",
      },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return apiError(error.status, error.code, error.message);
    }
    console.error("Failed to cancel reservation", error);
    return internalServerError();
  }
}
