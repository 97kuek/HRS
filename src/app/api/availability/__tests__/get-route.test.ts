import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  roomType: { findMany: vi.fn() },
  reservation: { groupBy: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "@/app/api/availability/route";

describe("GET /api/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.roomType.findMany.mockResolvedValue([
      {
        id: "rt-twin",
        name: "ツイン",
        capacity: 2,
        baseRate: 12000,
        _count: { rooms: 3 },
      },
    ]);
    mockPrisma.reservation.groupBy.mockResolvedValue([]);
  });

  it("設計どおり roomTypes[].id を返す", async () => {
    const request = new Request(
      "http://localhost/api/availability?checkIn=2030-08-10&checkOut=2030-08-12&guestCount=2",
    );
    const response = await GET(request);
    const body = (await response.json()) as {
      roomTypes: Array<Record<string, unknown>>;
    };

    expect(response.status).toBe(200);
    expect(body.roomTypes[0]).toMatchObject({ id: "rt-twin", totalCharge: 24000 });
    expect(body.roomTypes[0]).not.toHaveProperty("roomTypeId");
  });

  it("不正な検索条件は400を返す", async () => {
    const response = await GET(
      new Request("http://localhost/api/availability?checkIn=x&guestCount=0"),
    );
    expect(response.status).toBe(400);
  });
});
