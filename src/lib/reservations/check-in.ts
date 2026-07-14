import type { ReservationStatus } from "@prisma/client";

import type { ApiErrorCode } from "@/lib/api/response";
import { todayInHotelDate } from "@/lib/date-only";

/** チェックイン不可の理由（#10 msg4「状態を確認する」で弾かれるケース）。 */
export type CheckInRejection = {
  code: Extract<ApiErrorCode, "INVALID_RESERVATION_STATUS" | "NOT_CHECKIN_DATE">;
  status: number;
  message: string;
};

export type CheckInEvaluation = { ok: true } | ({ ok: false } & CheckInRejection);

/** RESERVED 以外の予約に対するメッセージ。 */
function invalidStatusMessage(status: ReservationStatus): string {
  switch (status) {
    case "CHECKED_IN":
      return "この予約は既にチェックイン済みです。";
    case "CHECKED_OUT":
      return "この予約は既にチェックアウト済みです。";
    case "CANCELLED":
      return "この予約はキャンセルされています。";
    default:
      return "この予約はチェックインできない状態です。";
  }
}

/**
 * チェックイン可否の判定（#10 msg4）。
 * - status が RESERVED でなければ E3 INVALID_RESERVATION_STATUS
 * - 予約開始日でなければ E2 NOT_CHECKIN_DATE
 * DB に触れない純関数なので単体テスト可能（#48）。
 */
export function evaluateCheckIn(params: {
  status: ReservationStatus;
  checkInDate: Date;
  today: Date;
}): CheckInEvaluation {
  const { status, checkInDate, today } = params;

  if (status !== "RESERVED") {
    return {
      ok: false,
      code: "INVALID_RESERVATION_STATUS",
      status: 409,
      message: invalidStatusMessage(status),
    };
  }

  // 予約開始日のみチェックイン可（ロック済み設計判断）。JST 基準の暦日で比較する。
  if (checkInDate.getTime() !== today.getTime()) {
    return {
      ok: false,
      code: "NOT_CHECKIN_DATE",
      status: 409,
      message: "本日はチェックイン日ではありません。予約開始日にお越しください。",
    };
  }

  return { ok: true };
}

/**
 * ホテル所在地（JST）の「今日」を UTC 00:00 の Date で返す。
 * checkInDate（@db.Date, UTC 00:00）と暦日で比較するため、JST の年月日を UTC 00:00 に写す。
 * デプロイ環境が UTC でも、日本のホテルの当日判定として一貫させる意図。
 */
export function todayInHotelTz(): Date {
  return todayInHotelDate();
}

/**
 * 割当候補から 1 部屋選ぶ（#10 msg6「部屋を割り当てる」）。
 * roomNumber 昇順の先頭。候補が無ければ null（呼び出し側で E4）。
 */
export function pickAssignableRoom<T extends { roomNumber: string }>(rooms: T[]): T | null {
  if (rooms.length === 0) {
    return null;
  }
  return [...rooms].sort((a, b) =>
    a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
  )[0];
}
