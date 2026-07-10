import { addDaysToDateOnly } from "@/lib/date-only";
import { prisma } from "@/lib/db/prisma";
import { formatYen } from "@/lib/format";
import { getAvailabilityCalendar, searchAvailability, validateReservationCondition } from "@/lib/reservations/availability";
import { calculateCancellationPolicy } from "@/lib/reservations/cancellation";

export type ChatProvider = "gemini" | "groq" | "ollama" | "mock";

type ChatToolName =
  | "search_availability"
  | "availability_calendar"
  | "list_room_types"
  | "explain_cancellation_policy";

type ChatToolCall = {
  name: ChatToolName;
  arguments: Record<string, unknown>;
};

export type ChatResultCard = {
  title: string;
  description?: string;
  rows?: { label: string; value: string }[];
  tone?: "default" | "success" | "warning";
};

export type ChatAssistantResult = {
  reply: string;
  provider: ChatProvider;
  toolName?: ChatToolName;
  links: { href: string; label: string }[];
  cards?: ChatResultCard[];
};

type ToolExecutionResult = {
  reply: string;
  cards?: ChatResultCard[];
};

const CHAT_TOOLS = [
  {
    name: "search_availability",
    description: "指定されたチェックイン日・チェックアウト日・人数で予約可能な部屋タイプを調べる。",
    parameters: {
      type: "object",
      properties: {
        checkIn: { type: "string", description: "チェックイン日。YYYY-MM-DD形式。" },
        checkOut: { type: "string", description: "チェックアウト日。YYYY-MM-DD形式。省略時はチェックイン翌日。" },
        guestCount: { type: "integer", description: "宿泊人数。" },
      },
      required: ["checkIn", "guestCount"],
    },
  },
  {
    name: "availability_calendar",
    description: "指定された年月・人数で日別の空室数を確認する。",
    parameters: {
      type: "object",
      properties: {
        year: { type: "integer", description: "表示対象年。" },
        month: { type: "integer", description: "表示対象月。1から12。" },
        guestCount: { type: "integer", description: "宿泊人数。" },
      },
      required: ["year", "month", "guestCount"],
    },
  },
  {
    name: "list_room_types",
    description: "登録されている部屋タイプ、定員、1泊料金を一覧する。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "explain_cancellation_policy",
    description: "HRSのキャンセルポリシーを説明する。日付と料金があれば概算キャンセル料を計算する。",
    parameters: {
      type: "object",
      properties: {
        checkIn: { type: "string", description: "チェックイン日。YYYY-MM-DD形式。" },
        checkOut: { type: "string", description: "チェックアウト日。YYYY-MM-DD形式。" },
        baseRate: { type: "integer", description: "1泊料金。" },
      },
      required: [],
    },
  },
] as const;

const READ_ONLY_NOTICE =
  "このチャットでは予約の作成・確認・キャンセル確定は行いません。必要な場合は画面の手続きへ進んでください。";
const DATA_SOURCE_UNAVAILABLE_REPLY =
  "現在、空室データに接続できません。しばらくしてからもう一度お試しください。予約内容の確認やキャンセルは専用画面をご利用ください。";
const UNSUPPORTED_CHAT_REPLY =
  "このチャットで確認できるのは、空室状況、部屋タイプ、料金の目安、キャンセルポリシーだけです。確認できる情報がない内容については、推測で回答しません。";

function currentHotelDate() {
  return new Date();
}

function currentDateOnly() {
  return currentHotelDate().toISOString().slice(0, 10);
}

function resolveProvider(): ChatProvider {
  const configured = process.env.CHAT_PROVIDER?.toLowerCase();
  if (configured === "gemini" || configured === "groq" || configured === "ollama" || configured === "mock") {
    return configured;
  }
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  return "mock";
}

function containsSensitiveReservationInfo(message: string) {
  return (
    /HRS-\d{8}-\d{4}/i.test(message) ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message) ||
    /(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/.test(message)
  );
}

function isSupportedChatQuestion(message: string) {
  return /空室|空き|空いて|泊ま|宿泊|部屋|客室|料金|金額|価格|定員|人数|キャンセル|取消|取り消|カレンダー|予約/.test(
    message,
  );
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normalizeToolCall(value: unknown): ChatToolCall | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  const name = object.name;
  if (
    name !== "search_availability" &&
    name !== "availability_calendar" &&
    name !== "list_room_types" &&
    name !== "explain_cancellation_policy"
  ) {
    return null;
  }
  const args = object.arguments;
  return {
    name,
    arguments: args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {},
  };
}

