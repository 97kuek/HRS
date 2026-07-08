"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmTable } from "@/components/confirm-table";
import { FormField, fieldDescribedBy, fieldInputClass } from "@/components/form-field";
import { LongWaitBar } from "@/components/loading-indicator";
import { ResultPanel } from "@/components/result-panel";
import { SubmitButton } from "@/components/submit-button";
import { formatYen } from "@/lib/format";
import { validateRoomNumber } from "@/lib/validation";

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

const PAYMENT_METHODS = ["現金", "クレジットカード"] as const;

export default function CheckOutPage() {
  const [roomNumber, setRoomNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<CheckOutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fieldError = validateRoomNumber(roomNumber);

  async function fetchQuote() {
    setTouched(true);
    if (fieldError) return;
    const number = roomNumber.trim();
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
      <ResultPanel
        title="チェックアウト完了"
        description="ご利用ありがとうございました。"
        secondaryDescription="領収書をご登録のメールアドレスにお送りしました。"
        rows={[
          ["部屋番号", result.roomNumber],
          ["予約番号", result.reservationNumber],
          ["お支払い金額", formatYen(result.amount)],
          ["お支払い方法", result.method],
        ]}
      >
        <Link href="/" className="btn btn-secondary btn-full" style={{ marginTop: 16 }}>
          トップへ戻る
        </Link>
      </ResultPanel>
    );
  }

  if (quote) {
    return (
      <main className="page-shell">
        <div className="page-panel">
          <h1 className="page-title">お支払い</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 20px" }}>
            ご請求内容をご確認のうえ、お支払い方法を選択してください。
          </p>
          <ConfirmTable
            rows={[
              ["部屋番号", quote.roomNumber],
              ["部屋タイプ", quote.roomTypeName],
              ["宿泊期間", `${quote.checkInDate} 〜 ${quote.checkOutDate}（${quote.nights}泊）`],
            ]}
          />
          <div className="price-breakdown">
            <div className="price-row-total">
              <span>ご請求金額</span>
              <span>{formatYen(quote.amount)}</span>
            </div>
          </div>
          <p className="section-heading">お支払い方法</p>
          {PAYMENT_METHODS.map((m) => (
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
            <SubmitButton
              className="btn btn-primary btn-lg"
              type="button"
              loading={loading}
              loadingLabel="処理中…"
              onClick={confirmCheckOut}
              disabled={loading}
            >
              支払ってチェックアウトする
            </SubmitButton>
          </div>
          <LongWaitBar
            loading={loading}
            message="お支払いを処理しています。そのままお待ちください…"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-panel">
        <p className="page-kicker">CHECK-OUT</p>
        <h1 className="page-title">チェックアウト</h1>
        <p className="page-intro">ご滞在中のお部屋の番号を入力してください。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQuote();
          }}
        >
          <div className="form-stack">
            <FormField
              id="roomNumber"
              label="部屋番号"
              hint="ご滞在中のお部屋のドアに記載された番号です。半角数字で入力してください（例: 101）。"
              error={fieldError}
              touched={touched}
            >
              <input
                id="roomNumber"
                className={fieldInputClass(touched, roomNumber, fieldError)}
                type="text"
                inputMode="numeric"
                value={roomNumber}
                aria-describedby={fieldDescribedBy(
                  "roomNumber",
                  "ご滞在中のお部屋のドアに記載された番号です。半角数字で入力してください（例: 101）。",
                  fieldError,
                  touched,
                )}
                aria-invalid={touched && Boolean(fieldError)}
                onBlur={() => setTouched(true)}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="101"
              />
            </FormField>
            {error && <div className="error-box">{error}</div>}
          </div>
          <div className="form-submit">
            <SubmitButton loading={loading} loadingLabel="照会中…">
              料金を確認する
            </SubmitButton>
          </div>
          <LongWaitBar
            loading={loading}
            message="ご請求内容を照会しています。そのままお待ちください…"
          />
        </form>
      </div>
    </main>
  );
}
