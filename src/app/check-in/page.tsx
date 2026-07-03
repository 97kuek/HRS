"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn() {
    const number = reservationNumber.trim();
    if (!number) {
      setError("予約番号を入力してください。");
      return;
    }
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
              className="field-input"
              type="text"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="HRS-YYYYMMDD-NNNN"
            />
          </div>
          {error && <div className="error-box">{error}</div>}
        </div>
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
          onClick={checkIn}
          disabled={loading}
        >
          {loading ? "処理中…" : "チェックインする"}
        </button>
      </div>
    </main>
  );
}