function monthTargetFromRelativeText(message: string) {
  const today = currentHotelDate();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  if (message.includes("来月")) {
    return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  }
  if (message.includes("今月") || message.includes("当月")) {
    return { year, month };
  }
  return null;
}

function extractDate(message: string) {
  const iso = message.match(/\b(20\d{2})[-/年](\d{1,2})[-/月](\d{1,2})日?\b/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  const md = message.match(/\b(\d{1,2})[/-](\d{1,2})\b/);
  if (md) {
    const now = currentHotelDate();
    return `${now.getFullYear()}-${md[1].padStart(2, "0")}-${md[2].padStart(2, "0")}`;
  }
  return null;
}

function extractGuestCount(message: string) {
  const match = message.match(/(\d{1,2})\s*(?:名|人)/);
  return match ? Number(match[1]) : null;
}

function mockToolCall(message: string): ChatToolCall {
  const guestCount = extractGuestCount(message) ?? 2;
  const date = extractDate(message);
  const relativeMonth = monthTargetFromRelativeText(message);

  if (message.includes("キャンセル")) {
    return { name: "explain_cancellation_policy", arguments: date ? { checkIn: date } : {} };
  }
  if (message.includes("部屋") || message.includes("客室") || message.includes("料金")) {
    if (date || message.includes("空")) {
      const checkIn = date ?? addDaysToDateOnly(currentDateOnly(), 1);
      return { name: "search_availability", arguments: { checkIn, checkOut: addDaysToDateOnly(checkIn, 1), guestCount } };
    }
    return { name: "list_room_types", arguments: {} };
  }
  if (message.includes("カレンダー") || message.includes("空室") || relativeMonth) {
    const target = date ? new Date(`${date}T00:00:00.000Z`) : null;
    return {
      name: "availability_calendar",
      arguments: {
        year: relativeMonth?.year ?? target?.getUTCFullYear() ?? currentHotelDate().getFullYear(),
        month: relativeMonth?.month ?? (target ? target.getUTCMonth() + 1 : currentHotelDate().getMonth() + 1),
        guestCount,
      },
    };
  }
  return { name: "list_room_types", arguments: {} };
}

function deterministicToolCall(message: string): ChatToolCall | null {
  if (message.includes("キャンセル")) {
    const date = extractDate(message);
    return { name: "explain_cancellation_policy", arguments: date ? { checkIn: date } : {} };
  }
  const relativeMonth = monthTargetFromRelativeText(message);
  if (relativeMonth && (message.includes("空") || message.includes("空室") || message.includes("カレンダー"))) {
    return {
      name: "availability_calendar",
      arguments: { ...relativeMonth, guestCount: extractGuestCount(message) ?? 2 },
    };
  }
  return null;
}

async function getGeminiToolCall(message: string): Promise<ChatToolCall | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: {
          text: systemInstruction(),
        },
      },
      contents: {
        role: "user",
        parts: {
          text: message,
        },
      },
      tools: [
        {
          function_declarations: CHAT_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          })),
        },
      ],
      tool_config: {
        function_calling_config: {
          mode: "auto",
        },
      },
    }),
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { functionCall?: { name?: string; args?: Record<string, unknown> } }[] } }[];
  };
  const functionCall = data.candidates?.[0]?.content?.parts?.find((part) => part.functionCall)?.functionCall;
  return normalizeToolCall({ name: functionCall?.name, arguments: functionCall?.args });
}

async function getGroqToolCall(message: string): Promise<ChatToolCall | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction() },
        { role: "user", content: message },
      ],
      tools: CHAT_TOOLS.map((tool) => ({ type: "function", function: tool })),
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = (await response.json()) as {
    choices?: { message?: { tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
  };
  const tool = data.choices?.[0]?.message?.tool_calls?.[0]?.function;
  if (!tool?.name) return null;
  return normalizeToolCall({ name: tool.name, arguments: tool.arguments ? parseJsonObject(tool.arguments) : {} });
}

async function getOllamaToolCall(message: string): Promise<ChatToolCall | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: `${systemInstruction()}\n次のJSONだけを返してください: {"name":"tool_name","arguments":{}}`,
        },
        { role: "user", content: message },
      ],
      format: "json",
    }),
  });
  if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
  const data = (await response.json()) as { message?: { content?: string } };
  const parsed = data.message?.content ? parseJsonObject(data.message.content) : null;
  return normalizeToolCall(parsed);
}

