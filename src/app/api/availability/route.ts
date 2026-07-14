import { apiError, internalServerError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { searchAvailability, validateReservationCondition } from "@/lib/reservations/availability";

/**
 * GET /api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guestCount=2&roomTypeId=...
 * 条件に合う部屋タイプ別の空室状況と宿泊料金を返す（UC「部屋を予約する」基本系列 3〜4）。
 * roomTypeId は任意（指定時はその部屋タイプに絞り込む）。
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const validation = validateReservationCondition({
      checkInDate: params.get("checkIn") ?? undefined,
      checkOutDate: params.get("checkOut") ?? undefined,
      guestCount: params.get("guestCount") ?? undefined,
      roomTypeId: params.get("roomTypeId") ?? undefined,
    });

    if (!validation.ok) {
      return apiError(400, "VALIDATION_ERROR", "検索条件が正しくありません。", validation.errors);
    }

    const condition = validation.value;
    const roomTypes = await searchAvailability(prisma, condition);

    if (roomTypes.length === 0) {
      return apiError(
        404,
        "NO_AVAILABILITY",
        "条件に合う空室が見つかりませんでした。条件を変更してください。",
      );
    }

    return Response.json({
      condition: {
        checkIn: condition.checkIn.toISOString().slice(0, 10),
        checkOut: condition.checkOut.toISOString().slice(0, 10),
        nights: condition.nights,
        guestCount: condition.guestCount,
      },
      roomTypes,
    });
  } catch (error) {
    console.error("Failed to search availability", error);
    return internalServerError();
  }
}
