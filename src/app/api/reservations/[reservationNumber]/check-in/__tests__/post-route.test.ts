/**
 * 結合テスト: POST /api/reservations/[reservationNumber]/check-in（チェックイン）
 *
 * テスト観点: ブラックボックス（API 仕様に基づく）
 * テスト戦略: ボトムアップ増加テスト — evaluateCheckIn / pickAssignableRoom の単体テスト (#48) の上位層
 *
 * 注意: todayInHotelTz() は現在時刻に依存するため、テスト用に固定値（2026-07-05 JST）をモックする。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// チェックイン日のテスト基準日（JST 2026-07-05 = UTC 00:00）
const TODAY_UTC = new Date("2026-07-05T00:00:00.000Z");
const TOMORROW_UTC = new Date("2026-07-06T00:00:00.000Z");

const mockTx = vi.hoisted(() => ({
  reservation: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  room: { findMany: vi.fn() },
  stay: { create: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  },
}));

// todayInHotelTz のみ固定値にし、evaluateCheckIn / pickAssignableRoom は実装を使う
vi.mock("@/lib/reservations/check-in", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/reservations/check-in")>();
  return { ...original, todayInHotelTz: vi.fn(() => TODAY_UTC) };
});

import { POST } from "@/app/api/reservations/[reservationNumber]/check-in/route";

const RESERVED_RESERVATION = {
  reservationNumber: "HRS-20260705-0001",
  id: "res-001",
  status: "RESERVED" as const,
  checkInDate: TODAY_UTC,  // 今日がチェックイン日
  checkOutDate: TOMORROW_UTC,
  guestCount: 1,
  roomTypeId: "rt-standard",
  guest: { name: "山田 太郎" },
  roomType: { name: "スタンダード" },
};

const AVAILABLE_ROOM = { id: "room-101", roomNumber: "101" };

function makeRequest(familyName: string, givenName: string): Request {
  return new Request("http://localhost/api/reservations/HRS-20260705-0001/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ familyName, givenName }),
  });
}

function makeParams(reservationNumber = "HRS-20260705-0001") {
  return { params: Promise.resolve({ reservationNumber }) };
}

describe("POST /api/reservations/[reservationNumber]/check-in — 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.reservation.findUnique.mockResolvedValue(RESERVED_RESERVATION);
    mockTx.room.findMany.mockResolvedValue([AVAILABLE_ROOM]);
    mockTx.stay.create.mockResolvedValue({
      id: "stay-001",
      checkedInAt: new Date("2026-07-05T10:00:00.000Z"),
    });
    mockTx.reservation.update.mockResolvedValue({ ...RESERVED_RESERVATION, status: "CHECKED_IN" });
  });

  // ── 正常系 ──────────────────────────────────────────────────
  describe("正常系", () => {
    it("今日がチェックイン日で部屋があれば 200 と部屋番号を返す", async () => {
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(200);
      const body = await response.json() as { checkIn: Record<string, unknown> };
      expect(body.checkIn.roomNumber).toBe("101");
      expect(body.checkIn.reservationNumber).toBe("HRS-20260705-0001");
    });
  });

  // ── 入力バリデーション ─────────────────────────────────────
  describe("入力バリデーション", () => {
    it("familyName が空は 400 VALIDATION_ERROR", async () => {
      const response = await POST(makeRequest("", "太郎"), makeParams());
      expect(response.status).toBe(400);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── 例外系列 E1: 予約が見つからない ──────────────────────────
  describe("E1: 予約が見つからない・名前不一致", () => {
    it("予約番号が存在しない場合は 404 RESERVATION_NOT_FOUND", async () => {
      mockTx.reservation.findUnique.mockResolvedValue(null);
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(404);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("RESERVATION_NOT_FOUND");
    });

    it("氏名が一致しない場合は 404 RESERVATION_NOT_FOUND", async () => {
      const response = await POST(makeRequest("佐藤", "花子"), makeParams());
      expect(response.status).toBe(404);
    });
  });

  // ── 例外系列 E2: 当日がチェックイン可能日でない ───────────────
  describe("E2: 当日がチェックイン可能日でない", () => {
    it("チェックイン日が明日の予約は 400 NOT_CHECKIN_DATE", async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        ...RESERVED_RESERVATION,
        checkInDate: TOMORROW_UTC, // 明日がチェックイン日
      });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(400);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("NOT_CHECKIN_DATE");
    });
  });

  // ── 例外系列 E3: 既にチェックイン済み ──────────────────────
  describe("E3: 既にチェックイン済み", () => {
    it("CHECKED_IN 予約は 409 INVALID_RESERVATION_STATUS", async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        ...RESERVED_RESERVATION,
        status: "CHECKED_IN",
      });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("INVALID_RESERVATION_STATUS");
    });

    it("CANCELLED 予約は 409 INVALID_RESERVATION_STATUS", async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        ...RESERVED_RESERVATION,
        status: "CANCELLED",
      });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
    });
  });

  // ── 例外系列 E4: 割り当て可能な部屋がない ────────────────────
  describe("E4: 割り当て可能な部屋がない", () => {
    it("空き部屋なしの場合は 409 NO_ASSIGNABLE_ROOM", async () => {
      mockTx.room.findMany.mockResolvedValue([]); // 空き部屋なし
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("NO_ASSIGNABLE_ROOM");
    });
  });
});
