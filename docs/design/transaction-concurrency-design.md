# トランザクション・競合制御設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [API設計](api-design.md), [DB設計](db-design.md), [バリデーション・エラー設計](validation-error-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

HRS では、予約作成、チェックイン、チェックアウト、予約キャンセルで複数テーブルまたは予約状態を一体で更新する。これらは途中で失敗すると予約状態や宿泊情報が不整合になるため、Route Handler 内で `prisma.$transaction` を使ってトランザクション境界を管理する。

## 基本方針

- トランザクション境界は Route Handler 内の `prisma.$transaction` コールバックで管理する（当初の設計ではアプリケーション層のサービスクラスに置く想定だったが、初期実装では Route Handler に集約した）。
- ビジネスロジック（状態評価、割当選択、料金計算）は `src/lib/reservations/` および `src/lib/stays/` の純粋関数に分離しており、Route Handler はこれらを呼び出してトランザクション内で使う。
- 予約作成、チェックイン、チェックアウト、予約キャンセルは必ず `prisma.$transaction` 内で実行する。
- 競合は `DomainError`（`src/lib/api/response.ts`）として throw し、Route Handler で `apiError` に変換する。
- トランザクション内でメール送信などの外部通信は行わない。確定後に `void sendXxx(...)` で非同期に送信し、失敗しても HTTP レスポンスには影響させない。

## トランザクション対象

| 処理 | トランザクション対象 | 主な競合 |
| --- | --- | --- |
| 予約作成 | 空室確認、予約番号発行、利用者保存、予約保存 | 同時予約による空室不足、予約番号衝突 |
| チェックイン | 予約情報照合、予約状態確認、部屋割当、宿泊作成、予約状態更新 | 二重チェックイン、同じ部屋の二重割当 |
| チェックアウト | 予約情報照合、宿泊確認、料金作成、支払い作成、予約状態更新 | 二重チェックアウト、支払金額不一致 |
| 予約キャンセル | 予約情報照合、予約状態確認、予約状態更新 | チェックインとの競合、二重キャンセル |

## 予約作成

### 処理手順

1. Route Handler が `guest.name`, `guest.email`, `guest.phone`, `checkInDate`, `checkOutDate`, `guestCount`, `roomTypeId` の形式を検証する。
2. `prisma.$transaction` を開始する。
3. 部屋タイプと定員を確認する。
4. `hasAvailabilityForRoomType`（`src/lib/reservations/availability.ts`）で空室を再確認する。
5. `guests` を作成する。
6. `generateReservationNumber`（`src/lib/reservations/reservation-number.ts`）で `HRS-YYYYMMDD-NNNN` 形式の予約番号を発行する。
7. `reservations` を `RESERVED` で作成する。
8. 一意制約違反（P2002）が起きた場合は予約番号を再発行し、最大5回まで再試行する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| 空室確認後に別予約が入った | 予約作成直前または作成時に再確認し、空室不足なら `NO_AVAILABILITY` |
| `reservation_number` が衝突した | 再発行して再試行。再試行上限を超えたら `500` |
| 部屋タイプが削除・変更された | `ROOM_TYPE_NOT_FOUND` または `CAPACITY_EXCEEDED` |

## チェックイン

### 処理手順

1. Route Handler が予約番号、姓、名の形式を検証する。
2. `prisma.$transaction` を開始する。
3. 予約番号で予約を取得する。
4. 予約者の氏名（`guest.name`）と入力された `familyName givenName` を照合する。
5. `evaluateCheckIn`（`src/lib/reservations/check-in.ts`）で予約状態・チェックイン可能日を確認する。
6. `todayInHotelTz()` でサーバー側の JST 当日日付を取得し、チェックイン予定日と照合する。
7. 予約された部屋タイプに属し、`checkedOutAt = null` の宿泊が存在しない部屋を選ぶ。
8. `stays` を作成する（`checkedInAt` はサーバー時刻）。
9. `reservations.status` を `CHECKED_IN` に更新する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| 同じ予約を同時にチェックインした | `stays.reservation_id` の一意制約（P2002）を捕捉し、`INVALID_RESERVATION_STATUS` |
| 割り当て可能な部屋が存在しない | `NO_ASSIGNABLE_ROOM` |
| チェックイン予定日が今日でない | `NOT_CHECKIN_DATE` |
| 予約状態が `RESERVED` でない | `INVALID_RESERVATION_STATUS` |

