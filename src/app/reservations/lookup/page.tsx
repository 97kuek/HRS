"use client";

import Link from "next/link";
import { useState } from "react";
import { LongWaitBar } from "@/components/LoadingIndicator";
import { validateName, validateReservationNumber } from "@/lib/validation";

interface LookupResult {
  reservationNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  guestName: string;
  contact: string;
  status: "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  totalCharge: number;
  roomNumber: string | null;
}

interface ApiError {
  error: { code: string; message: string };
}

const statusLabels: Record<LookupResult["status"], string> = {
  RESERVED: "予約済（未到着）",
  CHECKED_IN: "チェックイン済み",
  CHECKED_OUT: "チェックアウト済み",
  CANCELLED: "キャンセル済み",
};

export default function ReservationLookupPage() {
  const [reservationNumber, setReservationNumber] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const reservationNumberError = validateReservationNumber(reservationNumber);
  const familyNameError = validateName(familyName, "姓");
  const givenNameError = validateName(givenName, "名");
  const canSearch = !reservationNumberError && !familyNameError && !givenNameError;

  async function search() {
    setTouched(true);
    if (!canSearch) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        familyName: familyName.trim(),
        givenName: givenName.trim(),
      });
      const response = await fetch(
        `/api/reservations/${encodeURIComponent(reservationNumber.trim().toUpperCase())}?${params}`,
      );
      const data = (await response.json()) as { reservation: LookupResult } | ApiError;
      if (!response.ok) {
        setError((data as ApiError).error.message);
        return;
      }
      setResult((data as { reservation: LookupResult }).reservation);
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
          <div className="confirm-table">
            {[
              ["予約番号", result.reservationNumber],
              ["客室", result.roomTypeName],
              ...(result.roomNumber ? [["部屋番号", result.roomNumber] as [string, string]] : []),
              ["チェックイン", result.checkInDate],
              ["チェックアウト", result.checkOutDate],
              ["人数", `${result.guestCount}名`],
              ["代表者", result.guestName],
              ["連絡先", result.contact],
              ["合計（税込）", `¥${result.totalCharge.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          {result.status === "RESERVED" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.checkInDate === new Date().toISOString().slice(0, 10) && (
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
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required" htmlFor="lookupReservationNumber">
              予約番号
            </label>
            <input
              id="lookupReservationNumber"
              className="field-input"
              type="text"
              value={reservationNumber}
              onChange={(event) => setReservationNumber(event.target.value)}
              placeholder="HRS-YYYYMMDD-NNNN"
              aria-invalid={touched && Boolean(reservationNumberError)}
            />
            {touched && reservationNumberError && (
              <span className="field-error">{reservationNumberError}</span>
            )}
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label field-required" htmlFor="lookupFamilyName">
                姓
              </label>
              <input
                id="lookupFamilyName"
                className="field-input"
                type="text"
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                autoComplete="family-name"
                placeholder="山田"
                aria-invalid={touched && Boolean(familyNameError)}
              />
              {touched && familyNameError && <span className="field-error">{familyNameError}</span>}
            </div>
            <div className="field">
              <label className="field-label field-required" htmlFor="lookupGivenName">
                名
              </label>
              <input
                id="lookupGivenName"
                className="field-input"
                type="text"
                value={givenName}
                onChange={(event) => setGivenName(event.target.value)}
                autoComplete="given-name"
                placeholder="太郎"
                aria-invalid={touched && Boolean(givenNameError)}
              />
              {touched && givenNameError && <span className="field-error">{givenNameError}</span>}
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}
        </div>
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
          onClick={search}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "照会中…" : "予約を照会する"}
        </button>
        <LongWaitBar loading={loading} message="ご予約を照会しています…" />
      </div>
    </main>
  );
}
