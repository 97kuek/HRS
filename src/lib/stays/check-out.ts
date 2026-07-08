import type { ApiErrorCode } from "@/lib/api/response";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 滞在中の宿泊が無い場合の区分（E1 / E2）。 */
export type MissingStayRejection = {
  code: Extract<ApiErrorCode, "STAY_NOT_FOUND" | "ALREADY_CHECKED_OUT">;
  status: number;
  message: string;
};

/**
 * 部屋番号に滞在中(checkedOutAt=null)の宿泊が無いとき、E1/E2 を区分する（#11 msg3-4）。
 * - その部屋に過去の宿泊が1件でもあれば、既にチェックアウト済みとみなす（E2）。
 * - 1件も無ければ、宿泊が存在しない（E1）。
 * DB に触れない純関数なので単体テスト可能（#48）。
 */
export function classifyMissingStay(anyStayExists: boolean): MissingStayRejection {
  if (anyStayExists) {
    return {
      code: "ALREADY_CHECKED_OUT",
      status: 409,
      message: "この部屋は既にチェックアウト済みです。",
    };
  }
  return {
    code: "STAY_NOT_FOUND",
    status: 404,
    message: "指定された部屋番号に対応する滞在中の宿泊が見つかりません。",
  };
}

/** 泊数を計算する（チェックイン日〜チェックアウト日、UTC 暦日ベース）。 */
export function calculateNights(checkInDate: Date, checkOutDate: Date): number {
  return Math.round((checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY);
}

/** 宿泊料金を計算する（#11 msg5）。baseRate × 泊数。 */
export function calculateCharge(params: { baseRate: number; nights: number }): number {
  return params.baseRate * params.nights;
}
