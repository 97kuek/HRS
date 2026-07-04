import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reservationNumber: string }> },
) {
  const { reservationNumber } = await params;
  const searchParams = new URL(request.url).searchParams;
  const familyName = searchParams.get("familyName")?.trim() ?? "";
  const givenName = searchParams.get("givenName")?.trim() ?? "";

  if (!reservationNumber || !familyName || !givenName) {
    return apiError(400, "VALIDATION_ERROR", "予約番号、姓、名をすべて入力してください。");
  }

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationNumber: reservationNumber.toUpperCase() },
      include: {
        guest: { select: { name: true, contact: true } },
        roomType: { select: { name: true, baseRate: true } },
      },
    });

    const inputName = `${familyName} ${givenName}`.replace(/\s+/g, " ").trim();
    const storedName = reservation?.guest.name.replace(/\s+/g, " ").trim();
    if (!reservation || storedName !== inputName) {
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
        contact: reservation.guest.contact,
        status: reservation.status,
        totalCharge: reservation.roomType.baseRate * nights,
      },
    });
  } catch (error) {
    console.error("Failed to look up reservation", error);
    return internalServerError();
  }
}
