import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  roomType: {
    findMany: vi.fn(),
  },
  reservation: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/availability/calendar/route";

function makeRequest(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return new Request(`http://localhost/api/availability/calendar?${params}`);
}

describe("GET /api/availability/calendar — 結合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.roomType.findMany.mockResolvedValue([
      { id: "rt-1", capacity: 2, _count: { rooms: 2 } },
      { id: "rt-2", capacity: 4, _count: { rooms: 1 } },
    ]);
    mockPrisma.reservation.findMany.mockResolvedValue([
      {
        roomTypeId: "rt-1",
        checkInDate: new Date("2030-08-10T00:00:00.000Z"),
        checkOutDate: new Date("2030-08-12T00:00:00.000Z"),
      },
    ]);
  });

  it("年月と人数から月別の日別空室数を返す", async () => {
    const response = await GET(makeRequest({ year: "2030", month: "8", guestCount: "2" }));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      year: number;
      month: number;
      days: { date: string; availableCount: number; status: string }[];
    };
    expect(body.year).toBe(2030);
    expect(body.month).toBe(8);
    expect(body.days).toHaveLength(31);
    expect(body.days.find((day) => day.date === "2030-08-10")).toMatchObject({
      availableCount: 2,
      status: "limited",
    });
  });

  it("不正な条件は 400 VALIDATION_ERROR", async () => {
    const response = await GET(makeRequest({ year: "2030", month: "13", guestCount: "2" }));

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