function systemInstruction() {
  return [
    "あなたはHRS（Hotel Reservation System）の読み取り専用予約支援チャットです。",
    "予約作成、予約確認、キャンセル確定、チェックイン、チェックアウトは実行しません。",
    "予約番号、氏名、メールアドレス、電話番号などの個人情報は扱いません。",
    "利用者の意図に最も近い関数を1つだけ選びます。",
  ].join("\n");
}

async function getToolCall(provider: ChatProvider, message: string): Promise<ChatToolCall> {
  const deterministic = deterministicToolCall(message);
  if (deterministic) return deterministic;

  try {
    if (provider === "gemini") return (await getGeminiToolCall(message)) ?? mockToolCall(message);
    if (provider === "groq") return (await getGroqToolCall(message)) ?? mockToolCall(message);
    if (provider === "ollama") return (await getOllamaToolCall(message)) ?? mockToolCall(message);
  } catch (error) {
    console.warn(`Chat provider ${provider} failed. Falling back to mock intent detection.`, error);
  }
  return mockToolCall(message);
}

function numberArg(args: Record<string, unknown>, key: string) {
  const value = Number(args[key]);
  return Number.isInteger(value) ? value : undefined;
}

function stringArg(args: Record<string, unknown>, key: string) {
  return typeof args[key] === "string" ? String(args[key]) : undefined;
}

function futureMonthArg(args: Record<string, unknown>) {
  const today = currentHotelDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  let year = numberArg(args, "year") ?? currentYear;
  const month = numberArg(args, "month") ?? currentMonth;

  while (year < currentYear || (year === currentYear && month < currentMonth)) {
    year += 1;
  }

  return { year, month };
}

function isDataSourceUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Unable to connect to the database")
  );
}

