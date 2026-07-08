/**
 * 結合テスト: POST /api/reservations（予約作成）
 *
 * テスト観点: ブラックボックス（API 仕様に基づく）
 * テスト戦略: ボトムアップ増加テスト — 純関数の単体テスト (#48) の上位層
 * Prisma と Email 送信をモックし、DB 接続なしで実行できる。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock ファクトリより先に評価されるよう vi.hoisted で定義する
const mockTx = vi.hoisted(() => ({
  reservation: {
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  roomType: { findUnique: vi.fn() },
  room: { count: vi.fn() },
  guest: { create: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendReservationConfirmation: vi.fn(),
}));

import { POST } from "@/app/api/reservations/route";

// 2030 年の未来日付を使用（validateReservationCondition の過去日チェックを回避）
const CHECK_IN = "2030-10-01";
const CHECK_OUT = "2030-10-03"; // 2泊
const VALID_BODY = {
  checkInDate: CHECK_IN,
  checkOutDate: CHECK_OUT,
  guestCount: 2,
  roomTypeId: "rt-standard",
  guest: { name: "山田 太郎", email: "taro@example.com" },
};

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/reservations — 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック: 2室あり、重複予約なし、作成成功
    mockTx.roomType.findUnique.mockResolvedValue({
      id: "rt-standard",
      name: "スタンダード",
      capacity: 4,
      baseRate: 10000,
    });
    mockTx.room.count.mockResolvedValue(2);
    mockTx.reservation.count.mockResolvedValue(0);
    mockTx.guest.create.mockResolvedValue({ id: "guest-001" });
    mockTx.reservation.create.mockResolvedValue({
      reservationNumber: "HRS-20301001-0001",
      roomType: { name: "スタンダード", baseRate: 10000 },
      checkInDate: new Date(`${CHECK_IN}T00:00:00.000Z`),
      checkOutDate: new Date(`${CHECK_OUT}T00:00:00.000Z`),
      guestCount: 2,
    });
  });

  // ── 正常系 ──────────────────────────────────────────────────
  describe("正常系", () => {
    it("有効な入力で 201 と予約情報を返す", async () => {
      const response = await POST(makeRequest(VALID_BODY));
      expect(response.status).toBe(201);
      const body = await response.json() as { reservation: Record<string, unknown> };
      expect(body.reservation.reservationNumber).toMatch(/^HRS-\d{8}-\d{4}$/);
      expect(body.reservation.nights).toBe(2);
      expect(body.reservation.totalCharge).toBe(20000); // 10000 × 2泊
    });

    it("電話番号（任意）を省略しても 201 を返す", async () => {
      const { guest, ...rest } = VALID_BODY;
      const response = await POST(
        makeRequest({ ...rest, guest: { name: guest.name, email: guest.email } }),
      );
      expect(response.status).toBe(201);
    });
  });

  // ── 例外系列 E1: 入力条件が不正 ──────────────────────────────
  describe("E1: 入力条件が不正", () => {
    it("roomTypeId なしは 400 VALIDATION_ERROR", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { roomTypeId, ...body } = VALID_BODY;
      const response = await POST(makeRequest(body));
      expect(response.status).toBe(400);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("guestCount が 0 は 400 VALIDATION_ERROR", async () => {
      const response = await POST(makeRequest({ ...VALID_BODY, guestCount: 0 }));
      expect(response.status).toBe(400);
    });

    it("checkOutDate が checkInDate と同日は 400 VALIDATION_ERROR", async () => {
      const response = await POST(
        makeRequest({ ...VALID_BODY, checkOutDate: CHECK_IN }),
      );
      expect(response.status).toBe(400);
    });
  });

  // ── 例外系列 E4: 利用者情報が不正 ────────────────────────────
  describe("E4: 利用者情報が不正", () => {
    it("guest.email なしは 400 VALIDATION_ERROR", async () => {
      const response = await POST(
        makeRequest({ ...VALID_BODY, guest: { name: "山田 太郎" } }),
      );
      expect(response.status).toBe(400);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("guest.name なしは 400 VALIDATION_ERROR", async () => {
      const response = await POST(
        makeRequest({ ...VALID_BODY, guest: { email: "taro@example.com" } }),
      );
      expect(response.status).toBe(400);
    });

    it("不正な email 形式は 400 VALIDATION_ERROR", async () => {
      const response = await POST(
        makeRequest({ ...VALID_BODY, guest: { name: "山田 太郎", email: "not-an-email" } }),
      );
      expect(response.status).toBe(400);
    });
  });

  // ── 部屋タイプ・定員・空室エラー ─────────────────────────────
  describe("部屋タイプ・定員・空室エラー", () => {
    it("部屋タイプが存在しない場合は 404 ROOM_TYPE_NOT_FOUND", async () => {
      mockTx.roomType.findUnique.mockResolvedValue(null);
      const response = await POST(makeRequest(VALID_BODY));
      expect(response.status).toBe(404);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("ROOM_TYPE_NOT_FOUND");
    });

    it("定員超過は 400 CAPACITY_EXCEEDED", async () => {
      mockTx.roomType.findUnique.mockResolvedValue({
        id: "rt-standard",
        name: "スタンダード",
        capacity: 1, // guestCount=2 より少ない
        baseRate: 10000,
      });
      const response = await POST(makeRequest(VALID_BODY));
      expect(response.status).toBe(400);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("CAPACITY_EXCEEDED");
    });

    it("E3: 確定直前に満室になった場合は 409 NO_AVAILABILITY", async () => {
      mockTx.room.count.mockResolvedValue(2);
      mockTx.reservation.count.mockResolvedValue(2); // 全部屋が予約済み
      const response = await POST(makeRequest(VALID_BODY));
      expect(response.status).toBe(409);
      const json = await response.json() as { error: { code: string } };
      expect(json.error.code).toBe("NO_AVAILABILITY");
    });
  });

  // ── リクエスト形式エラー ──────────────────────────────────────
  it("JSON でない body は 400 を返す", async () => {
    const response = await POST(
      new Request("http://localhost/api/reservations", {
        method: "POST",
        body: "invalid-json",
        headers: { "Content-Type": "text/plain" },
      }),
    );
    expect(response.status).toBe(400);
  });
});
