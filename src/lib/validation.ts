/**
 * フォーム入力の共通バリデーション。
 * 各関数はエラーメッセージ（string）を返し、問題なければ null を返す。
 * メッセージは「理由」と「入力例」を具体的に伝えることを重視している。
 */

export type ValidationResult = string | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return "氏名を入力してください。";
  if (v.length > 50) return "氏名は50文字以内で入力してください。";
  return null;
}

/**
 * 連絡先は電話番号（ハイフン有無どちらも可・半角数字）またはメールアドレス。
 */
export function validateContact(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return "連絡先を入力してください。";
  const digits = v.replace(/[-\s]/g, "");
  const isPhone = /^0\d{9,10}$/.test(digits);
  const isEmail = EMAIL_RE.test(v);
  if (!isPhone && !isEmail) {
    return "電話番号（例: 090-1234-5678）またはメールアドレス（例: guest@example.com）の形式で入力してください。半角で入力してください。";
  }
  return null;
}

/**
 * 予約番号は「HRS-YYYYMMDD-NNNN」形式（半角英数字）。
 * 大文字小文字は問わない（照合側で大文字化する想定）。
 */
export function validateReservationNumber(value: string): ValidationResult {
  const v = value.trim().toUpperCase();
  if (v.length === 0) return "予約番号を入力してください。";
  if (!/^HRS-\d{8}-\d{4}$/.test(v)) {
    return "予約番号は「HRS-YYYYMMDD-NNNN」の形式で入力してください（半角英数字・ハイフンあり）。";
  }
  return null;
}

/**
 * 部屋番号は半角数字（例: 101）。
 */
export function validateRoomNumber(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return "部屋番号を入力してください。";
  if (!/^\d{1,4}$/.test(v)) {
    return "部屋番号は半角数字で入力してください（例: 101）。";
  }
  return null;
}

/**
 * 宿泊日の妥当性。チェックアウトはチェックインより後。
 */
export function validateStayDates(checkIn: string, checkOut: string): ValidationResult {
  if (!checkIn || !checkOut) return "チェックイン日とチェックアウト日を選択してください。";
  if (checkOut <= checkIn) {
    return "チェックアウト日はチェックイン日より後の日付を選択してください。";
  }
  return null;
}

export function validateGuestCount(count: number): ValidationResult {
  if (!Number.isFinite(count) || count < 1) {
    return "宿泊人数は1名以上を入力してください。";
  }
  if (count > 10) return "宿泊人数は10名以内で入力してください。";
  return null;
}
