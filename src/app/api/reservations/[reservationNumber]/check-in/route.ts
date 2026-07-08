import { Prisma } from "@prisma/client";

import { apiError, internalServerError, DomainError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { evaluateCheckIn, pickAssignableRoom, todayInHotelTz } from "@/lib/reservations/check-in";

/**
 * POST /api/reservations/[reservationNumber]/check-in
 * UC「チェックインする」#10 コラボ図 msg2〜10 に対応。
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
      // msg3: 予約を特定する（E1 予約番号無効）。
      const reservation = await tx.reservation.findUnique({
        where: { reservationNumber },
        include: {
          guest: { select: { name: true } },
          roomType: { select: { name: true } },
        },
      });

      const inputName = `${familyName} ${givenName}`.replace(/\s+/g, " ").trim();
      const storedName = reservation?.guest.name.replace(/\s+/g, " ").trim();
      if (!reservation || storedName !== inputName) {
        throw new DomainError(
          "RESERVATION_NOT_FOUND",
          404,
          "入力内容に一致する予約が見つかりませんでした。",
        );
      }

      // msg4: 状態を確認する（E2 当日でない / E3 チェックイン済み等）。
      const evaluation = evaluateCheckIn({
        status: reservation.status,
        checkInDate: reservation.checkInDate,
        today: todayInHotelTz(),
      });
      if (!evaluation.ok) {
        throw new DomainError(evaluation.code, evaluation.status, evaluation.message);
      }

      // msg5: 空き部屋を取得する（E4 部屋なし）。
      // 「滞在中（checkedOutAt=null の Stay を持つ）」部屋を除外＝現在の占有のみ避ける。
      const rooms = await tx.room.findMany({
        where: {
          roomTypeId: reservation.roomTypeId,
          stays: { none: { checkedOutAt: null } },
        },
        select: { id: true, roomNumber: true },
        orderBy: { roomNumber: "asc" },
      });
      const room = pickAssignableRoom(rooms);
      if (!room) {
        throw new DomainError("NO_ASSIGNABLE_ROOM", 409, "割り当て可能な空室がありません。");
      }

      // msg6-8: 部屋を割り当てる / 宿泊を作成する «create» / チェックイン日時を記録する。
      const stay = await tx.stay.create({
        data: {
          reservationId: reservation.id,
          roomId: room.id,
          checkedInAt: new Date(),
        },
      });

      // #10 に明示メッセージは無いが status 書き戻しは必須。
      // 再チェックイン防止と在庫計算（RESERVED/CHECKED_IN を数える）の整合のため。
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "CHECKED_IN" },
      });

      return { reservation, room, stay };
    });

    // msg9: 結果を返す（予約内容＋部屋番号）。msg11 の表示材料。
    return Response.json({
      checkIn: {
        reservationNumber: result.reservation.reservationNumber,
        roomTypeName: result.reservation.roomType.name,
        roomNumber: result.room.roomNumber,
        checkInDate: result.reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: result.reservation.checkOutDate.toISOString().slice(0, 10),
        guestCount: result.reservation.guestCount,
        checkedInAt: result.stay.checkedInAt.toISOString(),
      },
    });
  } catch (error) {
    // msg10: エラーを表示する（単一集約）。
    if (error instanceof DomainError) {
      return apiError(error.status, error.code, error.message);
    }
    // Stay.reservationId の一意制約 = 同時に別リクエストがチェックイン済み。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError(409, "INVALID_RESERVATION_STATUS", "この予約は既にチェックイン済みです。");
    }
    console.error("Failed to check in", error);
    return internalServerError();
  }
}

