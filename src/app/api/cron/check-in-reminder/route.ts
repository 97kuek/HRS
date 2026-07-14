import { prisma } from "@/lib/db/prisma";
import { sendCheckInReminder } from "@/lib/email/send";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** JST で明日の日付を YYYY-MM-DD 文字列で返す。 */
function tomorrowJST(): string {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const tomorrow = new Date(jstNow.getTime() + MS_PER_DAY);
  return tomorrow.toISOString().slice(0, 10);
}

/**
 * GET /api/cron/check-in-reminder
 * Vercel Cron Job から毎日 0:00 UTC（9:00 JST）に呼ばれ、
 * 翌日チェックイン予定のゲストにリマインダーメールを送る。
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("Authorization") ?? "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tomorrow = tomorrowJST();
  const tomorrowDate = new Date(`${tomorrow}T00:00:00.000Z`);

  const reservations = await prisma.reservation.findMany({
    where: {
      checkInDate: tomorrowDate,
      status: "RESERVED",
    },
    include: {
      guest: { select: { name: true, email: true } },
      roomType: { select: { name: true } },
    },
  });

  const results = await Promise.allSettled(
    reservations.map((r) =>
      sendCheckInReminder(r.guest.email, {
        guestName: r.guest.name,
        reservationNumber: r.reservationNumber,
        roomTypeName: r.roomType.name,
        checkInDate: r.checkInDate.toISOString().slice(0, 10),
        checkOutDate: r.checkOutDate.toISOString().slice(0, 10),
        guestCount: r.guestCount,
      }),
    ),
  );

  const sent = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
  return Response.json({ sent, date: tomorrow });
}
