"use client";

import { useState } from "react";
import Link from "next/link";

const MOCK = {
  number: "HRS-20260710-0042",
  room: "デラックスツイン",
  checkIn: "2026年7月10日",
  checkOut: "2026年7月12日",
  guests: "大人2名",
  name: "山田 太郎",
  status: "予約済（未到着）",
  total: 50400,
};

export default function ReservationLookupPage() {
  const [view, setView] = useState<"form" | "result">("form");

  if (view === "result") {
    return (
      <main className="page-shell">
        <div className="page-panel">
          <button
            className="btn btn-secondary"
            style={{ marginBottom: 20, height: 32, padding: "0 12px", fontSize: "0.8125rem" }}
            onClick={() => setView("form")}
          >
            ← 照会に戻る
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 className="section-title" style={{ margin: 0 }}>
              予約詳細
            </h2>
            <span className="status-chip">{MOCK.status}</span>
          </div>
          <div className="confirm-table">
            {[
              ["予約番号", MOCK.number],
              ["客室", MOCK.room],
              ["チェックイン", MOCK.checkIn],
              ["チェックアウト", MOCK.checkOut],
              ["人数", MOCK.guests],
              ["代表者", MOCK.name],
              ["合計（税込）", `¥${MOCK.total.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <div className="info-box" style={{ marginBottom: 20 }}>
            <p className="section-heading" style={{ marginTop: 0 }}>
              キャンセルポリシー
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 1.8 }}>
              <li>チェックイン7日前まで：無料</li>
              <li>前日まで：宿泊料の50%</li>
              <li>当日・無連絡：宿泊料の100%</li>
            </ul>
          </div>
          <Link href="/reservations/cancel" className="btn btn-secondary btn-full">
            この予約をキャンセルする
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-panel">
        <p className="page-kicker">RESERVATION</p>
        <h1 className="page-title">予約を確認する</h1>
        <p className="page-intro">予約番号と代表者氏名を入力してください。</p>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">予約番号</label>
            <input className="field-input" type="text" placeholder="HRS-YYYYMMDD-NNNN" />
          </div>
          <div className="field">
            <label className="field-label field-required">代表者氏名</label>
            <input className="field-input" type="text" placeholder="山田 太郎" />
          </div>
        </div>
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
          onClick={() => setView("result")}
        >
          予約を照会する
        </button>
      </div>
    </main>
  );
}
