import { describe, expect, it } from "vitest";
import { calculateCancellationPolicy, evaluateCancellation } from "@/lib/reservations/cancellation";

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

describe("calculateCancellationPolicy", () => {
  it("チェックイン日前日まではキャンセル料無料", () => {
    const policy = calculateCancellationPolicy({
      checkInDate: new Date("2026-07-10T00:00:00.000Z"),
      checkOutDate: new Date("2026-07-12T00:00:00.000Z"),
      baseRate: 12000,
      today: new Date("2026-07-09T12:00:00.000Z"),
    });

    expect(policy.totalCharge).toBe(24000);
    expect(policy.cancellationFee).toBe(0);
    expect(policy.rate).toBe(0);
  });

  it("チェックイン当日は宿泊料金の50%", () => {
    const policy = calculateCancellationPolicy({
      checkInDate: new Date("2026-07-10T00:00:00.000Z"),
      checkOutDate: new Date("2026-07-12T00:00:00.000Z"),
      baseRate: 12000,
      today: new Date("2026-07-10T00:00:00.000Z"),
    });

    expect(policy.totalCharge).toBe(24000);
    expect(policy.cancellationFee).toBe(12000);
    expect(policy.rate).toBe(0.5);
  });

  it("チェックイン予定日後は宿泊料金の100%", () => {
    const policy = calculateCancellationPolicy({
      checkInDate: new Date("2026-07-10T00:00:00.000Z"),
      checkOutDate: new Date("2026-07-12T00:00:00.000Z"),
      baseRate: 12000,
      today: new Date("2026-07-11T00:00:00.000Z"),
    });

    expect(policy.totalCharge).toBe(24000);
    expect(policy.cancellationFee).toBe(24000);
    expect(policy.rate).toBe(1);
  });
});
