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

  // msg3-6: 部屋番号 → 宿泊特定 → 料金計算・表示（未確定）
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

  // msg7-8: 支払いを処理する → チェックアウト確定
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

  // A1: 支払いを取りやめる（サーバー状態は変更しない）
  function cancel() {
    setQuote(null);
    setError(null);
  }

  // msg11: 結果画面（完了と支払い内容を表示する）
  if (result) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>チェックアウト完了</h1>
        <p>ご利用ありがとうございました。</p>
        <dl>
          <dt>部屋番号</dt>
          <dd style={{ fontSize: 28, fontWeight: 700 }}>{result.roomNumber}</dd>
          <dt>予約番号</dt>
          <dd>{result.reservationNumber}</dd>
          <dt>お支払い金額</dt>
          <dd>{yen(result.amount)}</dd>
          <dt>お支払い方法</dt>
          <dd>{result.method}</dd>
        </dl>
        <Link href="/">トップへ戻る</Link>
      </main>
    );
  }

  // msg3-6 の結果：料金表示 → 支払う / やめる
  if (quote) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1>お支払い</h1>
        <dl>
          <dt>部屋番号</dt>
          <dd>{quote.roomNumber}</dd>
          <dt>部屋タイプ</dt>
          <dd>{quote.roomTypeName}</dd>
          <dt>宿泊期間</dt>
          <dd>
            {quote.checkInDate} 〜 {quote.checkOutDate}（{quote.nights}泊）
          </dd>
          <dt>ご請求金額</dt>
          <dd style={{ fontSize: 28, fontWeight: 700 }}>{yen(quote.amount)}</dd>
        </dl>
        <label style={{ display: "block", margin: "12px 0" }}>
          お支払い方法
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ display: "block", marginTop: 4, padding: 8 }}
          >
            <option value="現金">現金</option>
            <option value="クレジットカード">クレジットカード</option>
          </select>
        </label>
        {error && <p style={{ color: "#c00" }}>{error}</p>}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={confirmCheckOut} disabled={loading} style={{ padding: "8px 16px" }}>
            {loading ? "処理中…" : "支払う"}
          </button>
          <button onClick={cancel} disabled={loading} style={{ padding: "8px 16px" }}>
            やめる
          </button>
        </div>
      </main>
    );
  }

  // msg1: 部屋番号を入力する
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <h1>チェックアウト</h1>
      <p>ご滞在中のお部屋の番号を入力してください。</p>
      <label style={{ display: "block", marginBottom: 12 }}>
        部屋番号
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="0805"
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      <button onClick={fetchQuote} disabled={loading} style={{ padding: "8px 16px" }}>
        {loading ? "照会中…" : "料金を確認する"}
      </button>
    </main>
  );
}