async function executeToolCall(toolCall: ChatToolCall): Promise<ToolExecutionResult> {
  if (toolCall.name === "list_room_types") {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { baseRate: "asc" },
      select: { name: true, capacity: true, baseRate: true },
    });
    if (roomTypes.length === 0) {
      return { reply: "現在、表示できる部屋タイプがありません。" };
    }
    return {
      reply: `現在ご案内できる部屋タイプです。${READ_ONLY_NOTICE}`,
      cards: roomTypes.map((room) => ({
        title: room.name,
        rows: [
          { label: "定員", value: `${room.capacity}名` },
          { label: "1泊料金", value: formatYen(room.baseRate) },
        ],
      })),
    };
  }

  if (toolCall.name === "search_availability") {
    const checkIn = stringArg(toolCall.arguments, "checkIn");
    const checkOut = stringArg(toolCall.arguments, "checkOut") ?? (checkIn ? addDaysToDateOnly(checkIn, 1) : undefined);
    const guestCount = numberArg(toolCall.arguments, "guestCount");
    const validation = validateReservationCondition({ checkInDate: checkIn, checkOutDate: checkOut, guestCount });
    if (!validation.ok) {
      return { reply: `空室検索には、未来のチェックイン日と人数が必要です。\n${READ_ONLY_NOTICE}` };
    }
    const roomTypes = await searchAvailability(prisma, validation.value);
    if (roomTypes.length === 0) {
      return {
        reply: `指定条件では空室が見つかりませんでした。日付または人数を変更してお試しください。\n${READ_ONLY_NOTICE}`,
        cards: [
          {
            title: "空室なし",
            description: `${validation.value.checkIn.toISOString().slice(0, 10)}から${validation.value.nights}泊、${validation.value.guestCount}名`,
            tone: "warning",
          },
        ],
      };
    }
    return {
      reply: `${validation.value.checkIn.toISOString().slice(0, 10)}から${validation.value.nights}泊、${validation.value.guestCount}名で空室があります。予約する場合は予約画面で内容を確認して確定してください。`,
      cards: roomTypes.slice(0, 4).map((room) => ({
        title: room.name,
        tone: "success",
        rows: [
          { label: "残室", value: `${room.availableCount}室` },
          { label: "定員", value: `${room.capacity}名` },
          { label: "合計", value: formatYen(room.totalCharge) },
        ],
      })),
    };
  }

  if (toolCall.name === "availability_calendar") {
    const { year, month } = futureMonthArg(toolCall.arguments);
    const guestCount = numberArg(toolCall.arguments, "guestCount") ?? 2;
    const days = await getAvailabilityCalendar(prisma, { year, month, guestCount });
    const availableDays = days.filter((day) => day.status === "available" || day.status === "limited");
    if (availableDays.length === 0) {
      return {
        reply: `${year}年${month}月は、${guestCount}名で泊まれる空室が見つかりませんでした。\n${READ_ONLY_NOTICE}`,
        cards: [{ title: "空室なし", description: `${year}年${month}月 / ${guestCount}名`, tone: "warning" }],
      };
    }
    return {
      reply: `${year}年${month}月は、${guestCount}名で泊まれる日が${availableDays.length}日あります。詳しくは予約画面の空室カレンダーで確認してください。`,
      cards: availableDays.slice(0, 7).map((day) => ({
        title: day.date,
        tone: day.status === "limited" ? "warning" : "success",
        rows: [{ label: "空室", value: `${day.availableCount}室` }],
      })),
    };
  }

  const checkIn = stringArg(toolCall.arguments, "checkIn");
  const checkOut = stringArg(toolCall.arguments, "checkOut") ?? (checkIn ? addDaysToDateOnly(checkIn, 1) : undefined);
  const baseRate = numberArg(toolCall.arguments, "baseRate");
  if (checkIn && checkOut && baseRate) {
    const policy = calculateCancellationPolicy({
      checkInDate: new Date(`${checkIn}T00:00:00.000Z`),
      checkOutDate: new Date(`${checkOut}T00:00:00.000Z`),
      baseRate,
    });
    return {
      reply: `この条件の概算キャンセル料は${formatYen(policy.cancellationFee)}です。${policy.description}\n${READ_ONLY_NOTICE}`,
      cards: [
        {
          title: policy.label,
          rows: [
            { label: "宿泊料金", value: formatYen(policy.totalCharge) },
            { label: "概算キャンセル料", value: formatYen(policy.cancellationFee) },
          ],
        },
      ],
    };
  }
  return {
    reply:
      "HRSのキャンセルポリシーは、チェックイン日前日まで無料、チェックイン当日50%、チェックイン予定日後100%です。実際のキャンセル可否と料金は、キャンセル画面で予約内容を照会して確認してください。",
    cards: [
      {
        title: "キャンセルポリシー",
        rows: [
          { label: "前日まで", value: "無料" },
          { label: "当日", value: "50%" },
          { label: "予定日後", value: "100%" },
        ],
      },
    ],
  };
}

function linksForTool(toolName: ChatToolName) {
  if (toolName === "search_availability" || toolName === "availability_calendar" || toolName === "list_room_types") {
    return [{ href: "/reservations/new", label: "予約画面へ" }];
  }
  return [{ href: "/reservations/cancel", label: "キャンセル確認へ" }];
}

export async function answerReadOnlyChat(message: string): Promise<ChatAssistantResult> {
  const provider = resolveProvider();
  const normalizedMessage = message.trim();

  if (containsSensitiveReservationInfo(normalizedMessage)) {
    return {
      provider,
      reply:
        "予約番号、メールアドレス、電話番号などの個人情報はこのチャットでは扱えません。予約確認やキャンセルは専用画面で行ってください。",
      links: [
        { href: "/reservations/lookup", label: "予約確認へ" },
        { href: "/reservations/cancel", label: "キャンセル確認へ" },
      ],
    };
  }

  if (!isSupportedChatQuestion(normalizedMessage)) {
    return {
      provider,
      reply: UNSUPPORTED_CHAT_REPLY,
      links: [
        { href: "/reservations/new", label: "予約画面へ" },
        { href: "/reservations/cancel", label: "キャンセル確認へ" },
      ],
    };
  }

  const toolCall = await getToolCall(provider, normalizedMessage);
  let result: ToolExecutionResult;
  try {
    result = await executeToolCall(toolCall);
  } catch (error) {
    if (!isDataSourceUnavailable(error)) {
      throw error;
    }
    result = {
      reply: DATA_SOURCE_UNAVAILABLE_REPLY,
      cards: [{ title: "データ接続エラー", description: "空室データに接続できません。", tone: "warning" }],
    };
  }
  return {
    provider,
    toolName: toolCall.name,
    reply: result.reply,
    cards: result.cards,
    links: linksForTool(toolCall.name),
  };
}
