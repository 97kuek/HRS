/**
 * 結合テスト: POST /api/reservations/[reservationNumber]/cancel（予約キャンセル）
 *
 * テスト観点: ブラックボックス（API 仕様に基づく）
 * テスト戦略: ボトムアップ増加テスト — evaluateCancellation の単体テスト (#48) の上位層
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = vi.hoisted(() => ({
  reservation: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendReservationCancellation: vi.fn(),
}));

import { POST } from "@/app/api/reservations/[reservationNumber]/cancel/route";

// テスト共通の予約データ（RESERVED 状態・氏名が「山田 太郎」）
const RESERVED_RESERVATION = {
  reservationNumber: "HRS-20260701-0001",
  id: "res-001",
  status: "RESERVED" as const,
  checkInDate: new Date("2026-07-01T00:00:00.000Z"),
  checkOutDate: new Date("2026-07-03T00:00:00.000Z"),
  guestCount: 2,
  guest: { name: "山田 太郎", email: "taro@example.com" },
  roomType: { name: "スタンダード" },
};

function makeRequest(familyName: string, givenName: string): Request {
  return new Request("http://localhost/api/reservations/HRS-20260701-0001/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ familyName, givenName }),
  });
}

function makeParams(reservationNumber = "HRS-20260701-0001") {
  return { params: Promise.resolve({ reservationNumber }) };
}

describe("POST /api/reservations/[reservationNumber]/cancel — 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.reservation.findUnique.mockResolvedValue(RESERVED_RESERVATION);
    mockTx.reservation.updateMany.mockResolvedValue({ count: 1 });
  });

  // ── 正常系 ──────────────────────────────────────────────────
  describe("正常系", () => {
    it("RESERVED 予約を正しい氏名でキャンセルすると 200 と cancellation を返す", async () => {
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(200);
      const body = await response.json() as { cancellation: Record<string, unknown> };
      expect(body.cancellation.status).toBe("CANCELLED");
      expect(body.cancellation.reservationNumber).toBe("HRS-20260701-0001");
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

    it("givenName が空は 400 VALIDATION_ERROR", async () => {
      const response = await POST(makeRequest("山田", ""), makeParams());
      expect(response.status).toBe(400);
    });
  });

  // ── 例外系列 E1: 予約が見つからない / 名前不一致 ─────────────
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
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("RESERVATION_NOT_FOUND");
    });
  });

  // ── 例外系列 E2: キャンセルできない状態 ────────────────────
  describe("E2: キャンセルできない状態", () => {
    it("CANCELLED 予約は 409 INVALID_RESERVATION_STATUS", async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        ...RESERVED_RESERVATION,
        status: "CANCELLED",
      });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("INVALID_RESERVATION_STATUS");
    });

    it("CHECKED_IN 予約は 409 INVALID_RESERVATION_STATUS", async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        ...RESERVED_RESERVATION,
        status: "CHECKED_IN",
      });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
    });

    it("CHECKED_OUT 予約は 409 INVALID_RESERVATION_STATUS", async () => {
      mockTx.reservation.findUnique.mockResolvedValue({
        ...RESERVED_RESERVATION,
        status: "CHECKED_OUT",
      });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
    });

    it("find→update 間に状態が変化した場合（updateMany count=0）は 409", async () => {
      mockTx.reservation.updateMany.mockResolvedValue({ count: 0 });
      const response = await POST(makeRequest("山田", "太郎"), makeParams());
      expect(response.status).toBe(409);
    });
  });
});
