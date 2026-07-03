"use client";

import { useState } from "react";
import Link from "next/link";

interface Quote {
  roomNumber: string;
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  amount: number;
}

interface CheckOutResult {
  roomNumber: string;
  reservationNumber: string;
  roomTypeName: string;
  amount: number;
  method: string;
  paidAt: string;
  checkedOutAt: string | null;
}

interface ApiError {
  error: { code: string; message: string };
}

const yen = (n: number) => `¥${n.toLocaleString()}`;

export default function CheckOutPage() {
  const [roomNumber, setRoomNumber] = useState("");
  const [method, setMethod] = useState("現金");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<CheckOutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchQuote() {
    const number = roomNumber.trim();
    if (!number) {
      setError("部屋番号を入力してください。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(number)}/check-out/quote`);
      const data = (await res.json()) as { quote: Quote } | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error?.message ?? "料金の照会に失敗しました。");
        return;
      }
      setQuote((data as { quote: Quote }).quote);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCheckOut() {
    if (!quote) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(quote.roomNumber)}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: quote.amount, method }),
      });
      const data = (await res.json()) as { checkOut: CheckOutResult } | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error?.message ?? "チェックアウトに失敗しました。");
        return;
      }
      setResult((data as { checkOut: CheckOutResult }).checkOut);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setQuote(null);
    setError(null);
  }

  if (result) {
    return (
      <main className="page-shell">
        <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
          <div className="complete-mark">✓</div>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>チェックアウト完了</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 16px" }}>
            ご利用ありがとうございました。
          </p>
          <div className="confirm-table" style={{ textAlign: "left" }}>
            {[
              ["部屋番号", result.roomNumber],
              ["予約番号", result.reservationNumber],
              ["お支払い金額", yen(result.amount)],
              ["お支払い方法", result.method],
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
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>お支払い</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 20px" }}>
            ご請求内容をご確認のうえ、お支払い方法を選択してください。
          </p>
          <div className="confirm-table">
            {[
              ["部屋番号", quote.roomNumber],
              ["部屋タイプ", quote.roomTypeName],
              ["宿泊期間", `${quote.checkInDate} 〜 ${quote.checkOutDate}（${quote.nights}泊）`],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <div className="price-breakdown">
            <div className="price-row-total">
              <span>ご請求金額</span>
              <span>{yen(quote.amount)}</span>
            </div>
          </div>
          <p className="section-heading">お支払い方法</p>
          {["現金", "クレジットカード"].map((m) => (
            <div
              key={m}
              className={`payment-option${method === m ? " selected" : ""}`}
              onClick={() => setMethod(m)}
            >
              <span className="payment-radio" />
              {m}
            </div>
          ))}
          {error && (
            <div className="error-box" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={cancel} disabled={loading}>
              やめる
            </button>
            <button className="btn btn-primary btn-lg" onClick={confirmCheckOut} disabled={loading}>
              {loading ? "処理中…" : "支払ってチェックアウトする"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>チェックアウト</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
          ご滞在中のお部屋の番号を入力してください。
        </p>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">部屋番号</label>
            <input
              className="field-input"
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="0805"
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
          {loading ? "照会中…" : "料金を確認する"}
        </button>
      </div>
    </main>
  );
}
