'use client'

import React, { useState } from 'react'
import Link from 'next/link'

const STEP_LABELS = ['日程', '客室', '宿泊者', '確認', '完了']

interface RoomType {
  id: number
  name: string
  meta: string
  price: number
  soldOut?: boolean
}

const ROOMS: RoomType[] = [
  { id: 1, name: 'スタンダードシングル', meta: '定員1名・18㎡・禁煙', price: 12000 },
  { id: 2, name: 'デラックスツイン', meta: '定員2名・32㎡・朝食付き', price: 24000 },
  { id: 3, name: 'スイート', meta: '定員4名・58㎡', price: 48000, soldOut: true },
]

function StepRail({ current }: { current: number }) {
  return (
    <div className="step-rail" style={{ marginBottom: 28 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const cls = n < current ? 'done' : n === current ? 'active' : ''
        return (
          <React.Fragment key={label}>
            <div className={`step-rail-item ${cls}`}>
              <span className="step-dot">{n}</span>
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && <div className="step-rail-line" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>宿泊日を選択</h2>
      <div className="form-stack">
        <div className="form-row">
          <div className="field">
            <label className="field-label">チェックイン</label>
            <input className="field-input" type="date" defaultValue="2026-07-10" />
          </div>
          <div className="field">
            <label className="field-label">チェックアウト</label>
            <input className="field-input" type="date" defaultValue="2026-07-12" />
          </div>
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label className="field-label">人数</label>
          <input className="field-input" type="number" defaultValue={2} min={1} max={10} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button className="btn btn-primary btn-lg" onClick={onNext}>次へ：客室を選ぶ</button>
      </div>
    </div>
  )
}

function Step2({ onNext, onBack }: { onNext: (room: RoomType) => void; onBack: () => void }) {
  return (
    <div>
      <div className="search-summary">
        <span>7/10〜7/12・大人2名</span>
        <button className="btn btn-secondary" style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}>変更</button>
        <span style={{ marginLeft: 'auto', color: 'var(--placeholder)', fontSize: '0.8125rem' }}>空室 8件</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div className="filter-panel">
          <p className="filter-section-title">料金</p>
          <div style={{ height: 4, background: '#e0e0db', borderRadius: 3, marginBottom: 14, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10%', width: '55%', height: 4, background: 'var(--accent)', borderRadius: 3 }} />
          </div>
          <p className="filter-section-title">部屋タイプ</p>
          {['シングル', 'ダブル', 'ツイン', 'スイート'].map((t) => (
            <label key={t} className="filter-option">
              <input type="checkbox" defaultChecked={t === 'シングル'} style={{ accentColor: 'var(--accent)' }} />
              {t}
            </label>
          ))}
          <p className="filter-section-title" style={{ marginTop: 12 }}>設備</p>
          {['禁煙', '朝食付き'].map((f) => (
            <label key={f} className="filter-option">
              <input type="checkbox" style={{ accentColor: 'var(--accent)' }} />
              {f}
            </label>
          ))}
        </div>
        <div className="room-list">
          {ROOMS.map((room) => (
            <div key={room.id} className={`room-card${room.soldOut ? ' sold-out' : ''}`}>
              <div className="room-photo">客室写真</div>
              <div className="room-info">
                <p className="room-name">
                  {room.name}
                  {room.soldOut && (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>満室</span>
                  )}
                </p>
                <p className="room-meta">{room.meta}</p>
                <div className="room-footer">
                  <span className="room-price">
                    ¥{room.price.toLocaleString()}
                    <span className="room-price-unit"> /泊</span>
                  </span>
                  {room.soldOut ? (
                    <button className="btn btn-secondary" style={{ height: 32, padding: '0 14px', fontSize: '0.75rem' }} disabled>満室</button>
                  ) : (
                    <button className="btn btn-primary" style={{ height: 32, padding: '0 14px', fontSize: '0.75rem' }} onClick={() => onNext(room)}>選択</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>戻る</button>
        <span />
      </div>
    </div>
  )
}

function Step3({ room, onNext, onBack }: { room: RoomType | null; onNext: () => void; onBack: () => void }) {
  return (
    <div className="layout-with-sidebar">
      <div className="layout-main">
        <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>宿泊代表者の情報</h2>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">氏名</label>
            <input className="field-input" type="text" placeholder="山田 太郎" />
          </div>
          <div className="field">
            <label className="field-label field-required">フリガナ</label>
            <input className="field-input" type="text" placeholder="ヤマダ タロウ" />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label field-required">電話番号</label>
              <input className="field-input" type="tel" placeholder="090-0000-0000" />
            </div>
            <div className="field">
              <label className="field-label field-required">メールアドレス</label>
              <input className="field-input" type="email" placeholder="example@email.com" />
            </div>
          </div>
          <div className="field">
            <label className="field-label">ご要望（任意）</label>
            <textarea className="field-input field-textarea" placeholder="高層階希望など" />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onBack}>戻る</button>
          <button className="btn btn-primary" onClick={onNext}>確認画面へ</button>
        </div>
      </div>
      <div className="layout-aside">
        <div className="summary-panel">
          <p className="summary-panel-title">予約内容</p>
          <div className="summary-photo" />
          <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: '0 0 6px', color: 'var(--foreground)' }}>
            {room?.name ?? 'デラックスツイン'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--placeholder)', margin: '0 0 10px', lineHeight: 1.6 }}>
            7/10 → 7/12（2泊）<br />大人2名
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>合計</span>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              ¥{((room?.price ?? 24000) * 2).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step4({ room, onNext, onBack }: { room: RoomType | null; onNext: () => void; onBack: () => void }) {
  const [payment, setPayment] = useState<'credit' | 'onsite'>('credit')
  const perNight = room?.price ?? 24000
  const roomTotal = perNight * 2
  const service = Math.round(roomTotal * 0.05)
  const total = roomTotal + service

  return (
    <div style={{ maxWidth: 540 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>ご予約内容の確認</h2>
      <div className="confirm-table">
        {[
          ['客室', room?.name ?? 'デラックスツイン'],
          ['宿泊日', '7/10 → 7/12（2泊）'],
          ['人数', '大人2名'],
          ['代表者', '山田 太郎'],
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
          <span>室料 ¥{perNight.toLocaleString()} × 2泊</span>
          <span>¥{roomTotal.toLocaleString()}</span>
        </div>
        <div className="price-row">
          <span>サービス料（5%）</span>
          <span>¥{service.toLocaleString()}</span>
        </div>
        <div className="price-row-total">
          <span>合計（税込）</span>
          <span>¥{total.toLocaleString()}</span>
        </div>
      </div>
      <p className="section-heading">お支払い方法</p>
      {(['credit', 'onsite'] as const).map((m) => (
        <div key={m} className={`payment-option${payment === m ? ' selected' : ''}`} onClick={() => setPayment(m)}>
          <span className="payment-radio" />
          {m === 'credit' ? 'クレジットカード' : '現地払い'}
        </div>
      ))}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--muted)', margin: '14px 0 20px' }}>
        <input type="checkbox" style={{ accentColor: 'var(--accent)' }} />
        <span>
          <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>キャンセルポリシー</span>
          に同意します
        </span>
      </label>
      <button className="btn btn-primary btn-full btn-lg" onClick={onNext}>予約を確定する</button>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-secondary" onClick={onBack}>戻る</button>
      </div>
    </div>
  )
}

function Step5({ room }: { room: RoomType | null }) {
  const total = Math.round((room?.price ?? 24000) * 2 * 1.05)
  return (
    <div style={{ maxWidth: 480, textAlign: 'center' }}>
      <div className="complete-mark">✓</div>
      <h2 style={{ margin: '0 0 8px' }}>予約が完了しました</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 4px' }}>ご予約番号</p>
      <div className="reservation-number">HRS-20260710-0042</div>
      <div className="confirm-table" style={{ textAlign: 'left', marginTop: 20 }}>
        {[
          ['客室', room?.name ?? 'デラックスツイン'],
          ['宿泊日', '7/10 → 7/12（2泊）'],
          ['人数', '大人2名'],
          ['合計（税込）', `¥${total.toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label} className="confirm-row">
            <span className="confirm-label">{label}</span>
            <span className="confirm-value">{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--placeholder)', margin: '16px 0 24px', lineHeight: 1.6 }}>
        確認メールをお送りしました。<br />予約番号は予約照会にご利用ください。
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/reservations/lookup" className="btn btn-secondary">予約を確認する</Link>
        <Link href="/" className="btn btn-primary">トップへ戻る</Link>
      </div>
    </div>
  )
}

export default function ReservationNewPage() {
  const [step, setStep] = useState(1)
  const [room, setRoom] = useState<RoomType | null>(null)

  return (
    <main className="page-shell">
      <StepRail current={step} />
      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onNext={(r) => { setRoom(r); setStep(3) }} onBack={() => setStep(1)} />}
      {step === 3 && <Step3 room={room} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <Step4 room={room} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
      {step === 5 && <Step5 room={room} />}
    </main>
  )
}