## チェックアウト

### 処理手順

1. Route Handler が部屋番号、支払い金額、支払い方法の形式を検証する。支払い方法は `"現金"` または `"クレジットカード"` のみ受け付ける。
2. `prisma.$transaction` を開始する。
3. 部屋番号から `checkedOutAt = null` の `Stay` を取得する（宿泊の特定）。
4. `classifyMissingStay`（`src/lib/stays/check-out.ts`）で宿泊が存在しない原因を分類する（未チェックイン vs チェックアウト済み）。
5. `calculateNights` と `calculateCharge` で宿泊料金を計算する。
6. 支払金額と計算結果を照合する。
7. `lodging_charges` を作成する。
8. `payments` を作成する（`paidAt` はサーバー時刻）。
9. `stays.checked_out_at` を更新する（サーバー時刻）。
10. `reservations.status` を `CHECKED_OUT` に更新する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| チェックイン中の宿泊が存在しない | `STAY_NOT_FOUND` |
| 宿泊は存在するがチェックアウト済み | `ALREADY_CHECKED_OUT` |
| 支払金額が計算結果と異なる | `PAYMENT_AMOUNT_MISMATCH` |
| 料金作成が重複した（同時リクエスト） | `lodging_charges.stay_id` の一意制約（P2002）を捕捉し、`ALREADY_CHECKED_OUT` |

## 予約キャンセル

### 処理手順

1. Route Handler が予約番号、姓、名の形式を検証する。
2. `prisma.$transaction` を開始する。
3. 予約番号で予約を取得する。
4. 予約者の氏名と入力された `familyName givenName` を照合する。
5. `evaluateCancellation`（`src/lib/reservations/cancellation.ts`）で予約状態を確認する。
6. `updateMany` を使った条件付き更新（`WHERE status = 'RESERVED'`）で `CANCELLED` に変更する。更新件数が0なら別トランザクションが先行したと判断する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| 予約番号と氏名が一致しない | `RESERVATION_NOT_FOUND` |
| 予約状態が `RESERVED` でない | `INVALID_RESERVATION_STATUS` |
| キャンセル直前にチェックインされた（条件付き更新で0件） | `INVALID_RESERVATION_STATUS` |

## 実装パターン

Route Handler の中で `prisma.$transaction` を直接使い、ビジネスロジック関数を呼び出す。

```ts
const result = await prisma.$transaction(async (tx) => {
  const reservation = await tx.reservation.findUnique({ ... });

  // ビジネスロジックは純粋関数として src/lib/ から呼ぶ
  const evaluation = evaluateCheckIn({ status: reservation.status, ... });
  if (!evaluation.ok) throw new DomainError(evaluation.code, evaluation.status, evaluation.message);

  // DB更新
  const stay = await tx.stay.create({ ... });
  await tx.reservation.update({ ... });

  return { reservation, stay };
});
```

メール送信はトランザクション外で `void sendXxx(...)` として呼び、失敗しても HTTP レスポンスに影響させない。

## 未確定事項

- Postgres の分離レベルは初期実装では既定値を使う。競合テストで不十分な場合に `Serializable` または明示ロックを検討する。
- 予約作成時の空室数を厳密に守るため、将来は在庫テーブルや日別在庫テーブルを追加する可能性がある。
- 外部決済を導入する場合は、決済確定とDB更新の整合性を別途設計する。
