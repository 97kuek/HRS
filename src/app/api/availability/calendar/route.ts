import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import {
  getAvailabilityCalendar,
  validateAvailabilityCalendarQuery,
} from "@/lib/reservations/availability";

/**
 * GET /api/availability/calendar?year=2026&month=7&guestCount=2
 * 予約作成画面の月別カレンダーに表示する日別空室数を返す。
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const validation = validateAvailabilityCalendarQuery({
      year: params.get("year") ?? undefined,
      month: params.get("month") ?? undefined,
      guestCount: params.get("guestCount") ?? undefined,
    });

    if (!validation.ok) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "空室カレンダーの条件が正しくありません。",
        validation.errors,
      );
    }

    const query = validation.value;
    const days = await getAvailabilityCalendar(prisma, query);

    return Response.json({
      year: query.year,
      month: query.month,
      guestCount: query.guestCount,
      days,
    });
  } catch (error) {
    console.error("Failed to get availability calendar", error);
    return internalServerError();
  }
}
