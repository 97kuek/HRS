import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  sendCheckInReminder: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { reservation: { findMany: mocks.findMany } },
}));
vi.mock("@/lib/email/send", () => ({ sendCheckInReminder: mocks.sendCheckInReminder }));

import { GET } from "@/app/api/cron/check-in-reminder/route";

const reservation = (number: string) => ({
  reservationNumber: number,
  checkInDate: new Date("2030-08-11T00:00:00.000Z"),
  checkOutDate: new Date("2030-08-12T00:00:00.000Z"),
  guestCount: 2,
  guest: { name: "山田 太郎", email: `${number}@example.com` },
  roomType: { name: "ツイン" },
});

describe("GET /api/cron/check-in-reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("送信成功件数だけをsentへ含める", async () => {
    mocks.findMany.mockResolvedValue([reservation("1"), reservation("2")]);
    mocks.sendCheckInReminder
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });

    const response = await GET(
      new Request("http://localhost/api/cron/check-in-reminder", {
        headers: { Authorization: "Bearer test-secret" },
      }),
    );
    const body = (await response.json()) as { sent: number };

    expect(response.status).toBe(200);
    expect(body.sent).toBe(1);
  });

  it("認証に失敗すると401を返す", async () => {
    const response = await GET(new Request("http://localhost/api/cron/check-in-reminder"));
    expect(response.status).toBe(401);
  });
});
