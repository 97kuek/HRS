import { Prisma } from "@prisma/client";

import {
  apiError,
  internalServerError,
  DomainError,
  type ApiErrorDetail,
} from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import {
  hasAvailabilityForRoomType,
  validateReservationCondition,
} from "@/lib/reservations/availability";
import { generateReservationNumber } from "@/lib/reservations/reservation-number";
import { sendReservationConfirmation } from "@/lib/email/send";
import { validateEmail, validateName, validatePhone } from "@/lib/validation";

const RESERVATION_NUMBER_MAX_RETRIES = 5;

type GuestInput = { name?: unknown; email?: unknown; phone?: unknown };

/** 利用者情報のバリデーション（ユースケース E4）。 */
function validateGuest(
  input: GuestInput,
): { name: string; email: string; phone: string | null } | ApiErrorDetail[] {
  const errors: ApiErrorDetail[] = [];
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";

  const nameError = validateName(name);
  if (nameError) errors.push({ field: "guest.name", message: nameError });
  const emailError = validateEmail(email);
  if (emailError) errors.push({ field: "guest.email", message: emailError });
  const phoneError = validatePhone(phone);
  if (phoneError) errors.push({ field: "guest.phone", message: phoneError });

  return errors.length > 0 ? errors : { name, email, phone: phone || null };
}

/**
 * POST /api/reservations
 * UC「部屋を予約する」基本系列 6・9・12〜13。
 * body: { roomTypeId, checkInDate, checkOutDate, guestCount, guest: { name, email, phone? } }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "リクエスト本文が不正です。");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(400, "VALIDATION_ERROR", "リクエスト本文が不正です。");
  }
  const fields = body as Record<string, unknown>;

  // 入力条件のバリデーション（E1）。予約登録では部屋タイプ必須。
  const conditionResult = validateReservationCondition(
    {
      checkInDate: fields.checkInDate,
      checkOutDate: fields.checkOutDate,
      guestCount: fields.guestCount,
      roomTypeId: fields.roomTypeId,
    },
    { requireRoomType: true },
  );
  if (!conditionResult.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "予約条件が正しくありません。",
      conditionResult.errors,
    );
  }
  const condition = conditionResult.value;
  const roomTypeId = condition.roomTypeId!;

  // 利用者情報のバリデーション（E4）。
  const guestInput =
    fields.guest && typeof fields.guest === "object" && !Array.isArray(fields.guest)
      ? (fields.guest as GuestInput)
      : {};
  const guestResult = validateGuest(guestInput);
  if (Array.isArray(guestResult)) {
    return apiError(400, "VALIDATION_ERROR", "利用者情報が正しくありません。", guestResult);
  }

  try {
    for (let attempt = 0; attempt < RESERVATION_NUMBER_MAX_RETRIES; attempt++) {
      const reservationNumber = generateReservationNumber(condition.checkIn);
      try {
        const reservation = await prisma.$transaction(async (tx) => {
          const roomType = await tx.roomType.findUnique({ where: { id: roomTypeId } });
          if (!roomType) {
            throw new DomainError(
              "ROOM_TYPE_NOT_FOUND",
              404,
              "指定された部屋タイプが見つかりません。",
            );
          }
          if (roomType.capacity < condition.guestCount) {
            throw new DomainError(
              "CAPACITY_EXCEEDED",
              400,
              "選択した部屋タイプの定員を超えています。",
            );
          }

          // 確定直前に最新の空室を再確認（基本系列 6 / 例外 E3）。
          const available = await hasAvailabilityForRoomType(
            tx,
            roomTypeId,
            condition.checkIn,
            condition.checkOut,
          );
          if (!available) {
            throw new DomainError(
              "NO_AVAILABILITY",
              409,
              "選択された部屋タイプは予約できなくなりました。別の条件でお試しください。",
            );
          }

          const guest = await tx.guest.create({
            data: {
              name: guestResult.name,
              email: guestResult.email,
              phone: guestResult.phone,
            },
          });

          return tx.reservation.create({
            data: {
              reservationNumber,
              guestId: guest.id,
              roomTypeId,
              checkInDate: condition.checkIn,
              checkOutDate: condition.checkOut,
              guestCount: condition.guestCount,
            },
            include: { roomType: { select: { name: true, baseRate: true } } },
          });
        });

        const totalCharge = reservation.roomType.baseRate * condition.nights;
        const responsePayload = {
          reservation: {
            reservationNumber: reservation.reservationNumber,
            roomTypeName: reservation.roomType.name,
            checkInDate: reservation.checkInDate.toISOString().slice(0, 10),
            checkOutDate: reservation.checkOutDate.toISOString().slice(0, 10),
            nights: condition.nights,
            guestCount: reservation.guestCount,
            guestName: guestResult.name,
            email: guestResult.email,
            phone: guestResult.phone,
            totalCharge,
          },
        };

        // 確定メール送信（失敗しても 201 を返す）。
        void sendReservationConfirmation(guestResult.email, {
          guestName: guestResult.name,
          reservationNumber: reservation.reservationNumber,
          roomTypeName: reservation.roomType.name,
          checkInDate: reservation.checkInDate.toISOString().slice(0, 10),
          checkOutDate: reservation.checkOutDate.toISOString().slice(0, 10),
          nights: condition.nights,
          guestCount: reservation.guestCount,
          totalCharge,
        });

        return Response.json(responsePayload, { status: 201 });
      } catch (error) {
        // 予約番号の一意制約違反はリトライする。
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < RESERVATION_NUMBER_MAX_RETRIES - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    // リトライ上限到達（E5）。
    return apiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "予約番号の発行に失敗しました。時間をおいて再度お試しください。",
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return apiError(error.status, error.code, error.message);
    }
    console.error("Failed to create reservation", error);
    return internalServerError();
  }
}
