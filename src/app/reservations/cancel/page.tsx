'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK = {
  number: 'HRS-20260710-0042',
  room: 'デラックスツイン',
  checkIn: '2026年7月10日',
  checkOut: '2026年7月12日',
  guests: '大人2名',
  name: '山田 太郎',
  total: 50400,
}

type View = 'form' | 'confirm' | 'complete'

export default function ReservationCancelPage() {
  const [view, setView] = useState<View>('form')

  if (view === 'complete') {
    return (
      <main className="page-shell">
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div className="complete-mark" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>✓</div>
          <h2 style={{ margin: '0 0 8px' }}>キャンセルが完了しました</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 8px' }}>
            予約番号 {MOCK.number} のキャンセルを受け付けました。
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--placeholder)', margin: '0 0 28px' }}>
            キャンセル確認メールをお送りしました。
          </p>
          <Link href="/" className="btn btn-primary">トップへ戻る</Link>
        </div>
      </main>
    )
  }

  if (view === 'confirm') {
    return (
      <main className="page-shell">
        <div style={{ maxWidth: 540 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>キャンセル確認</h2>
          <div className="confirm-table">
            {[
              ['予約番号', MOCK.number],
              ['客室', MOCK.room],
              ['宿泊日', `${MOCK.checkIn} → ${MOCK.checkOut}`],
              ['人数', MOCK.guests],
              ['代表者', MOCK.name],
              ['合計（税込）', `¥${MOCK.total.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <div className="info-box" style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700 }}>キャンセル手数料について</p>
            <ul style={{ margin: 0, padding: '0 0 0 16px', lineHeight: 1.8 }}>
              <li>チェックイン7日前まで：無料</li>
              <li>前日まで：宿泊料の50%</li>
              <li>当日・無連絡：宿泊料の100%</li>
            </ul>
          </div>
          <button
            className="btn btn-full btn-lg"
            style={{ background: '#dc2626', color: '#fff', marginBottom: 12 }}
            onClick={() => setView('complete')}
          >
            キャンセルを確定する
          </button>
          <button className="btn btn-secondary" onClick={() => setView('form')}>戻る</button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>予約をキャンセルする</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 28px' }}>
          予約番号と代表者氏名を入力してください。
        </p>
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
        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 20 }} onClick={() => setView('confirm')}>
          予約を照会する
        </button>
      </div>
    </main>
  )
}
