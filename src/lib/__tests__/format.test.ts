import { describe, expect, it } from "vitest";

import { calculateNightsFromDateOnly, formatStayRange, formatYen } from "@/lib/format";

describe("formatYen", () => {
  it("日本語ロケールの3桁区切りで円表記する", () => {
    expect(formatYen(1234567)).toBe("¥1,234,567");
  });
});

describe("calculateNightsFromDateOnly", () => {
  it("日付のみ文字列から泊数を計算する", () => {
    expect(calculateNightsFromDateOnly("2026-07-01", "2026-07-04")).toBe(3);
  });
});

describe("formatStayRange", () => {
  it("泊数と人数を含む宿泊期間を整形する", () => {
    expect(
      formatStayRange({
        checkInDate: "2026-07-01",
        checkOutDate: "2026-07-03",
        guestCount: 2,
        separator: "〜",
      }),
    ).toBe("2026-07-01 〜 2026-07-03（2泊・2名）");
  });
});
