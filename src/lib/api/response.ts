import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "ROOM_TYPE_NOT_FOUND"
  | "RESERVATION_NOT_FOUND"
  | "STAY_NOT_FOUND"
  | "NO_AVAILABILITY"
  | "NO_ASSIGNABLE_ROOM"
  | "INVALID_RESERVATION_STATUS"
  | "ALREADY_CHECKED_OUT"
  | "INVALID_STAY_CONDITION"
  | "CAPACITY_EXCEEDED"
  | "PAYMENT_AMOUNT_MISMATCH"
  | "INTERNAL_SERVER_ERROR";

export type ApiErrorDetail = {
  field: string;
  message: string;
};

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[],
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function internalServerError() {
  return apiError(500, "INTERNAL_SERVER_ERROR", "サーバーエラーが発生しました。");
}
