import { describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/prisma", () => ({ prisma: { roomType: { findMany } } }));

import { GET } from "@/app/api/room-types/route";

describe("GET /api/room-types", () => {
  it("表示に必要な部屋タイプ一覧を返す", async () => {
    findMany.mockResolvedValue([{ id: "rt-1", name: "シングル", capacity: 1, baseRate: 12000 }]);

    const response = await GET();
    const body = (await response.json()) as { roomTypes: unknown[] };

    expect(response.status).toBe(200);
    expect(body.roomTypes).toHaveLength(1);
  });
});
