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
}

const AVAILABLE_ROOMS = ['0805号室', '0806号室', '0901号室', '0902号室']

type View = 'form' | 'confirm' | 'complete'

export default function CheckInPage() {
  const [view, setView] = useState<View>('form')
  const [assignedRoom, setAssignedRoom] = useState(AVAILABLE_ROOMS[0])

  if (view === 'complete') {
    return (
      <main className="page-shell">
        <div className="front-desk-badge">フロント業務</div>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div className="complete-mark">✓</div>
          <h2 style={{ margin: '0 0 20px' }}>チェックイン完了</h2>
          <div className="confirm-table" style={{ textAlign: 'left' }}>
            {[
              ['予約番号', MOCK.number],
              ['宿泊客', MOCK.name],
              ['割当客室', assignedRoom],
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
            ルームキーを発行してください。
          </p>
          <Link href="/check-in" className="btn btn-primary">次の予約を処理する</Link>
        </div>
      </main>
    )
  }

  if (view === 'confirm') {
    return (
      <main className="page-shell">
        <div className="front-desk-badge">フロント業務</div>
        <div style={{ maxWidth: 540 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>予約内容の確認・客室割当</h2>
          <div className="confirm-table">
            {[
              ['予約番号', MOCK.number],
              ['宿泊客', MOCK.name],
              ['部屋タイプ', MOCK.room],
              ['チェックイン', MOCK.checkIn],
              ['チェックアウト', MOCK.checkOut],
              ['人数', MOCK.guests],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <p className="section-heading">客室割当</p>
          <div className="field" style={{ maxWidth: 240, marginBottom: 16 }}>
            <label className="field-label field-required">割当客室</label>
            <select
              className="field-input"
              value={assignedRoom}
              onChange={(e) => setAssignedRoom(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {AVAILABLE_ROOMS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--muted)', margin: '0 0 20px' }}>
            <input type="checkbox" style={{ accentColor: 'var(--accent)' }} />
            本人確認済み
          </label>
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
      <div className="front-desk-badge">フロント業務</div>
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
