'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { LoadingIndicator } from '@/components/LoadingIndicator'
import { CompletionMeter } from '@/components/CompletionMeter'
import { LeaveConfirmModal, useBeforeUnloadGuard } from '@/components/LeaveGuard'
import {
  validateName,
  validateContact,
  validateStayDates,
  validateGuestCount,
} from '@/lib/validation'

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

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(base: string, days: number) {
  const d = new Date(`${base}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function inputClass(touched: boolean, value: string, error: string | null) {
  if (!touched || value.trim() === '') return 'field-input'
  return error ? 'field-input is-invalid' : 'field-input is-valid'
}

function StepRail({ current }: { current: number }) {
  return (
    <div className="step-rail" style={{ marginBottom: 28 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const cls = n < current ? 'done' : n === current ? 'active' : ''
        return (
          <React.Fragment key={label}>
            <div className={`step-rail-item ${cls}`}>
              <span className="step-dot">{n < current ? '✓' : n}</span>
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
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateError = validateStayDates(checkIn, checkOut)
  const guestError = validateGuestCount(guestCount)
  const completed = (dateError ? 0 : 1) + (guestError ? 0 : 1)
  const canSearch = !dateError && !guestError

  async function search() {
    setTouched(true)
    if (!canSearch) return
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
      <CompletionMeter completed={completed} total={2} />
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="form-stack">
        <div className="form-row">
          <div className="field">
            <label className="field-label field-required">チェックイン</label>
            <input
              className="field-input"
              type="date"
              value={checkIn}
              min={todayISO()}
              onBlur={() => setTouched(true)}
              onChange={(e) => {
                const v = e.target.value
                setCheckIn(v)
                if (checkOut <= v) setCheckOut(addDaysISO(v, 1))
              }}
            />
          </div>
          <div className="field">
            <label className="field-label field-required">チェックアウト</label>
            <input
              className="field-input"
              type="date"
              value={checkOut}
              min={addDaysISO(checkIn, 1)}
              onBlur={() => setTouched(true)}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
        <span className="field-hint">本日以降の日付を選択してください。チェックアウトはチェックインの翌日以降です。</span>
        {touched && dateError && <span className="field-error">{dateError}</span>}
        <div className="field" style={{ maxWidth: 180 }}>
          <label className="field-label field-required">人数</label>
          <input
            className={inputClass(touched, String(guestCount), guestError)}
            type="number"
            value={guestCount}
            min={1}
            max={10}
            onBlur={() => setTouched(true)}
            onChange={(e) => setGuestCount(Number(e.target.value))}
          />
          <span className="field-hint">半角数字・1〜10名</span>
          {touched && guestError && <span className="field-error">{guestError}</span>}
        </div>
      </div>
      {loading ? (
        <LoadingIndicator label="空室を検索しています…" longWaitLabel="空室を確認しています。そのままお待ちください…" />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
          <button className="btn btn-primary btn-lg" onClick={search}>
            次へ：客室を探す
          </button>
        </div>
      )}
    </div>
  )
}

type SortKey = 'recommended' | 'priceAsc' | 'capacityDesc'

/** Step2: 空室候補から部屋タイプを選択（比較・お気に入り対応） */
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
  const [sort, setSort] = useState<SortKey>('recommended')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [copied, setCopied] = useState(false)

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const shown = useMemo(() => {
    let list = [...roomTypes]
    if (onlyFavorites) list = list.filter((r) => favorites.has(r.roomTypeId))
    if (sort === 'priceAsc') list.sort((a, b) => a.totalCharge - b.totalCharge)
    if (sort === 'capacityDesc') list.sort((a, b) => b.capacity - a.capacity)
    return list
  }, [roomTypes, sort, onlyFavorites, favorites])

  async function shareCondition() {
    const text = `【宿泊条件】${condition.checkIn}〜${condition.checkOut}（${condition.nights}泊）・${condition.guestCount}名\n空室 ${roomTypes.length}タイプ / HRS`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

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
        <button
          className="btn btn-secondary"
          style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
          onClick={shareCondition}
        >
          {copied ? 'コピーしました' : '条件を共有'}
        </button>
        <span style={{ marginLeft: 'auto', color: 'var(--placeholder)', fontSize: '0.8125rem' }}>
          空室 {roomTypes.length}タイプ
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
          fontSize: '0.75rem',
          color: 'var(--muted)',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          並び替え
          <select
            className="field-input"
            style={{ height: 30, width: 'auto', padding: '0 8px', fontSize: '0.75rem' }}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="recommended">おすすめ順</option>
            <option value="priceAsc">料金が安い順</option>
            <option value="capacityDesc">定員が多い順</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={onlyFavorites}
            onChange={(e) => setOnlyFavorites(e.target.checked)}
          />
          気になる（★{favorites.size}）だけ表示
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="info-box">
          {onlyFavorites
            ? '「気になる」に登録した客室がありません。★を付けて比較できます。'
            : 'ご指定の条件に空室が見つかりませんでした。日程や人数を変更してお試しください。'}
        </div>
      ) : (
        <div className="room-list">
          {shown.map((room) => {
            const isFav = favorites.has(room.roomTypeId)
            const low = room.availableCount <= 2
            return (
              <div key={room.roomTypeId} className="room-card">
                <div className="room-photo" aria-hidden="true">
                  <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🛏️</span>
                </div>
                <div className="room-info">
                  <p className="room-name">
                    {room.name}
                    <span style={{ fontSize: '0.6875rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                      定員{room.capacity}名
                    </span>
                    {low && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: '#c0392b',
                          background: '#fdecec',
                          borderRadius: 3,
                          padding: '1px 6px',
                        }}
                      >
                        残り{room.availableCount}室
                      </span>
                    )}
                  </p>
                  <p className="room-meta">
                    {condition.nights}泊合計 {yen(room.totalCharge)}（{yen(room.baseRate)}/泊）
                  </p>
                  <div className="room-footer">
                    <span className="room-price">
                      {yen(room.baseRate)}
                      <span className="room-price-unit"> /泊</span>
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ height: 32, padding: '0 10px', fontSize: '0.75rem' }}
                        aria-pressed={isFav}
                        onClick={() => toggleFavorite(room.roomTypeId)}
                      >
                        {isFav ? '★ 気になる' : '☆ 気になる'}
                      </button>
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
              </div>
            )
          })}
        </div>
      )}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>戻る</button>
        <span />
      </div>
    </div>
  )
}

/** Step3: 宿泊代表者の情報入力（即時フィードバック対応） */
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
  const [touched, setTouched] = useState<{ name: boolean; contact: boolean }>({ name: false, contact: false })

  const nameError = validateName(name)
  const contactError = validateContact(contact)
  const completed = (nameError ? 0 : 1) + (contactError ? 0 : 1)

  function next() {
    setTouched({ name: true, contact: true })
    if (!nameError && !contactError) {
      onNext({ name: name.trim(), contact: contact.trim() })
    }
  }

  return (
    <div className="layout-with-sidebar">
      <div className="layout-main">
        <h2 style={{ margin: '0 0 20px', fontSize: '1.125rem', fontWeight: 700 }}>宿泊代表者の情報</h2>
        <CompletionMeter completed={completed} total={2} />
        <div className="form-stack">
          <div className="field">
            <label className="field-label field-required">氏名</label>
            <input
              className={inputClass(touched.name, name, nameError)}
              type="text"
              placeholder="山田 太郎"
              value={name}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="field-hint">例: 山田 太郎</span>
            {touched.name && nameError && <span className="field-error">{nameError}</span>}
          </div>
          <div className="field">
            <label className="field-label field-required">連絡先（電話番号 / メール）</label>
            <input
              className={inputClass(touched.contact, contact, contactError)}
              type="text"
              placeholder="090-1234-5678 または guest@example.com"
              value={contact}
              onBlur={() => setTouched((t) => ({ ...t, contact: true }))}
              onChange={(e) => setContact(e.target.value)}
            />
            <span className="field-hint">
              電話番号は市外局番から。ハイフンは有無どちらでも可（例: 09012345678 / 090-1234-5678）。メールは半角で入力してください。
            </span>
            {touched.contact && contactError && <span className="field-error">{contactError}</span>}
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
      {loading ? (
        <LoadingIndicator label="予約を確定しています…" longWaitLabel="予約を確定しています。画面を閉じずにお待ちください…" />
      ) : (
        <>
          <button className="btn btn-primary btn-full btn-lg" onClick={confirm}>
            予約を確定する
          </button>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={onBack}>戻る</button>
          </div>
        </>
      )}
    </div>
  )
}

/** Step5: 予約完了（次のアクションを明示） */
function Step5({ result }: { result: ReservationResult }) {
  const [copied, setCopied] = useState(false)

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(result.reservationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, textAlign: 'center' }}>
      <div className="complete-mark">✓</div>
      <h2 style={{ margin: '0 0 8px' }}>予約が完了しました</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 4px' }}>ご予約番号</p>
      <div className="reservation-number">{result.reservationNumber}</div>
      <button
        className="btn btn-secondary"
        style={{ height: 32, padding: '0 12px', fontSize: '0.8125rem', marginBottom: 8 }}
        onClick={copyNumber}
      >
        {copied ? '予約番号をコピーしました' : '予約番号をコピー'}
      </button>
      <div className="confirm-table" style={{ textAlign: 'left', marginTop: 12 }}>
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
      <div className="info-box" style={{ textAlign: 'left', margin: '20px 0 24px' }}>
        <p className="section-heading" style={{ marginTop: 0 }}>次にできること</p>
        <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9, fontSize: '0.8125rem' }}>
          <li>予約番号は「予約を確認する」で照会・キャンセルに使います。控えておいてください。</li>
          <li>ご来館時はフロントで予約番号をお伝えください。</li>
        </ul>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/reservations/lookup" className="btn btn-secondary">予約を確認する</Link>
        <Link href="/" className="btn btn-primary">トップへ戻る</Link>
      </div>
    </div>
  )
}

export default function ReservationNewPage() {
  const defaultCheckIn = addDaysISO(todayISO(), 7)
  const [step, setStep] = useState(1)
  const [condition, setCondition] = useState<SearchCondition | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomTypeAvailability[]>([])
  const [room, setRoom] = useState<RoomTypeAvailability | null>(null)
  const [guest, setGuest] = useState<GuestForm>({ name: '', contact: '' })
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showLeave, setShowLeave] = useState(false)

  // 客室選択〜確認の途中（完了前）はタブを閉じる／リロードで警告する。
  const inProgress = step >= 2 && step <= 4
  useBeforeUnloadGuard(inProgress)

  return (
    <main className="page-shell">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <StepRail current={step} />
        </div>
      </div>
      {inProgress && (
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <button
            className="btn btn-secondary"
            style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}
            onClick={() => setShowLeave(true)}
          >
            予約を中止
          </button>
        </div>
      )}
      {notice && step === 2 && (
        <div className="error-box" style={{ marginBottom: 16 }}>{notice}</div>
      )}
      {step === 1 && (
        <Step1
          initial={{ checkIn: defaultCheckIn, checkOut: addDaysISO(defaultCheckIn, 2), guestCount: 2 }}
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

      {showLeave && (
        <LeaveConfirmModal
          title="予約を中止しますか？"
          body="入力中の内容は保存されません。最初からやり直す場合は「中止する」を選んでください。"
          confirmLabel="中止してトップへ"
          cancelLabel="入力を続ける"
          onConfirm={() => {
            window.location.href = '/'
          }}
          onCancel={() => setShowLeave(false)}
        />
      )}
    </main>
  )
}
