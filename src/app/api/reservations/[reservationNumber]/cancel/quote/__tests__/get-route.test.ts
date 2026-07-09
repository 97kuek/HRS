import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  reservation: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/reservations/[reservationNumber]/cancel/quote/route";

const BASE_RESERVATION = {
  reservationNumber: "HRS-20260705-0001",
  status: "RESERVED" as const,
  checkInDate: new Date("2030-08-05T00:00:00.000Z"),
  checkOutDate: new Date("2030-08-07T00:00:00.000Z"),
  guestCount: 2,
  guest: { name: "山田 太郎" },
  roomType: { name: "ツイン", baseRate: 10000 },
};

function makeRequest(familyName = "山田", givenName = "太郎") {
  const params = new URLSearchParams({ familyName, givenName });
  return new Request(`http://localhost/api/reservations/HRS-20260705-0001/cancel/quote?${params}`);
}

function makeParams(reservationNumber = "HRS-20260705-0001") {
  return { params: Promise.resolve({ reservationNumber }) };
}

describe("GET /api/reservations/[reservationNumber]/cancel/quote — 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
  });

  describe("正常系", () => {
    it("予約済みならキャンセル可能な quote を返す", async () => {
      const response = await GET(makeRequest(), makeParams());

      expect(response.status).toBe(200);
      const body = (await response.json()) as { quote: Record<string, unknown> };
      expect(body.quote).toMatchObject({
        reservationNumber: "HRS-20260705-0001",
        roomTypeName: "ツイン",
        checkInDate: "2030-08-05",
        checkOutDate: "2030-08-07",
        guestCount: 2,
        totalCharge: 20000,
        cancellationFee: 0,
        cancellationPolicy: "前日まで無料",
        status: "RESERVED",
        cancelable: true,
        reason: null,
      });
    });

    it("チェックイン済みなら内容とキャンセル不可理由を返す", async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: "CHECKED_IN",
      });

      const response = await GET(makeRequest(), makeParams());

      expect(response.status).toBe(200);
      const body = (await response.json()) as { quote: { cancelable: boolean; reason: string } };
      expect(body.quote.cancelable).toBe(false);
      expect(body.quote.reason).toContain("チェックイン済み");
    });
  });

  describe("入力バリデーション", () => {
    it("名が空の場合は 400 VALIDATION_ERROR", async () => {
      const response = await GET(makeRequest("山田", ""), makeParams());

      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: { code: string } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("予約番号・氏名の照合", () => {
    it("予約番号が存在しない場合は 404 RESERVATION_NOT_FOUND", async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue(null);

      const response = await GET(makeRequest(), makeParams());

      expect(response.status).toBe(404);
      const body = (await response.json()) as { error: { code: string } };
      expect(body.error.code).toBe("RESERVATION_NOT_FOUND");
    });

    it("氏名が一致しない場合は 404 RESERVATION_NOT_FOUND", async () => {
      const response = await GET(makeRequest("佐藤", "花子"), makeParams());

      expect(response.status).toBe(404);
      const body = (await response.json()) as { error: { code: string } };
      expect(body.error.code).toBe("RESERVATION_NOT_FOUND");
    });
  });
});
