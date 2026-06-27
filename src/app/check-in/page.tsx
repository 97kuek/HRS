'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK = {
  number: 'HRS-20260710-0042',
  room: 'デラックスツイン',
  roomNumber: '0805号室',
  checkIn: '2026年7月10日',
  checkOut: '2026年7月12日',
  guests: '大人2名',
  name: '山田 太郎',
}

type View = 'form' | 'confirm' | 'complete'

export default function CheckInPage() {
  const [view, setView] = useState<View>('form')

  if (view === 'complete') {
    return (
      <main className="page-shell">
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div className="complete-mark">✓</div>
          <h2 style={{ margin: '0 0 20px' }}>チェックイン完了</h2>
          <div className="confirm-table" style={{ textAlign: 'left' }}>
            {[
              ['予約番号', MOCK.number],
              ['お名前', MOCK.name],
              ['客室', `${MOCK.room}（${MOCK.roomNumber}）`],
              ['宿泊日', `${MOCK.checkIn} → ${MOCK.checkOut}`],
              ['チェックイン時刻', '14:32'],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--placeholder)', margin: '16px 0 24px' }}>
            ルームキーをお受け取りください。
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
          <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>予約内容の確認</h2>
          <div className="confirm-table">
            {[
              ['予約番号', MOCK.number],
              ['お名前', MOCK.name],
              ['部屋タイプ', MOCK.room],
              ['チェックイン', MOCK.checkIn],
              ['チェックアウト', MOCK.checkOut],
              ['人数', MOCK.guests],
              ['割当客室', MOCK.roomNumber],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => setView('complete')}>
            チェックインを確定する
          </button>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => setView('form')}>戻る</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>チェックインする</h1>
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
          予約を照合する
        </button>
      </div>
    </main>
  )
}
