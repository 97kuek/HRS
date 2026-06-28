'use client'

import React, { useState } from 'react'
import Link from 'next/link'

const STEP_LABELS = ['日程', '客室', '宿泊者', '確認', '完了']

interface RoomTypeAvailability {
  roomTypeId: string
  name: string
  capacity: number
  baseRate: number
  availableCount: number
  totalCharge: number
}

interface SearchCondition {
  checkIn: string
  checkOut: string
  nights: number
  guestCount: number
}

interface GuestForm {
  name: string
  contact: string
}

interface ReservationResult {
  reservationNumber: string
  roomTypeName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guestCount: number
  totalCharge: number
}

interface ApiError {
  error: { code: string; message: string; details?: { field: string; message: string }[] }
}

const yen = (n: number) => `¥${n.toLocaleString()}`

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
              <span className="step-rail-label">{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <div className="step-rail-line" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/** Step1: 宿泊条件の入力 → 空室検索 */
function Step1({
  initial,
  onSearched,
}: {
  initial: { checkIn: string; checkOut: string; guestCount: number }
  onSearched: (condition: SearchCondition, roomTypes: RoomTypeAvailability[]) => void
}) {
  const [checkIn, setCheckIn] = useState(initial.checkIn)
  const [checkOut, setCheckOut] = useState(initial.checkOut)
  const [guestCount, setGuestCount] = useState(initial.guestCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guestCount: String(guestCount),
      })
      const res = await fetch(`/api/availability?${params}`)
      const data = (await res.json()) as { condition: SearchCondition; roomTypes: RoomTypeAvailability[] } | ApiError
      if (!res.ok) {
        setError((data as ApiError).error.message)
        return
      }
      const ok = data as { condition: SearchCondition; roomTypes: RoomTypeAvailability[] }
      onSearched(ok.condition, ok.roomTypes)
    } catch {
      setError('通信に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>宿泊日を選択</h2>
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="form-stack">
        <div className="form-row">
          <div className="field">
            <label className="field-label">チェックイン</label>
            <input className="field-input" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">チェックアウト</label>
            <input className="field-input" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label className="field-label">人数</label>
          <input
            className="field-input"
            type="number"
            value={guestCount}
            min={1}
            max={10}
            onChange={(e) => setGuestCount(Number(e.target.value))}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button className="btn btn-primary btn-lg" onClick={search} disabled={loading}>
          {loading ? '検索中…' : '次へ：客室を探す'}
        </button>
      </div>
    </div>
  )
}

