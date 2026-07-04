"use client";

import { useState } from "react";
import Link from "next/link";
import { LongWaitBar } from "@/components/LoadingIndicator";
import { validateReservationNumber, validateName } from "@/lib/validation";

interface CheckInResult {
  reservationNumber: string;
  roomTypeName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  checkedInAt: string;
}

interface ApiError {
  error: { code: string; message: string };
}

export default function CheckInPage() {
  const [reservationNumber, setReservationNumber] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reservationNumberError = validateReservationNumber(reservationNumber);
  const familyNameError = validateName(familyName, "姓");
  const givenNameError = validateName(givenName, "名");
  const fieldError = reservationNumberError ?? familyNameError ?? givenNameError;

  async function checkIn() {
    setTouched(true);
    if (fieldError) return;
    const number = reservationNumber.trim().toUpperCase();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${encodeURIComponent(number)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: familyName.trim(), givenName: givenName.trim() }),
      });
      const data = (await res.json()) as { checkIn: CheckInResult } | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error?.message ?? "チェックインに失敗しました。");
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
      <main className="page-shell">
        <div className="page-panel page-panel-centered">
          <div className="complete-mark">✓</div>
          <h1 className="page-title">チェックイン完了</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 8px" }}>
            お部屋の準備ができました。
          </p>
          <p className="section-heading" style={{ textAlign: "center" }}>
            お部屋番号
          </p>
          <div className="reservation-number">{result.roomNumber}</div>
          <div className="confirm-table" style={{ textAlign: "left" }}>
            {[
              ["予約番号", result.reservationNumber],
              ["部屋タイプ", result.roomTypeName],
              ["宿泊期間", `${result.checkInDate} 〜 ${result.checkOutDate}`],
              ["人数", `${result.guestCount}名`],
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

  return (
    <main className="page-shell">
      <div className="page-panel">
        <p className="page-kicker">CHECK-IN</p>
        <h1 className="page-title">チェックイン</h1>
        <p className="page-intro">ご予約時に発行された予約番号と宿泊代表者のお名前を入力してください。</p>
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
              <label className="field-label field-required" htmlFor="checkInFamilyName">
                姓
              </label>
              <input
                id="checkInFamilyName"
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
              <label className="field-label field-required" htmlFor="checkInGivenName">
                名
              </label>
              <input
                id="checkInGivenName"
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
          onClick={checkIn}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" /> 処理中…
            </>
          ) : (
            "チェックインする"
          )}
        </button>
        <LongWaitBar
          loading={loading}
          message="チェックインを処理しています。そのままお待ちください…"
        />
      </div>
    </main>
  );
}
