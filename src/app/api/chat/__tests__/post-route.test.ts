import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  roomType: {
    findMany: vi.fn(),
  },
  reservation: {
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { POST } from "@/app/api/chat/route";
import { resetChatRateLimitForTests } from "@/lib/chat/rate-limit";

function makeRequest(message: string, headers?: Record<string, string>) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ message }),
  });
}

describe("POST /api/chat — 読み取り専用予約支援チャット", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T00:00:00+09:00"));
    resetChatRateLimitForTests();
    process.env.CHAT_PROVIDER = "mock";
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    mockPrisma.roomType.findMany.mockResolvedValue([
      { id: "rt-1", name: "ツイン", capacity: 2, baseRate: 12000, _count: { rooms: 3 } },
    ]);
    mockPrisma.reservation.groupBy.mockResolvedValue([]);
    mockPrisma.reservation.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("空室質問に対して既存の空室検索結果を返す", async () => {
    const response = await POST(makeRequest("2名で2030-08-10に泊まれる部屋はありますか？"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      chat: {
        reply: string;
        toolName: string;
        links: { href: string }[];
        cards: { title: string; rows: { label: string; value: string }[] }[];
      };
    };
    expect(body.chat.toolName).toBe("search_availability");
    expect(body.chat.reply).toContain("空室があります");
    expect(body.chat.cards[0].title).toBe("ツイン");
    expect(body.chat.cards[0].rows.some((row) => row.label === "残室")).toBe(true);
    expect(body.chat.links[0].href).toBe("/reservations/new");
  });

  it("「明後日」を相対日付として解釈する", async () => {
    const response = await POST(makeRequest("明後日、2人で泊まれる部屋はありますか？"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { toolName: string; reply: string } };
    expect(body.chat.toolName).toBe("search_availability");
    expect(body.chat.reply).toContain("2026-07-12");
  });

  it("漢字・ひらがなの人数表現を解釈する", async () => {
    const response = await POST(makeRequest("2030-08-10に三人で泊まりたいです"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { toolName: string; reply: string } };
    expect(body.chat.toolName).toBe("search_availability");
    expect(body.chat.reply).toContain("3名");
  });

  it("キャンセル料質問に対して一般ポリシーを返す", async () => {
    const response = await POST(makeRequest("キャンセル料のルールを教えてください"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      chat: { reply: string; toolName: string; cards: { title: string }[] };
    };
    expect(body.chat.toolName).toBe("explain_cancellation_policy");
    expect(body.chat.reply).toContain("チェックイン日前日まで無料");
    expect(body.chat.cards[0].title).toBe("キャンセルポリシー");
  });

  it("予約番号や連絡先を含む質問は専用画面へ誘導する", async () => {
    const response = await POST(makeRequest("HRS-20300810-0001 の予約を確認して"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { reply: string; links: { href: string }[] } };
    expect(body.chat.reply).toContain("個人情報はこのチャットでは扱えません");
    expect(body.chat.links.some((link) => link.href === "/reservations/lookup")).toBe(true);
  });

  it("確認できる情報がない質問には推測回答しない", async () => {
    process.env.CHAT_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest("朝食のメニューを教えてください"));

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPrisma.roomType.findMany).not.toHaveBeenCalled();
    const body = (await response.json()) as { chat: { reply: string; toolName?: string } };
    expect(body.chat.toolName).toBeUndefined();
    expect(body.chat.reply).toContain("推測で回答しません");
  });

  it("DB接続不可の場合はチャット内で案内する", async () => {
    mockPrisma.roomType.findMany.mockRejectedValueOnce(new Error("Can't reach database server"));

    const response = await POST(makeRequest("部屋タイプと料金を教えてください"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { reply: string } };
    expect(body.chat.reply).toContain("空室データに接続できません");
  });

  it("GeminiのgenerateContent functionCallを利用できる", async () => {
    process.env.CHAT_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-flash-latest";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ functionCall: { name: "list_room_types", args: {} } }],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest("部屋タイプと料金を教えてください"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-goog-api-key": "test-key" }),
      }),
    );
    const body = (await response.json()) as {
      chat: { provider: string; toolName: string; cards: { title: string }[] };
    };
    expect(body.chat.provider).toBe("gemini");
    expect(body.chat.toolName).toBe("list_room_types");
    expect(body.chat.cards[0].title).toBe("ツイン");
  });

  it("Gemini設定でもキャンセル料質問はローカルでポリシー案内に固定する", async () => {
    process.env.CHAT_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest("キャンセル料のルールを教えてください"));

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    const body = (await response.json()) as {
      chat: { provider: string; toolName: string; reply: string };
    };
    expect(body.chat.provider).toBe("gemini");
    expect(body.chat.toolName).toBe("explain_cancellation_policy");
    expect(body.chat.reply).toContain("チェックイン日前日まで無料");
  });

  it("予約確認などの手順案内に回答できる", async () => {
    const response = await POST(makeRequest("予約確認の方法を教えてください"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      chat: {
        toolName: string;
        reply: string;
        links: { href: string }[];
        cards: { title: string }[];
      };
    };
    expect(body.chat.toolName).toBe("guide_procedure");
    expect(body.chat.reply).toContain("予約確認画面");
    expect(body.chat.cards[0].title).toBe("予約確認の手順");
    expect(body.chat.links.some((link) => link.href === "/reservations/lookup")).toBe(true);
  });

  it("AI呼び出し失敗時はローカル判定へフォールバックしたことを返す", async () => {
    process.env.CHAT_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await POST(makeRequest("部屋タイプと料金を教えてください"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { toolName: string; usedFallback?: boolean } };
    expect(body.chat.toolName).toBe("list_room_types");
    expect(body.chat.usedFallback).toBe(true);
  });

  it("今月の空き状況は現在年月で解釈する", async () => {
    const response = await POST(makeRequest("今月の2名の空き状況を教えてください"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { toolName: string; reply: string } };
    expect(body.chat.toolName).toBe("availability_calendar");
    expect(body.chat.reply).toContain("2026年7月");
    expect(body.chat.reply).not.toContain("2024年");
  });

  it("AIが過去年のカレンダー引数を返しても現在以降の年月に補正する", async () => {
    process.env.CHAT_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "availability_calendar",
                    args: { year: 2024, month: 7, guestCount: 2 },
                  },
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest("空室カレンダーを見せてください"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { chat: { toolName: string; reply: string } };
    expect(body.chat.toolName).toBe("availability_calendar");
    expect(body.chat.reply).toContain("2026年7月");
    expect(body.chat.reply).not.toContain("2024年");
  });

  it("短時間の連続送信は 429 RATE_LIMIT_EXCEEDED", async () => {
    const headers = { "x-forwarded-for": "203.0.113.10" };

    for (let index = 0; index < 12; index += 1) {
      const response = await POST(makeRequest("キャンセル料のルールを教えてください", headers));
      expect(response.status).toBe(200);
    }

    const response = await POST(makeRequest("キャンセル料のルールを教えてください", headers));

    expect(response.status).toBe(429);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("空メッセージは 400 VALIDATION_ERROR", async () => {
    const response = await POST(makeRequest(""));

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
