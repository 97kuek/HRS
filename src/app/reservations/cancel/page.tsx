"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LongWaitBar } from "@/components/LoadingIndicator";
import { validateReservationNumber, validateName } from "@/lib/validation";

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

function CancelReservationPageInner() {
  const searchParams = useSearchParams();
  const [reservationNumber, setReservationNumber] = useState(
    () => searchParams.get("r") ?? "",
  );
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [touched, setTouched] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<CancelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reservationNumberError = validateReservationNumber(reservationNumber);
  const familyNameError = validateName(familyName, "姓");
  const givenNameError = validateName(givenName, "名");
  const fieldError = reservationNumberError ?? familyNameError ?? givenNameError;

  async function fetchQuote() {
    setTouched(true);
    if (fieldError) return;
    const number = reservationNumber.trim().toUpperCase();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        familyName: familyName.trim(),
        givenName: givenName.trim(),
      });
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(number)}/cancel/quote?${params}`,
      );
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
        <div className="page-panel page-panel-centered">
          <div className="complete-mark">✓</div>
          <h1 className="page-title">キャンセル完了</h1>
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
        <div className="page-panel">
          <h1 className="page-title">予約内容の確認</h1>
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
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> 処理中…
                    </>
                  ) : (
                    "キャンセルする"
                  )}
                </button>
              </div>
              <LongWaitBar
                loading={loading}
                message="キャンセルを処理しています。そのままお待ちください…"
              />
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
      <div className="page-panel">
        <p className="page-kicker">CANCELLATION</p>
        <h1 className="page-title">予約のキャンセル</h1>
        <p className="page-intro">キャンセルするご予約の予約番号を入力してください。</p>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required" htmlFor="reservationNumber">
              予約番号
            </label>
            <input
              id="reservationNumber"
              className={
                !touched || reservationNumber.trim() === ""
                  ? "field-input"
                  : reservationNumberError
                    ? "field-input is-invalid"
                    : "field-input is-valid"
              }
              type="text"
              value={reservationNumber}
              aria-describedby={
                touched && reservationNumberError
                  ? "reservationNumber-hint reservationNumber-error"
                  : "reservationNumber-hint"
              }
              aria-invalid={touched && Boolean(reservationNumberError)}
              onBlur={() => setTouched(true)}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="HRS-YYYYMMDD-NNNN"
            />
            <span className="field-hint" id="reservationNumber-hint">
              予約完了時に発行された番号です。半角英数字・ハイフンありで入力してください（例:
              HRS-20260710-0042）。
            </span>
            {touched && reservationNumberError && (
              <span className="field-error" id="reservationNumber-error">
                {reservationNumberError}
              </span>
            )}
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label field-required" htmlFor="cancelFamilyName">
                姓
              </label>
              <input
                id="cancelFamilyName"
                className={
                  !touched || familyName.trim() === ""
                    ? "field-input"
                    : familyNameError
                      ? "field-input is-invalid"
                      : "field-input is-valid"
                }
                type="text"
                value={familyName}
                autoComplete="family-name"
                placeholder="山田"
                aria-invalid={touched && Boolean(familyNameError)}
                onBlur={() => setTouched(true)}
                onChange={(e) => setFamilyName(e.target.value)}
              />
              {touched && familyNameError && (
                <span className="field-error">{familyNameError}</span>
              )}
            </div>
            <div className="field">
              <label className="field-label field-required" htmlFor="cancelGivenName">
                名
              </label>
              <input
                id="cancelGivenName"
                className={
                  !touched || givenName.trim() === ""
                    ? "field-input"
                    : givenNameError
                      ? "field-input is-invalid"
                      : "field-input is-valid"
                }
                type="text"
                value={givenName}
                autoComplete="given-name"
                placeholder="太郎"
                aria-invalid={touched && Boolean(givenNameError)}
                onBlur={() => setTouched(true)}
                onChange={(e) => setGivenName(e.target.value)}
              />
              {touched && givenNameError && (
                <span className="field-error">{givenNameError}</span>
              )}
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}
        </div>
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
          onClick={fetchQuote}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" /> 照会中…
            </>
          ) : (
            "予約を照会する"
          )}
        </button>
        <LongWaitBar loading={loading} message="ご予約を照会しています。そのままお待ちください…" />
      </div>
    </main>
  );
}

export default function CancelReservationPage() {
  return (
    <Suspense>
      <CancelReservationPageInner />
    </Suspense>
  );
}
