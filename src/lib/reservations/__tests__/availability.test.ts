import { describe, expect, it } from "vitest";
import { validateReservationCondition } from "@/lib/reservations/availability";

// todayUtc() は内部で使われるため、過去にならない日付を使う
const FUTURE_IN = "2030-08-01";
const FUTURE_OUT = "2030-08-03";

describe("validateReservationCondition", () => {
  it("正常な入力はOK", () => {
    const result = validateReservationCondition({
      checkInDate: FUTURE_IN,
      checkOutDate: FUTURE_OUT,
      guestCount: 2,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nights).toBe(2);
      expect(result.value.guestCount).toBe(2);
    }
  });

  it("チェックアウト ≤ チェックイン はエラー", () => {
    const result = validateReservationCondition({
      checkInDate: FUTURE_OUT,
      checkOutDate: FUTURE_IN,
      guestCount: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "checkOutDate")).toBe(true);
    }
  });

  it("同日チェックイン・チェックアウトはエラー（0泊）", () => {
    const result = validateReservationCondition({
      checkInDate: FUTURE_IN,
      checkOutDate: FUTURE_IN,
      guestCount: 1,
    });
    expect(result.ok).toBe(false);
  });

  it("31泊超はエラー", () => {
    const result = validateReservationCondition({
      checkInDate: "2030-08-01",
      checkOutDate: "2030-09-02", // 32泊
      guestCount: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "checkOutDate")).toBe(true);
    }
  });

  it("日付フォーマット不正はエラー", () => {
    const result = validateReservationCondition({
      checkInDate: "2030/08/01",
      checkOutDate: FUTURE_OUT,
      guestCount: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "checkInDate")).toBe(true);
    }
  });

  it("存在しない日付（2月31日）はエラー", () => {
    const result = validateReservationCondition({
      checkInDate: "2030-02-31",
      checkOutDate: FUTURE_OUT,
      guestCount: 1,
    });
    expect(result.ok).toBe(false);
  });

  it("guestCount が 0 はエラー", () => {
    const result = validateReservationCondition({
      checkInDate: FUTURE_IN,
      checkOutDate: FUTURE_OUT,
      guestCount: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "guestCount")).toBe(true);
    }
  });

  it("guestCount が 11 はエラー", () => {
    const result = validateReservationCondition({
      checkInDate: FUTURE_IN,
      checkOutDate: FUTURE_OUT,
      guestCount: 11,
    });
    expect(result.ok).toBe(false);
  });

  it("requireRoomType=true で roomTypeId 省略はエラー", () => {
    const result = validateReservationCondition(
      { checkInDate: FUTURE_IN, checkOutDate: FUTURE_OUT, guestCount: 1 },
      { requireRoomType: true },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "roomTypeId")).toBe(true);
    }
  });

  it("requireRoomType=true で roomTypeId を渡せばOK", () => {
    const result = validateReservationCondition(
      {
        checkInDate: FUTURE_IN,
        checkOutDate: FUTURE_OUT,
        guestCount: 1,
        roomTypeId: "rt-001",
      },
      { requireRoomType: true },
    );
    expect(result.ok).toBe(true);
  });

  it("複数のエラーが同時に返る", () => {
    const result = validateReservationCondition({
      checkInDate: "invalid",
      checkOutDate: "invalid",
      guestCount: 0,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });
});
