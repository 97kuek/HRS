import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateCancellationPolicy, evaluateCancellation } from "@/lib/reservations/cancellation";

/**
 * GET /api/reservations/[reservationNumber]/cancel/quote
 * UC「予約をキャンセルする」：予約内容の表示（確認画面用、未確定）。
 * 予約が存在すれば内容とキャンセル可否を返す（不可でも状態を表示できるようにする）。
 */
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
        guest: { select: { name: true } },
        roomType: { select: { name: true, baseRate: true } },
      },
    });

    const inputName = `${familyName} ${givenName}`.replace(/\s+/g, " ").trim();
    const storedName = reservation?.guest.name.replace(/\s+/g, " ").trim();
    if (!reservation || storedName !== inputName) {
      return apiError(404, "RESERVATION_NOT_FOUND", "入力内容に一致する予約が見つかりませんでした。");
    }

    const evaluation = evaluateCancellation(reservation.status);
    const policy = calculateCancellationPolicy({
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      baseRate: reservation.roomType.baseRate,
    });

    return Response.json({
      quote: {
        reservationNumber: reservation.reservationNumber,
        roomTypeName: reservation.roomType.name,
        checkInDate: reservation.checkInDate.toISOString().slice(0, 10),
        checkOutDate: reservation.checkOutDate.toISOString().slice(0, 10),
        guestCount: reservation.guestCount,
        totalCharge: policy.totalCharge,
        cancellationFee: policy.cancellationFee,
        cancellationPolicy: policy.label,
        cancellationPolicyDescription: policy.description,
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
