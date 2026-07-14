import { describe, expect, it } from "vitest";

import { addDaysToDateOnly, todayInHotelDateOnly } from "@/lib/date-only";

describe("addDaysToDateOnly", () => {
  it("UTC日付として日数を加算する", () => {
    expect(addDaysToDateOnly("2026-07-01", 1)).toBe("2026-07-02");
  });

  it("月をまたいで日数を減算する", () => {
    expect(addDaysToDateOnly("2026-08-01", -1)).toBe("2026-07-31");
  });
});

describe("todayInHotelDateOnly", () => {
  it("UTCでは前日でもJSTの暦日を返す", () => {
    expect(todayInHotelDateOnly(new Date("2030-08-10T15:30:00.000Z"))).toBe("2030-08-11");
  });
});