/** Step2: 空室候補から部屋タイプを選択 */
function Step2({
  condition,
  roomTypes,
  onSelect,
  onBack,
}: {
  condition: SearchCondition
  roomTypes: RoomTypeAvailability[]
  onSelect: (room: RoomTypeAvailability) => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="search-summary">
        <span>
          {condition.checkIn}〜{condition.checkOut}（{condition.nights}泊）・{condition.guestCount}名
        </span>
        <button
          className="btn btn-secondary"
          style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
          onClick={onBack}
        >
          条件変更
        </button>
        <span style={{ marginLeft: 'auto', color: 'var(--placeholder)', fontSize: '0.8125rem' }}>
          空室 {roomTypes.length}タイプ
        </span>
      </div>
      <div className="room-list">
        {roomTypes.map((room) => (
          <div key={room.roomTypeId} className="room-card">
            <div className="room-photo">客室写真</div>
            <div className="room-info">
              <p className="room-name">
                {room.name}
                <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                  定員{room.capacity}名・残り{room.availableCount}室
                </span>
              </p>
              <p className="room-meta">
                {condition.nights}泊合計 {yen(room.totalCharge)}（{yen(room.baseRate)}/泊）
              </p>
              <div className="room-footer">
                <span className="room-price">
                  {yen(room.baseRate)}
                  <span className="room-price-unit"> /泊</span>
                </span>
                <button
                  className="btn btn-primary"
                  style={{ height: 32, padding: '0 14px', fontSize: '0.75rem' }}
                  onClick={() => onSelect(room)}
                >
                  選択
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>戻る</button>
        <span />
      </div>
    </div>
  )
}

/** Step3: 宿泊代表者の情報入力 */
function Step3({
  condition,
  room,
  initial,
  onNext,
  onBack,
}: {
  condition: SearchCondition
  room: RoomTypeAvailability
  initial: GuestForm
  onNext: (guest: GuestForm) => void
  onBack: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [contact, setContact] = useState(initial.contact)
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({})

  function next() {
    const e: { name?: string; contact?: string } = {}
    if (name.trim().length === 0) e.name = '氏名を入力してください。'
    if (contact.trim().length === 0) e.contact = '連絡先（電話番号またはメール）を入力してください。'
    setErrors(e)
    if (Object.keys(e).length === 0) {
      onNext({ name: name.trim(), contact: contact.trim() })
    }
  }

  return (
    <div className="layout-with-sidebar">
      <div className="layout-main">
        <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>宿泊代表者の情報</h2>
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">氏名</label>
            <input
              className="field-input"
              type="text"
              placeholder="山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label className="field-label field-required">連絡先（電話番号 / メール）</label>
            <input
              className="field-input"
              type="text"
              placeholder="090-0000-0000 / example@email.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            {errors.contact && <span className="field-error">{errors.contact}</span>}
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onBack}>戻る</button>
          <button className="btn btn-primary" onClick={next}>確認画面へ</button>
        </div>
      </div>
      <div className="layout-aside">
        <div className="summary-panel">
          <p className="summary-panel-title">予約内容</p>
          <div className="summary-photo" />
          <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: '0 0 6px', color: 'var(--foreground)' }}>
            {room.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--placeholder)', margin: '0 0 10px', lineHeight: 1.6 }}>
            {condition.checkIn} → {condition.checkOut}（{condition.nights}泊）<br />
            {condition.guestCount}名
          </p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>合計</span>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{yen(room.totalCharge)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Step4: 予約内容の確認・確定 */
function Step4({
  condition,
  room,
  guest,
  onConfirmed,
  onBack,
  onUnavailable,
}: {
  condition: SearchCondition
  room: RoomTypeAvailability
  guest: GuestForm
  onConfirmed: (result: ReservationResult) => void
  onBack: () => void
  onUnavailable: (message: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: room.roomTypeId,
          checkInDate: condition.checkIn,
          checkOutDate: condition.checkOut,
          guestCount: condition.guestCount,
          guest,
        }),
      })
      const data = (await res.json()) as { reservation: ReservationResult } | ApiError
      if (!res.ok) {
        const apiErr = data as ApiError
        // 空室が無くなった場合は客室選択へ戻す（例外 E3）。
        if (apiErr.error.code === 'NO_AVAILABILITY') {
          onUnavailable(apiErr.error.message)
          return
        }
        setError(apiErr.error.message)
        return
      }
      onConfirmed((data as { reservation: ReservationResult }).reservation)
    } catch {
      setError('通信に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 540 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>ご予約内容の確認</h2>
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="confirm-table">
        {[
          ['客室', room.name],
          ['宿泊日', `${condition.checkIn} → ${condition.checkOut}（${condition.nights}泊）`],
          ['人数', `${condition.guestCount}名`],
          ['代表者', guest.name],
          ['連絡先', guest.contact],
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
          <span>室料 {yen(room.baseRate)} × {condition.nights}泊</span>
          <span>{yen(room.totalCharge)}</span>
        </div>
        <div className="price-row-total">
          <span>合計</span>
          <span>{yen(room.totalCharge)}</span>
        </div>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--placeholder)', margin: '14px 0 20px', lineHeight: 1.6 }}>
        お支払いはチェックイン／チェックアウト時に承ります。
      </p>
      <button className="btn btn-primary btn-full btn-lg" onClick={confirm} disabled={loading}>
        {loading ? '予約処理中…' : '予約を確定する'}
      </button>
      <div style={{ marginTop: 12 }}>
        <button className="btn btn-secondary" onClick={onBack} disabled={loading}>戻る</button>
      </div>
    </div>
  )
}

/** Step5: 予約完了 */
function Step5({ result }: { result: ReservationResult }) {
  return (
    <div style={{ maxWidth: 480, textAlign: 'center' }}>
      <div className="complete-mark">✓</div>
      <h2 style={{ margin: '0 0 8px' }}>予約が完了しました</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 4px' }}>ご予約番号</p>
      <div className="reservation-number">{result.reservationNumber}</div>
      <div className="confirm-table" style={{ textAlign: 'left', marginTop: 20 }}>
        {[
          ['客室', result.roomTypeName],
          ['宿泊日', `${result.checkInDate} → ${result.checkOutDate}（${result.nights}泊）`],
          ['人数', `${result.guestCount}名`],
          ['合計', yen(result.totalCharge)],
        ].map(([label, value]) => (
          <div key={label} className="confirm-row">
            <span className="confirm-label">{label}</span>
            <span className="confirm-value">{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--placeholder)', margin: '16px 0 24px', lineHeight: 1.6 }}>
        予約番号は予約照会にご利用ください。
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
  const [condition, setCondition] = useState<SearchCondition | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomTypeAvailability[]>([])
  const [room, setRoom] = useState<RoomTypeAvailability | null>(null)
  const [guest, setGuest] = useState<GuestForm>({ name: '', contact: '' })
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <main className="page-shell">
      <StepRail current={step} />
      {notice && step === 2 && (
        <div className="error-box" style={{ marginBottom: 16 }}>{notice}</div>
      )}
      {step === 1 && (
        <Step1
          initial={{ checkIn: '2026-07-10', checkOut: '2026-07-12', guestCount: 2 }}
          onSearched={(c, rts) => {
            setCondition(c)
            setRoomTypes(rts)
            setNotice(null)
            setStep(2)
          }}
        />
      )}
      {step === 2 && condition && (
        <Step2
          condition={condition}
          roomTypes={roomTypes}
          onSelect={(r) => {
            setRoom(r)
            setNotice(null)
            setStep(3)
          }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && condition && room && (
        <Step3
          condition={condition}
          room={room}
          initial={guest}
          onNext={(g) => {
            setGuest(g)
            setStep(4)
          }}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && condition && room && (
        <Step4
          condition={condition}
          room={room}
          guest={guest}
          onConfirmed={(r) => {
            setResult(r)
            setStep(5)
          }}
          onBack={() => setStep(3)}
          onUnavailable={(message) => {
            setNotice(message)
            setStep(2)
          }}
        />
      )}
      {step === 5 && result && <Step5 result={result} />}
    </main>
  )
}
