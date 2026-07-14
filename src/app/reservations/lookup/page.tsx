"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmTable } from "@/components/confirm-table";
import { IdentityVerificationForm } from "@/components/identity-verification-form";
import { LongWaitBar } from "@/components/loading-indicator";
import { SubmitButton } from "@/components/submit-button";
import { useReservationIdentityForm } from "@/components/use-reservation-identity-form";
import type { ApiErrorResponse, ReservationLookup } from "@/lib/api/contracts";
import { formatYen } from "@/lib/format";

const statusLabels: Record<ReservationLookup["status"], string> = {
  RESERVED: "予約済（未到着）",
  CHECKED_IN: "チェックイン済み",
  CHECKED_OUT: "チェックアウト済み",
  CANCELLED: "キャンセル済み",
};

export default function ReservationLookupPage() {
  const { identity, setIdentity, touched, touch, errors, hasError } = useReservationIdentityForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReservationLookup | null>(null);

  async function search() {
    touch();
    if (hasError) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        familyName: identity.familyName.trim(),
        givenName: identity.givenName.trim(),
      });
      const response = await fetch(
        `/api/reservations/${encodeURIComponent(identity.reservationNumber.trim().toUpperCase())}?${params}`,
      );
      const data = (await response.json()) as { reservation: ReservationLookup } | ApiErrorResponse;
      if (!response.ok) {
        setError((data as ApiErrorResponse).error.message);
        return;
      }
      setResult((data as { reservation: ReservationLookup }).reservation);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <main className="page-shell">
        <div className="page-panel">
          <button
            className="btn btn-secondary"
            style={{ marginBottom: 20, height: 32, padding: "0 12px", fontSize: "0.8125rem" }}
            onClick={() => setResult(null)}
          >
            ← 照会に戻る
          </button>
          <div className="lookup-heading">
            <h1 className="section-title" style={{ margin: 0 }}>
              予約詳細
            </h1>
            <span className="status-chip">{statusLabels[result.status]}</span>
          </div>
          <ConfirmTable
            rows={[
              ["予約番号", result.reservationNumber],
              ["客室", result.roomTypeName],
              ...(result.roomNumber ? [["部屋番号", result.roomNumber] as [string, string]] : []),
              ["チェックイン", result.checkInDate],
              ["チェックアウト", result.checkOutDate],
              ["人数", `${result.guestCount}名`],
              ["代表者", result.guestName],
              ["メール", result.email],
              ...(result.phone ? [["電話番号", result.phone] as [string, string]] : []),
              ["合計（税込）", formatYen(result.totalCharge)],
            ]}
          />
          {result.status === "RESERVED" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.checkInDate ===
                new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }) && (
                <Link href="/check-in" className="btn btn-primary btn-full">
                  チェックインへ進む
                </Link>
              )}
              <Link
                href={`/reservations/cancel?r=${encodeURIComponent(result.reservationNumber)}`}
                className="btn btn-secondary btn-full"
              >
                この予約をキャンセルする
              </Link>
            </div>
          )}
          {result.status === "CHECKED_IN" && (
            <Link href="/check-out" className="btn btn-secondary btn-full">
              チェックアウトへ進む
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-panel">
        <p className="page-kicker">RESERVATION</p>
        <h1 className="page-title">予約を確認する</h1>
        <p className="page-intro">予約番号と宿泊代表者のお名前を入力してください。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <div className="form-stack">
            <IdentityVerificationForm
              idPrefix="lookup"
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
          <LongWaitBar loading={loading} message="ご予約を照会しています…" />
        </form>
      </div>
    </main>
  );
}
