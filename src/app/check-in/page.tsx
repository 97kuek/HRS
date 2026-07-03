"use client";

import { useState } from "react";
import Link from "next/link";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { validateReservationNumber } from "@/lib/validation";

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
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fieldError = validateReservationNumber(reservationNumber);

  async function checkIn() {
    setTouched(true);
    if (fieldError) return;
    const number = reservationNumber.trim().toUpperCase();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${encodeURIComponent(number)}/check-in`, {
        method: "POST",
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
        <div style={{ maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
          <div className="complete-mark">✓</div>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>チェックイン完了</h1>
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
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 8px" }}>チェックイン</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 28px" }}>
          ご予約時に発行された予約番号を入力してください。
        </p>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">予約番号</label>
            <input
              className={
                !touched || reservationNumber.trim() === ""
                  ? "field-input"
                  : fieldError
                    ? "field-input is-invalid"
                    : "field-input is-valid"
              }
              type="text"
              value={reservationNumber}
              onBlur={() => setTouched(true)}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="HRS-YYYYMMDD-NNNN"
            />
            <span className="field-hint">
              予約完了時に発行された番号です。半角英数字・ハイフンありで入力してください（例: HRS-20260710-0042）。
            </span>
            {touched && fieldError && <span className="field-error">{fieldError}</span>}
          </div>
          {error && <div className="error-box">{error}</div>}
        </div>
        {loading ? (
          <LoadingIndicator label="チェックインを処理しています…" />
        ) : (
          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 20 }}
            onClick={checkIn}
          >
            チェックインする
          </button>
        )}
      </div>
    </main>
  );
}
