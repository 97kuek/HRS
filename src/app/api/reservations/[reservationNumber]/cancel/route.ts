import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { evaluateCancellation } from "@/lib/reservations/cancellation";
import { sendReservationCancellation } from "@/lib/email/send";

/**
 * POST /api/reservations/[reservationNumber]/cancel
 * UC「予約をキャンセルする」：予約状態のキャンセル更新（確定）。
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reservationNumber: string }> },
) {
  const { reservationNumber } = await params;
  if (!reservationNumber) {
    return apiError(400, "VALIDATION_ERROR", "予約番号が指定されていません。");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 予約を特定する（E1）。
      const reservation = await tx.reservation.findUnique({
        where: { reservationNumber },
        include: {
          guest: { select: { name: true, email: true } },
          roomType: { select: { name: true } },
        },
      });
      if (!reservation) {
        throw new DomainError("RESERVATION_NOT_FOUND", 404, "指定された予約番号が見つかりません。");
      }

      // 状態を確認する（キャンセル済み / チェックイン済み等）。
      const evaluation = evaluateCancellation(reservation.status);
      if (!evaluation.ok) {
        throw new DomainError(evaluation.code, evaluation.status, evaluation.message);
      }

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

      return { reservation };
    });

    // キャンセル確定メール送信（失敗しても 200 を返す）。
    void sendReservationCancellation(result.reservation.guest.email, {
      guestName: result.reservation.guest.name,
      reservationNumber: result.reservation.reservationNumber,
      roomTypeName: result.reservation.roomType.name,
      checkInDate: result.reservation.checkInDate.toISOString().slice(0, 10),
      checkOutDate: result.reservation.checkOutDate.toISOString().slice(0, 10),
      guestCount: result.reservation.guestCount,
    });

    return Response.json({
      cancellation: {
        reservationNumber: result.reservation.reservationNumber,
        roomTypeName: result.reservation.roomType.name,
        checkInDate: result.reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: result.reservation.checkOutDate.toISOString().slice(0, 10),
        guestCount: result.reservation.guestCount,
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

/** ドメイン上のキャンセル不可要因をトランザクション外へ伝える内部例外。 */
class DomainError extends Error {
  constructor(
    readonly code: Parameters<typeof apiError>[1],
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
