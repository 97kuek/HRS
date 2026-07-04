import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

function getClient(): Resend | null {
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set. Skipping email.");
    return null;
  }
  return new Resend(apiKey);
}

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export async function sendReservationConfirmation(
  to: string,
  data: {
    guestName: string;
    reservationNumber: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    guestCount: number;
    totalCharge: number;
  },
) {
  const client = getClient();
  if (!client) return { ok: false };
  try {
    const text = `
${data.guestName} 様

この度はHRSをご利用いただきありがとうございます。
以下の内容でご予約を承りました。

■ 予約番号: ${data.reservationNumber}
■ 客室: ${data.roomTypeName}
■ チェックイン: ${data.checkInDate}
■ チェックアウト: ${data.checkOutDate}（${data.nights}泊）
■ 人数: ${data.guestCount}名
■ 合計: ${yen(data.totalCharge)}

ご来館の際は予約番号をフロントにてお伝えください。

HRS — Hotel Reservation System
`.trim();

    const html = text.replace(/\n/g, "<br>");

    await client.emails.send({
      from,
      to,
      subject: "【HRS】ご予約が完了しました",
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendReservationConfirmation failed", err);
    return { ok: false };
  }
}

export async function sendReservationCancellation(
  to: string,
  data: {
    guestName: string;
    reservationNumber: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
  },
) {
  const client = getClient();
  if (!client) return { ok: false };
  try {
    const text = `
${data.guestName} 様

ご予約のキャンセルを承りました。

■ 予約番号: ${data.reservationNumber}
■ 客室: ${data.roomTypeName}
■ チェックイン（予定）: ${data.checkInDate}
■ チェックアウト（予定）: ${data.checkOutDate}
■ 人数: ${data.guestCount}名

またのご利用をお待ちしております。

HRS — Hotel Reservation System
`.trim();

    const html = text.replace(/\n/g, "<br>");

    await client.emails.send({
      from,
      to,
      subject: "【HRS】ご予約のキャンセルが完了しました",
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendReservationCancellation failed", err);
    return { ok: false };
  }
}

export async function sendCheckOutReceipt(
  to: string,
  data: {
    guestName: string;
    reservationNumber: string;
    roomNumber: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    amount: number;
    method: string;
  },
) {
  const client = getClient();
  if (!client) return { ok: false };
  try {
    const text = `
${data.guestName} 様

チェックアウトが完了しました。ご利用ありがとうございました。

■ 予約番号: ${data.reservationNumber}
■ 部屋番号: ${data.roomNumber}
■ 客室タイプ: ${data.roomTypeName}
■ 宿泊期間: ${data.checkInDate} 〜 ${data.checkOutDate}（${data.nights}泊）
■ お支払い金額: ${yen(data.amount)}
■ お支払い方法: ${data.method}

またのご利用をお待ちしております。

HRS — Hotel Reservation System
`.trim();

    const html = text.replace(/\n/g, "<br>");

    await client.emails.send({
      from,
      to,
      subject: "【HRS】チェックアウト完了・ご利用ありがとうございました",
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendCheckOutReceipt failed", err);
    return { ok: false };
  }
}

export async function sendCheckInReminder(
  to: string,
  data: {
    guestName: string;
    reservationNumber: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: number;
  },
) {
  const client = getClient();
  if (!client) return { ok: false };
  try {
    const text = `
${data.guestName} 様

明日はいよいよチェックインの日です。お気をつけてお越しください。

■ 予約番号: ${data.reservationNumber}
■ 客室: ${data.roomTypeName}
■ チェックイン: ${data.checkInDate}
■ チェックアウト: ${data.checkOutDate}
■ 人数: ${data.guestCount}名

ご来館の際は予約番号をフロントにてお伝えください。

HRS — Hotel Reservation System
`.trim();

    const html = text.replace(/\n/g, "<br>");

    await client.emails.send({
      from,
      to,
      subject: "【HRS】明日のチェックインのご案内",
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] sendCheckInReminder failed", err);
    return { ok: false };
  }
}
