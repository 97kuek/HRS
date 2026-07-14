export function todayLocalDateOnly() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** ホテル所在地（Asia/Tokyo）の今日を YYYY-MM-DD で返す。 */
export function todayInHotelDateOnly(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** @db.Date と比較できる UTC 00:00 のホテル暦日を返す。 */
export function todayInHotelDate(now = new Date()) {
  return new Date(`${todayInHotelDateOnly(now)}T00:00:00.000Z`);
}

export function addDaysToDateOnly(base: string, days: number) {
  const date = new Date(`${base}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
