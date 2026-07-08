import { describe, expect, it } from "vitest";
import { evaluateCheckIn, pickAssignableRoom } from "@/lib/reservations/check-in";

const TODAY = new Date("2026-07-05T00:00:00.000Z");
const TOMORROW = new Date("2026-07-06T00:00:00.000Z");

describe("evaluateCheckIn", () => {
  it("RESERVED かつ今日がチェックイン日ならOK", () => {
    const result = evaluateCheckIn({ status: "RESERVED", checkInDate: TODAY, today: TODAY });
    expect(result.ok).toBe(true);
  });

  it("RESERVED でもチェックイン日でなければ NOT_CHECKIN_DATE", () => {
    const result = evaluateCheckIn({ status: "RESERVED", checkInDate: TOMORROW, today: TODAY });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NOT_CHECKIN_DATE");
      expect(result.status).toBe(400);
    }
  });

  it("CHECKED_IN は INVALID_RESERVATION_STATUS (409)", () => {
    const result = evaluateCheckIn({ status: "CHECKED_IN", checkInDate: TODAY, today: TODAY });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_RESERVATION_STATUS");
      expect(result.status).toBe(409);
    }
  });

  it("CANCELLED は INVALID_RESERVATION_STATUS (409)", () => {
    const result = evaluateCheckIn({ status: "CANCELLED", checkInDate: TODAY, today: TODAY });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_RESERVATION_STATUS");
    }
  });

  it("CHECKED_OUT は INVALID_RESERVATION_STATUS (409)", () => {
    const result = evaluateCheckIn({ status: "CHECKED_OUT", checkInDate: TODAY, today: TODAY });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_RESERVATION_STATUS");
    }
  });
});

describe("pickAssignableRoom", () => {
  it("空配列は null を返す", () => {
    expect(pickAssignableRoom([])).toBeNull();
  });

  it("1件のみの場合はその部屋を返す", () => {
    const rooms = [{ roomNumber: "101", id: "r1" }];
    expect(pickAssignableRoom(rooms)).toEqual({ roomNumber: "101", id: "r1" });
  });

  it("部屋番号昇順で最小の部屋を返す", () => {
    const rooms = [
      { roomNumber: "203", id: "r3" },
      { roomNumber: "101", id: "r1" },
      { roomNumber: "102", id: "r2" },
    ];
    expect(pickAssignableRoom(rooms)?.roomNumber).toBe("101");
  });

  it("数値順で比較する（'2' < '10' にならない）", () => {
    const rooms = [
      { roomNumber: "10", id: "r10" },
      { roomNumber: "2", id: "r2" },
      { roomNumber: "1", id: "r1" },
    ];
    expect(pickAssignableRoom(rooms)?.roomNumber).toBe("1");
  });
});
