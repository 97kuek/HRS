import { describe, expect, it } from "vitest";

import { addDaysToDateOnly } from "@/lib/date-only";

describe("addDaysToDateOnly", () => {
  it("UTC日付として日数を加算する", () => {
    expect(addDaysToDateOnly("2026-07-01", 1)).toBe("2026-07-02");
  });

  it("月をまたいで日数を減算する", () => {
    expect(addDaysToDateOnly("2026-08-01", -1)).toBe("2026-07-31");
  });
});
