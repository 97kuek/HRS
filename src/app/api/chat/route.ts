import { apiError, internalServerError } from "@/lib/api/response";
import { answerReadOnlyChat } from "@/lib/chat/assistant";
import { consumeChatRateLimit } from "@/lib/chat/rate-limit";

const MAX_MESSAGE_LENGTH = 500;

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}

/**
 * POST /api/chat
 * 読み取り専用の予約支援チャット。予約作成・予約確認・キャンセル確定は実行しない。
 */
export async function POST(request: Request) {
  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message.trim() : "";
  } catch {
    return apiError(400, "VALIDATION_ERROR", "メッセージを入力してください。");
  }

  if (!message) {
    return apiError(400, "VALIDATION_ERROR", "メッセージを入力してください。");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      `メッセージは${MAX_MESSAGE_LENGTH}文字以内で入力してください。`,
    );
  }

  const rateLimit = consumeChatRateLimit(clientKey(request));
  if (!rateLimit.ok) {
    return apiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      `短時間に送信できる回数を超えました。${rateLimit.retryAfterSeconds}秒後にもう一度お試しください。`,
    );
  }

  try {
    const result = await answerReadOnlyChat(message);
    return Response.json({ chat: result });
  } catch (error) {
    console.error("Failed to answer chat", error);
    return internalServerError();
  }
}
