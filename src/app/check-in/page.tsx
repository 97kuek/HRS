"use client";

import { useState } from "react";
import Link from "next/link";

interface CheckInResult {
  reservationNumber: string;
  roomTypeName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  checkedInAt: string;
}

interface ApiError {
  error: { code: string; message: string };
}

export default function CheckInPage() {
  const [reservationNumber, setReservationNumber] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn() {
    const number = reservationNumber.trim();
    if (!number) {
      setError("予約番号を入力してください。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${encodeURIComponent(number)}/check-in`, {
        method: "POST",
      });
      const data = (await res.json()) as { checkIn: CheckInResult } | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error?.message ?? "チェックインに失敗しました。");
        return;
      }
      setResult((data as { checkIn: CheckInResult }).checkIn);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  // msg11: 結果画面（部屋番号と完了を表示する）
  if (result) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>チェックイン完了</h1>
        <p>お部屋の準備ができました。</p>
        <dl>
          <dt>部屋番号</dt>
          <dd style={{ fontSize: 28, fontWeight: 700 }}>{result.roomNumber}</dd>
          <dt>予約番号</dt>
          <dd>{result.reservationNumber}</dd>
          <dt>部屋タイプ</dt>
          <dd>{result.roomTypeName}</dd>
          <dt>宿泊期間</dt>
          <dd>
            {result.checkInDate} 〜 {result.checkOutDate}（{result.guestCount}名）
          </dd>
        </dl>
        <Link href="/">トップへ戻る</Link>
      </main>
    );
  }

  // msg1: チェックインフォーム（予約番号を入力する・チェックインを指示する）
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h1>チェックイン</h1>
      <p>ご予約時に発行された予約番号を入力してください。</p>
      <label style={{ display: "block", marginBottom: 12 }}>
        予約番号
        <input
          type="text"
          value={reservationNumber}
          onChange={(e) => setReservationNumber(e.target.value)}
          placeholder="HRS-YYYYMMDD-XXXX"
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      <button onClick={checkIn} disabled={loading} style={{ padding: "8px 16px" }}>
        {loading ? "処理中…" : "チェックインする"}
      </button>
    </main>
  );
}
