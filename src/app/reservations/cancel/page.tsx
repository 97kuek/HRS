"use client";

import { useState } from "react";
import Link from "next/link";

interface Quote {
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: string;
  cancelable: boolean;
  reason: string | null;
}

interface CancelResult {
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: string;
}

interface ApiError {
  error: { code: string; message: string };
}

export default function CancelReservationPage() {
  const [reservationNumber, setReservationNumber] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<CancelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 予約内容の表示（照会・未確定）
  async function fetchQuote() {
    const number = reservationNumber.trim();
    if (!number) {
      setError("予約番号を入力してください。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${encodeURIComponent(number)}/cancel/quote`);
      const data = (await res.json()) as { quote: Quote } | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error?.message ?? "予約の照会に失敗しました。");
        return;
      }
      setQuote((data as { quote: Quote }).quote);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  // キャンセル確定
  async function confirmCancel() {
    if (!quote) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(quote.reservationNumber)}/cancel`,
        {
          method: "POST",
        },
      );
      const data = (await res.json()) as { cancellation: CancelResult } | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error?.message ?? "キャンセルに失敗しました。");
        return;
      }
      setResult((data as { cancellation: CancelResult }).cancellation);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  // 入力に戻る
  function reset() {
    setQuote(null);
    setError(null);
  }

  // 完了画面
  if (result) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>キャンセル完了</h1>
        <p>ご予約をキャンセルしました。</p>
        <dl>
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

  // 予約内容の表示 → キャンセル確認
  if (quote) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>予約内容の確認</h1>
        <dl>
          <dt>予約番号</dt>
          <dd>{quote.reservationNumber}</dd>
          <dt>部屋タイプ</dt>
          <dd>{quote.roomTypeName}</dd>
          <dt>宿泊期間</dt>
          <dd>
            {quote.checkInDate} 〜 {quote.checkOutDate}（{quote.guestCount}名）
          </dd>
        </dl>
        {quote.cancelable ? (
          <>
            <p>この予約をキャンセルしますか？</p>
            {error && <p style={{ color: "#c00" }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={confirmCancel} disabled={loading} style={{ padding: "8px 16px" }}>
                {loading ? "処理中…" : "キャンセルする"}
              </button>
              <button onClick={reset} disabled={loading} style={{ padding: "8px 16px" }}>
                やめる
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "#c00" }}>{quote.reason}</p>
            <button onClick={reset} style={{ padding: "8px 16px" }}>
              戻る
            </button>
          </>
        )}
      </main>
    );
  }

  // 予約番号の入力
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h1>予約のキャンセル</h1>
      <p>キャンセルするご予約の予約番号を入力してください。</p>
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
      <button onClick={fetchQuote} disabled={loading} style={{ padding: "8px 16px" }}>
        {loading ? "照会中…" : "予約を照会する"}
      </button>
    </main>
  );
}
