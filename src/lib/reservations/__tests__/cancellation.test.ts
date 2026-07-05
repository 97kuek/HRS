import { describe, expect, it } from "vitest";
import { evaluateCancellation } from "@/lib/reservations/cancellation";

describe("evaluateCancellation", () => {
  it("RESERVED はキャンセル可能", () => {
    const result = evaluateCancellation("RESERVED");
    expect(result.ok).toBe(true);
  });

  it("CANCELLED は 409 エラー", () => {
    const result = evaluateCancellation("CANCELLED");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_RESERVATION_STATUS");
      expect(result.status).toBe(409);
    }
  });

  it("CHECKED_IN は 409 エラー", () => {
    const result = evaluateCancellation("CHECKED_IN");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_RESERVATION_STATUS");
      expect(result.status).toBe(409);
    }
  });

  it("CHECKED_OUT は 409 エラー", () => {
    const result = evaluateCancellation("CHECKED_OUT");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_RESERVATION_STATUS");
      expect(result.status).toBe(409);
    }
  });

  it("ステータスごとにメッセージが異なる", () => {
    const cancelled = evaluateCancellation("CANCELLED");
    const checkedIn = evaluateCancellation("CHECKED_IN");
    const checkedOut = evaluateCancellation("CHECKED_OUT");
    if (!cancelled.ok && !checkedIn.ok && !checkedOut.ok) {
      expect(cancelled.message).not.toBe(checkedIn.message);
      expect(checkedIn.message).not.toBe(checkedOut.message);
    }
  });
});
