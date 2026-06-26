'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK = {
  number: 'HRS-20260710-0042',
  room: 'デラックスツイン（0805号室）',
  checkIn: '2026年7月10日',
  checkOut: '2026年7月12日',
  nights: 2,
  name: '山田 太郎',
  roomTotal: 48000,
  service: 2400,
  total: 50400,
}

type View = 'form' | 'billing' | 'complete'

export default function CheckOutPage() {
  const [view, setView] = useState<View>('form')
  const [payment, setPayment] = useState<'credit' | 'onsite'>('credit')

  if (view === 'complete') {
    return (
      <main className="page-shell">
        <div className="front-desk-badge">フロント業務</div>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div className="complete-mark">✓</div>
          <h2 style={{ margin: '0 0 20px' }}>チェックアウト完了</h2>
          <div className="confirm-table" style={{ textAlign: 'left' }}>
            {[
              ['予約番号', MOCK.number],
              ['宿泊客', MOCK.name],
              ['客室', MOCK.room],
              ['合計（税込）', `¥${MOCK.total.toLocaleString()}`],
              ['支払い方法', payment === 'credit' ? 'クレジットカード' : '現地払い'],
              ['退室時刻', '11:15'],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-full" style={{ marginTop: 20 }}>領収書を発行する</button>
          <div style={{ marginTop: 12 }}>
            <Link href="/check-out" className="btn btn-primary">次の精算を処理する</Link>
          </div>
        </div>
      </main>
    )
  }

  if (view === 'billing') {
    return (
      <main className="page-shell">
        <div className="front-desk-badge">フロント業務</div>
        <div style={{ maxWidth: 540 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>精算・請求確認</h2>
          <div className="confirm-table">
            {[
              ['予約番号', MOCK.number],
              ['宿泊客', MOCK.name],
              ['客室', MOCK.room],
              ['宿泊日', `${MOCK.checkIn} → ${MOCK.checkOut}`],
            ].map(([label, value]) => (
              <div key={label} className="confirm-row">
                <span className="confirm-label">{label}</span>
                <span className="confirm-value">{value}</span>
              </div>
            ))}
          </div>
          <p className="section-heading">料金内訳</p>
          <div className="price-breakdown">
            <div className="price-row">
              <span>室料 ¥{(MOCK.roomTotal / MOCK.nights).toLocaleString()} × {MOCK.nights}泊</span>
              <span>¥{MOCK.roomTotal.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>サービス料（5%）</span>
              <span>¥{MOCK.service.toLocaleString()}</span>
            </div>
            <div className="price-row-total">
              <span>合計（税込）</span>
              <span>¥{MOCK.total.toLocaleString()}</span>
            </div>
          </div>
          <p className="section-heading">お支払い方法</p>
          {(['credit', 'onsite'] as const).map((m) => (
            <div key={m} className={`payment-option${payment === m ? ' selected' : ''}`} onClick={() => setPayment(m)}>
              <span className="payment-radio" />
              {m === 'credit' ? 'クレジットカード' : '現地払い'}
            </div>
          ))}
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 20 }} onClick={() => setView('complete')}>
            チェックアウトを確定する
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
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>チェックアウトする</h1>
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
        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 20 }} onClick={() => setView('billing')}>
          宿泊内容を確認する
        </button>
      </div>
    </main>
  )
}
