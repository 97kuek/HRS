"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmTable } from "@/components/confirm-table";
import { IdentityVerificationForm } from "@/components/identity-verification-form";
import { LongWaitBar } from "@/components/loading-indicator";
import { ResultPanel } from "@/components/result-panel";
import { SubmitButton } from "@/components/submit-button";
import { useReservationIdentityForm } from "@/components/use-reservation-identity-form";
import type { ApiErrorResponse, CheckInResult } from "@/lib/api/contracts";

export default function CheckInPage() {
  const { identity, setIdentity, touched, touch, errors, hasError } = useReservationIdentityForm();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn() {
    touch();
    if (hasError) return;
    const number = identity.reservationNumber.trim().toUpperCase();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${encodeURIComponent(number)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: identity.familyName.trim(),
          givenName: identity.givenName.trim(),
        }),
      });
      const data = (await res.json()) as { checkIn: CheckInResult } | ApiErrorResponse;
      if (!res.ok) {
        setError((data as ApiErrorResponse).error?.message ?? "チェックインに失敗しました。");
        return;
      }
      setResult((data as { checkIn: CheckInResult }).checkIn);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <ResultPanel title="チェックイン完了" description="お部屋の準備ができました。">
        <p className="section-heading" style={{ textAlign: "center" }}>
          お部屋番号
        </p>
        <div className="reservation-number">{result.roomNumber}</div>
        <ConfirmTable
          className="confirm-table-left"
          rows={[
            ["予約番号", result.reservationNumber],
            ["部屋タイプ", result.roomTypeName],
            ["宿泊期間", `${result.checkInDate} 〜 ${result.checkOutDate}`],
            ["人数", `${result.guestCount}名`],
          ]}
        />
        <Link href="/" className="btn btn-secondary btn-full" style={{ marginTop: 16 }}>
          トップへ戻る
        </Link>
      </ResultPanel>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-panel">
        <p className="page-kicker">CHECK-IN</p>
        <h1 className="page-title">チェックイン</h1>
        <p className="page-intro">
          ご予約時に発行された予約番号と宿泊代表者のお名前を入力してください。
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkIn();
          }}
        >
          <div className="form-stack">
            <IdentityVerificationForm
              idPrefix="checkIn"
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
            <SubmitButton loading={loading} loadingLabel="処理中…">
              チェックインする
            </SubmitButton>
          </div>
          <LongWaitBar
            loading={loading}
            message="チェックインを処理しています。そのままお待ちください…"
          />
        </form>
      </div>
    </main>
  );
}
