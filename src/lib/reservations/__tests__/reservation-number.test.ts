import { describe, expect, it } from "vitest";
import { generateReservationNumber } from "@/lib/reservations/reservation-number";

describe("generateReservationNumber", () => {
  const checkIn = new Date("2026-07-01T00:00:00.000Z");

  it("HRS-YYYYMMDD-XXXX 形式を返す", () => {
    const num = generateReservationNumber(checkIn);
    expect(num).toMatch(/^HRS-\d{8}-\d{4}$/);
  });

  it("YYYYMMDD 部分がチェックイン日（UTC）と一致する", () => {
    const num = generateReservationNumber(checkIn);
    expect(num.slice(4, 12)).toBe("20260701");
  });

  it("XXXX 部分が 4 桁ゼロ埋めになっている", () => {
    // 1000 回生成して 4 桁未満にならないことを確認
    for (let i = 0; i < 1000; i++) {
      const num = generateReservationNumber(checkIn);
      expect(num.slice(13)).toHaveLength(4);
    }
  });
});
