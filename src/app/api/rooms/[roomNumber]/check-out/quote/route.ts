import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateCharge, calculateNights, classifyMissingStay } from "@/lib/stays/check-out";

/**
 * GET /api/rooms/[roomNumber]/check-out/quote
 * UC「チェックアウトする」#11 msg3〜6：宿泊特定・状態確認・料金計算（表示用、未確定）。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomNumber: string }> },
) {
  const { roomNumber } = await params;
  if (!roomNumber) {
    return apiError(400, "VALIDATION_ERROR", "部屋番号が指定されていません。");
  }

  try {
    // msg3-4: 宿泊を特定する / 状態を確認する（E1 / E2）。
    const activeStay = await prisma.stay.findFirst({
      where: { room: { roomNumber }, checkedOutAt: null },
      include: {
        reservation: {
          include: { roomType: { select: { name: true, baseRate: true } } },
        },
      },
    });
    if (!activeStay) {
      const anyStay = await prisma.stay.findFirst({ where: { room: { roomNumber } } });
      const rejection = classifyMissingStay(Boolean(anyStay));
      return apiError(rejection.status, rejection.code, rejection.message);
    }

    // msg5: 宿泊料金を計算する（表示用。ここでは永続化しない）。
    const reservation = activeStay.reservation;
    const nights = calculateNights(reservation.checkInDate, reservation.checkOutDate);
    const amount = calculateCharge({ baseRate: reservation.roomType.baseRate, nights });

    // msg6: 料金を表示する（材料を返す）。
    return Response.json({
      quote: {
        roomNumber,
        reservationNumber: reservation.reservationNumber,
        roomTypeName: reservation.roomType.name,
        checkInDate: reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: reservation.checkOutDate.toISOString().slice(0, 10),
        nights,
        amount,
      },
    });
  } catch (error) {
    console.error("Failed to quote check-out", error);
    return internalServerError();
  }
}
