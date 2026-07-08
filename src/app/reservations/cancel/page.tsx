"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ConfirmTable } from "@/components/ConfirmTable";
import {
  IdentityVerificationForm,
  type IdentityFormValue,
} from "@/components/IdentityVerificationForm";
import { LongWaitBar } from "@/components/LoadingIndicator";
import { ResultPanel } from "@/components/ResultPanel";
import { SubmitButton } from "@/components/SubmitButton";
import { formatStayRange } from "@/lib/format";
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
  const [identity, setIdentity] = useState<IdentityFormValue>({
    reservationNumber: searchParams.get("r") ?? "",
    familyName: "",
    givenName: "",
  });
  const [touched, setTouched] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<CancelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reservationNumberError = validateReservationNumber(identity.reservationNumber);
  const familyNameError = validateName(identity.familyName, "姓");
  const givenNameError = validateName(identity.givenName, "名");
  const fieldError = reservationNumberError ?? familyNameError ?? givenNameError;

  async function fetchQuote() {
    setTouched(true);
    if (fieldError) return;
    const number = identity.reservationNumber.trim().toUpperCase();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        familyName: identity.familyName.trim(),
        givenName: identity.givenName.trim(),
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            familyName: identity.familyName.trim(),
            givenName: identity.givenName.trim(),
          }),
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

  function reset() {
    setQuote(null);
    setError(null);
  }

  if (result) {
    return (
      <ResultPanel
        title="キャンセル完了"
        description="ご予約をキャンセルしました。"
        secondaryDescription="ご登録のメールアドレスにキャンセル確認メールをお送りしました。"
        rows={[
          ["予約番号", result.reservationNumber],
          ["部屋タイプ", result.roomTypeName],
          [
            "宿泊期間",
            formatStayRange({
              checkInDate: result.checkInDate,
              checkOutDate: result.checkOutDate,
              guestCount: result.guestCount,
              separator: "〜",
            }),
          ],
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
          <h1 className="page-title">予約内容の確認</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 20px" }}>
            以下のご予約をキャンセルしますか？
          </p>
          <ConfirmTable
            rows={[
              ["予約番号", quote.reservationNumber],
              ["部屋タイプ", quote.roomTypeName],
              [
                "宿泊期間",
                formatStayRange({
                  checkInDate: quote.checkInDate,
                  checkOutDate: quote.checkOutDate,
                  guestCount: quote.guestCount,
                  separator: "〜",
                }),
              ],
            ]}
          />
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
                <SubmitButton
                  className="btn btn-primary btn-lg"
                  type="button"
                  loading={loading}
                  loadingLabel="処理中…"
                  onClick={confirmCancel}
                  disabled={loading}
                >
                  キャンセルする
                </SubmitButton>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQuote();
          }}
        >
          <div className="form-stack">
            <IdentityVerificationForm
              idPrefix="cancel"
              value={identity}
              errors={{
                reservationNumber: reservationNumberError,
                familyName: familyNameError,
                givenName: givenNameError,
              }}
              touched={touched}
              onTouched={() => setTouched(true)}
              onChange={setIdentity}
            />
            {error && <div className="error-box">{error}</div>}
          </div>
          <div className="form-submit">
            <SubmitButton loading={loading} loadingLabel="照会中…">
              予約を照会する
            </SubmitButton>
          </div>
          <LongWaitBar
            loading={loading}
            message="ご予約を照会しています。そのままお待ちください…"
          />
        </form>
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
