import type { ReservationStatus } from "@prisma/client";

import type { ApiErrorCode } from "@/lib/api/response";

/** キャンセル不可の理由（RESERVED 以外）。 */
export type CancellationRejection = {
  code: Extract<ApiErrorCode, "INVALID_RESERVATION_STATUS">;
  status: number;
  message: string;
};

export type CancellationEvaluation = { ok: true } | ({ ok: false } & CancellationRejection);

export type CancellationPolicy = {
  totalCharge: number;
  cancellationFee: number;
  rate: number;
  label: string;
  description: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** RESERVED 以外の予約に対するメッセージ。 */
function invalidStatusMessage(status: ReservationStatus): string {
  switch (status) {
    case "CANCELLED":
      return "この予約は既にキャンセルされています。";
    case "CHECKED_IN":
      return "チェックイン済みの予約はキャンセルできません。";
    case "CHECKED_OUT":
      return "利用済みの予約はキャンセルできません。";
    default:
      return "この予約はキャンセルできない状態です。";
  }
}

/**
 * キャンセル可否の判定。RESERVED のみ可、それ以外は INVALID_RESERVATION_STATUS。
 * DB に触れない純関数なので単体テスト可能（#48）。
 */
export function evaluateCancellation(status: ReservationStatus): CancellationEvaluation {
  if (status !== "RESERVED") {
    return {
      ok: false,
      code: "INVALID_RESERVATION_STATUS",
      status: 409,
      message: invalidStatusMessage(status),
    };
  }
  return { ok: true };
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nightsBetween(checkInDate: Date, checkOutDate: Date) {
  return Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY));
}

/**
 * 初期実装のキャンセルポリシー。
 * - チェックイン前日まで: 無料
 * - チェックイン当日: 宿泊料金の50%
 * - チェックイン予定日後: 宿泊料金の100%（未チェックインのまま残った予約向け）
 */
export function calculateCancellationPolicy({
  checkInDate,
  checkOutDate,
  baseRate,
  today = new Date(),
}: {
  checkInDate: Date;
  checkOutDate: Date;
  baseRate: number;
  today?: Date;
}): CancellationPolicy {
  const totalCharge = baseRate * nightsBetween(checkInDate, checkOutDate);
  const checkIn = toDateOnlyString(checkInDate);
  const current = toDateOnlyString(today);

  if (current < checkIn) {
    return {
      totalCharge,
      cancellationFee: 0,
      rate: 0,
      label: "前日まで無料",
      description: "チェックイン日前日までのキャンセル料は無料です。",
    };
  }

  if (current === checkIn) {
    return {
      totalCharge,
      cancellationFee: Math.round(totalCharge * 0.5),
      rate: 0.5,
      label: "当日50%",
      description: "チェックイン当日のキャンセル料は宿泊料金の50%です。",
    };
  }

  return {
    totalCharge,
    cancellationFee: totalCharge,
    rate: 1,
    label: "開始日後100%",
    description: "チェックイン予定日を過ぎた予約のキャンセル料は宿泊料金の100%です。",
  };
}
