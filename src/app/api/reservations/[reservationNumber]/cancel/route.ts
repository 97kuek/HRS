import { apiError, internalServerError, DomainError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { calculateCancellationPolicy, evaluateCancellation } from "@/lib/reservations/cancellation";
import { sendReservationCancellation } from "@/lib/email/send";
import { matchesReservationGuest, validateReservationIdentity } from "@/lib/reservations/identity";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "リクエスト本文が不正です。");
  }
  const fields = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const validation = validateReservationIdentity({
    reservationNumber,
    familyName: (fields as Record<string, unknown>).familyName,
    givenName: (fields as Record<string, unknown>).givenName,
  });
  if (!validation.ok) {
    return apiError(400, "VALIDATION_ERROR", "入力内容を確認してください。", validation.errors);
  }
  const identity = validation.value;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 予約を特定する（E1）。
      const reservation = await tx.reservation.findUnique({
        where: { reservationNumber: identity.reservationNumber },
        include: {
          guest: { select: { name: true, email: true } },
          roomType: { select: { name: true, baseRate: true } },
        },
      });

      // 名前照合（quote と同じロジック）。
      if (!reservation || !matchesReservationGuest(reservation.guest.name, identity)) {
        throw new DomainError(
          "RESERVATION_NOT_FOUND",
          404,
          "入力内容に一致する予約が見つかりませんでした。",
        );
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
        where: { reservationNumber: identity.reservationNumber, status: "RESERVED" },
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
