import type { ReservationStatus } from "@prisma/client";

import type { ApiErrorCode } from "@/lib/api/response";

/** キャンセル不可の理由（RESERVED 以外）。 */
export type CancellationRejection = {
  code: Extract<ApiErrorCode, "INVALID_RESERVATION_STATUS">;
  status: number;
  message: string;
};

export type CancellationEvaluation = { ok: true } | ({ ok: false } & CancellationRejection);

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
