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

  async function confirmCancel() {
    if (!quote) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(quote.reservationNumber)}/cancel`,
        { method: "POST" },
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

  function reset() {
    setQuote(null);
    setError(null);
  }

  if (result) {
    return (
      <main className="page-shell">
        <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
          <div className="complete-mark">✓</div>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>キャンセル完了</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 16px" }}>
            ご予約をキャンセルしました。
          </p>
          <div className="confirm-table" style={{ textAlign: "left" }}>
            {[
              ["予約番号", result.reservationNumber],
              ["部屋タイプ", result.roomTypeName],
              [
                "宿泊期間",
                `${result.checkInDate} 〜 ${result.checkOutDate}（${result.guestCount}名）`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <Link href="/" className="btn btn-secondary btn-full" style={{ marginTop: 16 }}>
            トップへ戻る
          </Link>
        </div>
      </main>
    );
  }

  if (quote) {
    return (
      <main className="page-shell">
        <div style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>予約内容の確認</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 20px" }}>
            以下のご予約をキャンセルしますか？
          </p>
          <div className="confirm-table">
            {[
              ["予約番号", quote.reservationNumber],
              ["部屋タイプ", quote.roomTypeName],
              [
                "宿泊期間",
                `${quote.checkInDate} 〜 ${quote.checkOutDate}（${quote.guestCount}名）`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          {quote.cancelable ? (
            <>
              {error && (
                <div className="error-box" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={reset} disabled={loading}>
                  やめる
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={confirmCancel}
                  disabled={loading}
                >
                  {loading ? "処理中…" : "キャンセルする"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="error-box" style={{ marginBottom: 16 }}>
                {quote.reason}
              </div>
              <button className="btn btn-secondary btn-full" onClick={reset}>
                戻る
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>予約のキャンセル</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
          キャンセルするご予約の予約番号を入力してください。
        </p>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">予約番号</label>
            <input
              className="field-input"
              type="text"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="HRS-YYYYMMDD-NNNN"
            />
          </div>
          {error && <div className="error-box">{error}</div>}
        </div>
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
          onClick={fetchQuote}
          disabled={loading}
        >
          {loading ? "照会中…" : "予約を照会する"}
        </button>
      </div>
    </main>
  );
}
