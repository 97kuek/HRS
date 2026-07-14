import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { matchesReservationGuest, validateReservationIdentity } from "@/lib/reservations/identity";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reservationNumber: string }> },
) {
  const { reservationNumber } = await params;
  const searchParams = new URL(request.url).searchParams;
  const validation = validateReservationIdentity({
    reservationNumber,
    familyName: searchParams.get("familyName"),
    givenName: searchParams.get("givenName"),
  });
  if (!validation.ok) {
    return apiError(400, "VALIDATION_ERROR", "入力内容を確認してください。", validation.errors);
  }
  const identity = validation.value;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationNumber: identity.reservationNumber },
      include: {
        guest: { select: { name: true, email: true, phone: true } },
        roomType: { select: { name: true, baseRate: true } },
        stay: { include: { room: { select: { roomNumber: true } } } },
      },
    });

    if (!reservation || !matchesReservationGuest(reservation.guest.name, identity)) {
      return apiError(
        404,
        "RESERVATION_NOT_FOUND",
        "入力内容に一致する予約が見つかりませんでした。",
      );
    }

    const nights = Math.round(
      (reservation.checkOutDate.getTime() - reservation.checkInDate.getTime()) / MS_PER_DAY,
    );

    return Response.json({
      reservation: {
        reservationNumber: reservation.reservationNumber,
        roomTypeName: reservation.roomType.name,
        checkInDate: reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: reservation.checkOutDate.toISOString().slice(0, 10),
        nights,
        guestCount: reservation.guestCount,
        guestName: reservation.guest.name,
        email: reservation.guest.email,
        phone: reservation.guest.phone ?? null,
        status: reservation.status,
        totalCharge: reservation.roomType.baseRate * nights,
        roomNumber: reservation.stay?.room.roomNumber ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to look up reservation", error);
    return internalServerError();
  }
}
