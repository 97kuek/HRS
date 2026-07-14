import { describe, expect, it } from "vitest";

import { matchesReservationGuest, validateReservationIdentity } from "@/lib/reservations/identity";

describe("validateReservationIdentity", () => {
  it("予約番号を大文字へ正規化する", () => {
    const result = validateReservationIdentity({
      reservationNumber: " hrs-20300810-0001 ",
      familyName: " 山田 ",
      givenName: " 太郎 ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        reservationNumber: "HRS-20300810-0001",
        familyName: "山田",
        givenName: "太郎",
      },
    });
  });

  it("型と形式が不正な項目をすべて返す", () => {
    const result = validateReservationIdentity({
      reservationNumber: 123,
      familyName: null,
      givenName: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.field)).toEqual([
        "reservationNumber",
        "familyName",
        "givenName",
      ]);
    }
  });
});

describe("matchesReservationGuest", () => {
  it("氏名内の連続空白を正規化して照合する", () => {
    expect(matchesReservationGuest("山田   太郎", { familyName: "山田", givenName: "太郎" })).toBe(
      true,
    );
  });
});
