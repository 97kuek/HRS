import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validateGuestCount,
  validateName,
  validatePhone,
  validateReservationNumber,
  validateRoomNumber,
  validateStayDates,
} from "@/lib/validation";

describe("validateName", () => {
  it("空文字はエラー", () => {
    expect(validateName("")).not.toBeNull();
  });
  it("空白のみはエラー", () => {
    expect(validateName("   ")).not.toBeNull();
  });
  it("51文字はエラー", () => {
    expect(validateName("あ".repeat(51))).not.toBeNull();
  });
  it("50文字はOK", () => {
    expect(validateName("あ".repeat(50))).toBeNull();
  });
  it("通常の氏名はOK", () => {
    expect(validateName("山田 太郎")).toBeNull();
  });
});

describe("validateReservationNumber", () => {
  it("正しい形式はOK", () => {
    expect(validateReservationNumber("HRS-20260701-0001")).toBeNull();
  });
  it("小文字でもOK（大文字化される）", () => {
    expect(validateReservationNumber("hrs-20260701-0001")).toBeNull();
  });
  it("空文字はエラー", () => {
    expect(validateReservationNumber("")).not.toBeNull();
  });
  it("ハイフンなしはエラー", () => {
    expect(validateReservationNumber("HRS202607010001")).not.toBeNull();
  });
  it("数字桁数が違うとエラー", () => {
    expect(validateReservationNumber("HRS-2026070-001")).not.toBeNull();
  });
});

describe("validateRoomNumber", () => {
  it("半角数字はOK", () => {
    expect(validateRoomNumber("101")).toBeNull();
  });
  it("空文字はエラー", () => {
    expect(validateRoomNumber("")).not.toBeNull();
  });
  it("英字が混じるとエラー", () => {
    expect(validateRoomNumber("10A")).not.toBeNull();
  });
  it("5桁以上はエラー", () => {
    expect(validateRoomNumber("12345")).not.toBeNull();
  });
});

describe("validateStayDates", () => {
  it("チェックアウトがチェックインより後はOK", () => {
    expect(validateStayDates("2026-07-01", "2026-07-03")).toBeNull();
  });
  it("同日はエラー", () => {
    expect(validateStayDates("2026-07-01", "2026-07-01")).not.toBeNull();
  });
  it("チェックアウトが前はエラー", () => {
    expect(validateStayDates("2026-07-03", "2026-07-01")).not.toBeNull();
  });
  it("どちらかが空はエラー", () => {
    expect(validateStayDates("", "2026-07-01")).not.toBeNull();
    expect(validateStayDates("2026-07-01", "")).not.toBeNull();
  });
});

describe("validateGuestCount", () => {
  it("1名はOK", () => {
    expect(validateGuestCount(1)).toBeNull();
  });
  it("10名はOK", () => {
    expect(validateGuestCount(10)).toBeNull();
  });
  it("0名はエラー", () => {
    expect(validateGuestCount(0)).not.toBeNull();
  });
  it("11名はエラー", () => {
    expect(validateGuestCount(11)).not.toBeNull();
  });
  it("NaN はエラー", () => {
    expect(validateGuestCount(NaN)).not.toBeNull();
  });
});

describe("validateEmail", () => {
  it("正しいメールアドレスはOK", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });
  it("空文字はエラー", () => {
    expect(validateEmail("")).not.toBeNull();
  });
  it("@がないとエラー", () => {
    expect(validateEmail("userexample.com")).not.toBeNull();
  });
  it("ドメインがないとエラー", () => {
    expect(validateEmail("user@")).not.toBeNull();
  });
});

describe("validatePhone", () => {
  it("任意項目なので空文字はOK", () => {
    expect(validatePhone("")).toBeNull();
  });
  it("ハイフンありの正しい番号はOK", () => {
    expect(validatePhone("090-1234-5678")).toBeNull();
  });
  it("スペースなし10桁はOK", () => {
    expect(validatePhone("0901234567")).toBeNull();
  });
  it("0始まりでないとエラー", () => {
    expect(validatePhone("190-1234-5678")).not.toBeNull();
  });
  it("桁数不足はエラー", () => {
    expect(validatePhone("090-123-456")).not.toBeNull();
  });
});
