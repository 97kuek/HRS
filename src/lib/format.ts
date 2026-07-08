const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatYen(amount: number) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function calculateNightsFromDateOnly(checkInDate: string, checkOutDate: string) {
  const checkIn = new Date(`${checkInDate}T00:00:00.000Z`);
  const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`);
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
}

export function formatStayRange({
  checkInDate,
  checkOutDate,
  nights,
  guestCount,
  separator = "→",
}: {
  checkInDate: string;
  checkOutDate: string;
  nights?: number;
  guestCount?: number;
  separator?: "→" | "〜";
}) {
  const resolvedNights = nights ?? calculateNightsFromDateOnly(checkInDate, checkOutDate);
  const guestText = guestCount === undefined ? "" : `・${guestCount}名`;
  return `${checkInDate} ${separator} ${checkOutDate}（${resolvedNights}泊${guestText}）`;
}
