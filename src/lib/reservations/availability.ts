import type { Prisma, PrismaClient } from "@prisma/client";

import type { ApiErrorDetail } from "@/lib/api/response";

/** 予約条件として受け取りうる生の入力。 */
export type ReservationConditionInput = {
  checkInDate?: unknown;
  checkOutDate?: unknown;
  guestCount?: unknown;
  roomTypeId?: unknown;
};

/** バリデーション済みの予約条件。日付は UTC 00:00 に正規化した Date。 */
export type ReservationCondition = {
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestCount: number;
  /** 部屋タイプ指定（検索では任意、予約登録では必須）。 */
  roomTypeId?: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_NIGHTS = 30;
const MAX_GUEST_COUNT = 10;

/** "YYYY-MM-DD" を UTC 00:00 の Date に変換する。妥当でなければ null。 */
function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // 2026-02-31 のような不正日付を弾く（JS の自動繰り上げ対策）。
  if (date.toISOString().slice(0, 10) !== value) {
    return null;
  }
  return date;
}

/** 今日（UTC 00:00）を返す。過去日チェック用。 */
function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * 予約条件のバリデーション（ユースケース E1）。
 * roomTypeId は requireRoomType=true のとき必須。
 */
export function validateReservationCondition(
  input: ReservationConditionInput,
  options: { requireRoomType?: boolean } = {},
): { ok: true; value: ReservationCondition } | { ok: false; errors: ApiErrorDetail[] } {
  const errors: ApiErrorDetail[] = [];

  const checkIn = parseDateOnly(input.checkInDate);
  const checkOut = parseDateOnly(input.checkOutDate);

  if (!checkIn) {
    errors.push({ field: "checkInDate", message: "チェックイン日を YYYY-MM-DD 形式で指定してください。" });
  }
  if (!checkOut) {
    errors.push({ field: "checkOutDate", message: "チェックアウト日を YYYY-MM-DD 形式で指定してください。" });
  }
  if (checkIn && checkIn < todayUtc()) {
    errors.push({ field: "checkInDate", message: "チェックイン日には本日以降の日付を指定してください。" });
  }

  let nights = 0;
  if (checkIn && checkOut) {
    nights = Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
    if (nights < 1) {
      errors.push({ field: "checkOutDate", message: "チェックアウト日はチェックイン日より後にしてください。" });
    } else if (nights > MAX_NIGHTS) {
      errors.push({ field: "checkOutDate", message: `連泊は最大 ${MAX_NIGHTS} 泊までです。` });
    }
  }

  const guestCount = Number(input.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    errors.push({ field: "guestCount", message: "人数は 1 以上の整数で指定してください。" });
  } else if (guestCount > MAX_GUEST_COUNT) {
    errors.push({ field: "guestCount", message: `人数は最大 ${MAX_GUEST_COUNT} 名までです。` });
  }

  let roomTypeId: string | undefined;
  if (input.roomTypeId !== undefined && input.roomTypeId !== null && input.roomTypeId !== "") {
    if (typeof input.roomTypeId !== "string") {
      errors.push({ field: "roomTypeId", message: "部屋タイプの指定が不正です。" });
    } else {
      roomTypeId = input.roomTypeId;
    }
  } else if (options.requireRoomType) {
    errors.push({ field: "roomTypeId", message: "部屋タイプを選択してください。" });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { checkIn: checkIn!, checkOut: checkOut!, nights, guestCount, roomTypeId },
  };
}

/**
 * 指定期間に重複する予約数を部屋タイプ別に数える。
 * 重複判定: 既存.checkIn < 新規.checkOut かつ 既存.checkOut > 新規.checkIn。
 * 取消済・チェックアウト済は空室を占有しないため除外する。
 */
async function countOverlappingReservations(
  client: Prisma.TransactionClient | PrismaClient,
  checkIn: Date,
  checkOut: Date,
): Promise<Map<string, number>> {
  const grouped = await client.reservation.groupBy({
    by: ["roomTypeId"],
    where: {
      status: { in: ["RESERVED", "CHECKED_IN"] },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
    _count: { _all: true },
  });

  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.roomTypeId, row._count._all);
  }
  return map;
}

export type RoomTypeAvailability = {
  roomTypeId: string;
  name: string;
  capacity: number;
  baseRate: number;
  /** 在庫（総部屋数 − 重複予約数）。 */
  availableCount: number;
  /** baseRate × nights。 */
  totalCharge: number;
};

/**
 * 条件に合う部屋タイプ別の空室状況を返す（基本系列 3〜4）。
 * 定員を満たし、在庫が 1 以上の部屋タイプのみを対象とする。
 */
export async function searchAvailability(
  client: PrismaClient,
  condition: ReservationCondition,
): Promise<RoomTypeAvailability[]> {
  const roomTypes = await client.roomType.findMany({
    where: {
      capacity: { gte: condition.guestCount },
      ...(condition.roomTypeId ? { id: condition.roomTypeId } : {}),
    },
    orderBy: { baseRate: "asc" },
    include: { _count: { select: { rooms: true } } },
  });

  const overlapping = await countOverlappingReservations(client, condition.checkIn, condition.checkOut);

  const result: RoomTypeAvailability[] = [];
  for (const rt of roomTypes) {
    const availableCount = rt._count.rooms - (overlapping.get(rt.id) ?? 0);
    if (availableCount > 0) {
      result.push({
        roomTypeId: rt.id,
        name: rt.name,
        capacity: rt.capacity,
        baseRate: rt.baseRate,
        availableCount,
        totalCharge: rt.baseRate * condition.nights,
      });
    }
  }
  return result;
}

/**
 * トランザクション内で単一部屋タイプの在庫を再確認する（基本系列 6 / 例外 E3）。
 * 空室があれば true。
 */
export async function hasAvailabilityForRoomType(
  tx: Prisma.TransactionClient,
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<boolean> {
  const totalRooms = await tx.room.count({ where: { roomTypeId } });
  if (totalRooms === 0) {
    return false;
  }
  const overlapping = await tx.reservation.count({
    where: {
      roomTypeId,
      status: { in: ["RESERVED", "CHECKED_IN"] },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
  });
  return overlapping < totalRooms;
}
