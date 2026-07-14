"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ConfirmTable } from "@/components/confirm-table";
import { IdentityVerificationForm } from "@/components/identity-verification-form";
import { LongWaitBar } from "@/components/loading-indicator";
import { ResultPanel } from "@/components/result-panel";
import { SubmitButton } from "@/components/submit-button";
import { useReservationIdentityForm } from "@/components/use-reservation-identity-form";
import type { ApiErrorResponse, CancellationQuote, CancellationResult } from "@/lib/api/contracts";
import { formatStayRange, formatYen } from "@/lib/format";

function CancelReservationPageInner() {
  const searchParams = useSearchParams();
  const { identity, setIdentity, touched, touch, errors, hasError } = useReservationIdentityForm(
    searchParams.get("r") ?? "",
  );
  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [result, setResult] = useState<CancellationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchQuote() {
    touch();
    if (hasError) return;
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
      const data = (await res.json()) as { quote: CancellationQuote } | ApiErrorResponse;
      if (!res.ok) {
        setError((data as ApiErrorResponse).error?.message ?? "予約の照会に失敗しました。");
        return;
      }
      setQuote((data as { quote: CancellationQuote }).quote);
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
      const data = (await res.json()) as { cancellation: CancellationResult } | ApiErrorResponse;
      if (!res.ok) {
        setError((data as ApiErrorResponse).error?.message ?? "キャンセルに失敗しました。");
        return;
      }
      setResult((data as { cancellation: CancellationResult }).cancellation);
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
          ["宿泊料金", formatYen(result.totalCharge)],
          ["キャンセルポリシー", result.cancellationPolicy],
          ["キャンセル料", formatYen(result.cancellationFee)],
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
              ["宿泊料金", formatYen(quote.totalCharge)],
              ["キャンセルポリシー", quote.cancellationPolicy],
              ["キャンセル料", formatYen(quote.cancellationFee)],
            ]}
          />
          <div className="info-box" style={{ marginBottom: 16 }}>
            {quote.cancellationPolicyDescription}
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
                reservationNumber: errors.reservationNumber,
                familyName: errors.familyName,
                givenName: errors.givenName,
              }}
              touched={touched}
              onTouched={touch}
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
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="page-panel" role="status">
            予約情報を読み込んでいます…
          </div>
        </main>
      }
    >
      <CancelReservationPageInner />
    </Suspense>
  );
}
