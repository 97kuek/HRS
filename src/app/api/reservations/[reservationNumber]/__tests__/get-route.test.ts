import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  reservation: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/reservations/[reservationNumber]/route";

const BASE_RESERVATION = {
  reservationNumber: "HRS-20260705-0001",
  status: "RESERVED" as const,
  checkInDate: new Date("2026-07-05T00:00:00.000Z"),
  checkOutDate: new Date("2026-07-07T00:00:00.000Z"),
  guestCount: 2,
  guest: { name: "山田 太郎", email: "taro@example.com", phone: "090-1234-5678" },
  roomType: { name: "ツイン", baseRate: 12000 },
  stay: null,
};

function makeRequest(familyName = "山田", givenName = "太郎") {
  const params = new URLSearchParams({ familyName, givenName });
  return new Request(`http://localhost/api/reservations/HRS-20260705-0001?${params}`);
}

function makeParams(reservationNumber = "HRS-20260705-0001") {
  return { params: Promise.resolve({ reservationNumber }) };
}

describe("GET /api/reservations/[reservationNumber] — 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reservation.findUnique.mockResolvedValue(BASE_RESERVATION);
  });

  describe("正常系", () => {
    it("小文字の予約番号を大文字へ正規化して検索する", async () => {
      const response = await GET(makeRequest(), makeParams("hrs-20260705-0001"));

      expect(response.status).toBe(200);
      expect(mockPrisma.reservation.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reservationNumber: "HRS-20260705-0001" } }),
      );
    });

    it("予約番号と氏名が一致すると予約詳細を返す", async () => {
      const response = await GET(makeRequest(), makeParams());

      expect(response.status).toBe(200);
      const body = (await response.json()) as { reservation: Record<string, unknown> };
      expect(body.reservation).toMatchObject({
        reservationNumber: "HRS-20260705-0001",
        roomTypeName: "ツイン",
        checkInDate: "2026-07-05",
        checkOutDate: "2026-07-07",
        nights: 2,
        guestCount: 2,
        guestName: "山田 太郎",
        email: "taro@example.com",
        phone: "090-1234-5678",
        status: "RESERVED",
        totalCharge: 24000,
        roomNumber: null,
      });
    });

    it("部屋番号が割り当て済みなら roomNumber を返す", async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        status: "CHECKED_IN",
        stay: { room: { roomNumber: "101" } },
      });

      const response = await GET(makeRequest(), makeParams());

      expect(response.status).toBe(200);
      const body = (await response.json()) as { reservation: { roomNumber: string } };
      expect(body.reservation.roomNumber).toBe("101");
    });

    it("電話番号が未登録なら phone は null を返す", async () => {
      mockPrisma.reservation.findUnique.mockResolvedValue({
        ...BASE_RESERVATION,
        guest: { ...BASE_RESERVATION.guest, phone: null },
      });

      const response = await GET(makeRequest(), makeParams());

      expect(response.status).toBe(200);
      const body = (await response.json()) as { reservation: { phone: string | null } };
      expect(body.reservation.phone).toBeNull();
    });
  });

  describe("入力バリデーション", () => {
    it("予約番号の形式が不正な場合はDBを検索しない", async () => {
      const response = await GET(makeRequest(), makeParams("invalid"));

      expect(response.status).toBe(400);
      expect(mockPrisma.reservation.findUnique).not.toHaveBeenCalled();
    });

    it("姓が空の場合は 400 VALIDATION_ERROR", async () => {
      const response = await GET(makeRequest("", "太郎"), makeParams());

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
