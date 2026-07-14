import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/email/send", () => ({ sendCheckOutReceipt: vi.fn() }));

import { POST } from "@/app/api/rooms/[roomNumber]/check-out/route";
import { GET } from "@/app/api/rooms/[roomNumber]/check-out/quote/route";

const params = (roomNumber: string) => ({ params: Promise.resolve({ roomNumber }) });

describe("チェックアウトAPIの入力検証", () => {
  it("見積もりの部屋番号形式が不正なら400", async () => {
    const response = await GET(new Request("http://localhost"), params("room-A"));
    expect(response.status).toBe(400);
  });

  it("支払金額の欠落を0円として扱わない", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "現金" }),
      }),
      params("101"),
    );
    const body = (await response.json()) as { error: { code: string; details: unknown[] } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("文字列の支払金額を受け付けない", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "12000", method: "現金" }),
      }),
      params("101"),
    );
    expect(response.status).toBe(400);
  });
});
