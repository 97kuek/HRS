/**
 * 予約番号を生成する。形式: HRS-YYYYMMDD-XXXX
 * - YYYYMMDD: チェックイン日（UTC）
 * - XXXX: 4 桁のランダム数字
 * 重複時は呼び出し側でリトライする前提（一意制約あり）。
 */
export function generateReservationNumber(checkIn: Date): string {
  const yyyymmdd = checkIn.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `HRS-${yyyymmdd}-${random}`;
}
