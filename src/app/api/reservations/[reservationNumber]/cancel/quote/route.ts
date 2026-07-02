import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { evaluateCancellation } from "@/lib/reservations/cancellation";

/**
 * GET /api/reservations/[reservationNumber]/cancel/quote
 * UC「予約をキャンセルする」：予約内容の表示（確認画面用、未確定）。
 * 予約が存在すれば内容とキャンセル可否を返す（不可でも状態を表示できるようにする）。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reservationNumber: string }> },
) {
  const { reservationNumber } = await params;
  if (!reservationNumber) {
    return apiError(400, "VALIDATION_ERROR", "予約番号が指定されていません。");
  }

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationNumber },
      include: { roomType: { select: { name: true } } },
    });
    if (!reservation) {
      return apiError(404, "RESERVATION_NOT_FOUND", "指定された予約番号が見つかりません。");
    }

    const evaluation = evaluateCancellation(reservation.status);

    return Response.json({
      quote: {
        reservationNumber: reservation.reservationNumber,
        roomTypeName: reservation.roomType.name,
        checkInDate: reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: reservation.checkOutDate.toISOString().slice(0, 10),
        guestCount: reservation.guestCount,
        status: reservation.status,
        cancelable: evaluation.ok,
        reason: evaluation.ok ? null : evaluation.message,
      },
    });
  } catch (error) {
    console.error("Failed to quote cancellation", error);
    return internalServerError();
  }
}
