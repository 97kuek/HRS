import { describe, expect, it } from "vitest";
import { calculateCharge, calculateNights, classifyMissingStay } from "@/lib/stays/check-out";

describe("classifyMissingStay", () => {
  it("過去の宿泊がある場合は ALREADY_CHECKED_OUT (409)", () => {
    const result = classifyMissingStay(true);
    expect(result.code).toBe("ALREADY_CHECKED_OUT");
    expect(result.status).toBe(409);
  });

  it("宿泊が1件もない場合は STAY_NOT_FOUND (404)", () => {
    const result = classifyMissingStay(false);
    expect(result.code).toBe("STAY_NOT_FOUND");
    expect(result.status).toBe(404);
  });
});

describe("calculateNights", () => {
  it("1泊", () => {
    const checkIn = new Date("2026-07-01T00:00:00.000Z");
    const checkOut = new Date("2026-07-02T00:00:00.000Z");
    expect(calculateNights(checkIn, checkOut)).toBe(1);
  });

  it("5泊", () => {
    const checkIn = new Date("2026-07-01T00:00:00.000Z");
    const checkOut = new Date("2026-07-06T00:00:00.000Z");
    expect(calculateNights(checkIn, checkOut)).toBe(5);
  });

  it("月をまたぐ宿泊", () => {
    const checkIn = new Date("2026-07-30T00:00:00.000Z");
    const checkOut = new Date("2026-08-02T00:00:00.000Z");
    expect(calculateNights(checkIn, checkOut)).toBe(3);
  });
});

describe("calculateCharge", () => {
  it("1泊 × 1万円 = 1万円", () => {
    expect(calculateCharge({ baseRate: 10000, nights: 1 })).toBe(10000);
  });

  it("3泊 × 1万5千円 = 4万5千円", () => {
    expect(calculateCharge({ baseRate: 15000, nights: 3 })).toBe(45000);
  });

  it("baseRate が 0 なら 0", () => {
    expect(calculateCharge({ baseRate: 0, nights: 5 })).toBe(0);
  });
});
