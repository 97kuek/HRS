# トランザクション・競合制御設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [API設計](api-design.md), [DB設計](db-design.md), [バリデーション・エラー設計](validation-error-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

HRS では、予約作成、チェックイン、チェックアウト、予約キャンセルで複数テーブルまたは予約状態を一体で更新する。これらは途中で失敗すると予約状態や宿泊情報が不整合になるため、アプリケーション層のユースケースサービスでトランザクション境界を持つ。

## 基本方針

- トランザクション境界は Route Handler ではなくアプリケーション層に置く。
- Repository は Prisma Client または Prisma Transaction Client を受け取り、同じトランザクション内でDB操作する。
- 予約作成、チェックイン、チェックアウト、予約キャンセルは必ず `Prisma.$transaction` 内で実行する。
- 競合はアプリケーション層で業務エラーに変換し、APIでは `409 Conflict` を返す。
- トランザクション内で外部通信は行わない。初期実装では外部決済を扱わない。

## トランザクション対象

| 処理 | トランザクション対象 | 主な競合 |
| --- | --- | --- |
| 予約作成 | 空室確認、予約番号発行、利用者保存、予約保存 | 同時予約による空室不足、予約番号衝突 |
| チェックイン | 予約情報照合、予約状態確認、部屋割当、宿泊作成、予約状態更新 | 二重チェックイン、同じ部屋の二重割当 |
| チェックアウト | 予約情報照合、宿泊確認、料金作成、支払い作成、予約状態更新 | 二重チェックアウト、支払金額不一致 |
| 予約キャンセル | 予約情報照合、予約状態確認、予約状態更新 | チェックインとの競合、二重キャンセル |

## 予約作成

### 処理手順

1. Route Handler が入力形式を検証する。
2. `ReservationService.createReservation` がトランザクションを開始する。
3. 部屋タイプと定員を確認する。
4. 対象期間の予約数と部屋数から空室数を確認する。
5. `guests` を作成する。
6. `reservation_number` を発行する。
7. `reservations` を `RESERVED` で作成する。
8. 一意制約違反が起きた場合は予約番号を再発行し、限定回数だけ再試行する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| 空室確認後に別予約が入った | 予約作成直前または作成時に再確認し、空室不足なら `NO_AVAILABILITY` |
| `reservation_number` が衝突した | 再発行して再試行。再試行上限を超えたら `500` |
| 部屋タイプが削除・変更された | `ROOM_TYPE_NOT_FOUND` または `CAPACITY_EXCEEDED` |

## チェックイン

### 処理手順

1. Route Handler が予約番号、連絡先、チェックイン日時の形式を検証する。
2. `CheckInService.checkIn` がトランザクションを開始する。
3. 予約番号で予約を取得する。
4. 予約に紐づく連絡先を照合する。
5. 予約状態が `RESERVED` であることを確認する。
6. チェックイン可能日であることを確認する。
7. 予約された部屋タイプに属し、対象期間に他の宿泊へ割り当てられていない部屋を選ぶ。
8. `stays` を作成する。
9. `reservations.status` を `CHECKED_IN` に更新する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| 同じ予約を同時にチェックインした | `stays.reservation_id` の一意制約または状態更新で検出し、`INVALID_RESERVATION_STATUS` |
| 同じ部屋が同時に割り当てられた | 部屋選択後に再確認し、競合時は別部屋を選ぶ。見つからなければ `NO_ASSIGNABLE_ROOM` |
| 予約状態が変わっていた | `INVALID_RESERVATION_STATUS` |

実装時に Prisma の通常クエリだけで十分な排他が取りにくい場合は、Postgres の `SELECT ... FOR UPDATE` を `$queryRaw` で使うことを検討する。

## チェックアウト

### 処理手順

1. Route Handler が予約番号、連絡先、チェックアウト日時、支払い情報の形式を検証する。
2. `CheckOutService.checkOut` がトランザクションを開始する。
3. 予約番号で予約と宿泊を取得する。
4. 予約に紐づく連絡先を照合する。
5. 予約状態が `CHECKED_IN` であることを確認する。
6. 宿泊料金を計算する。
7. 支払金額が請求金額と一致することを確認する。
8. `stays.checked_out_at` を更新する。
9. `lodging_charges` を作成する。
10. `payments` を作成する。
11. `reservations.status` を `CHECKED_OUT` に更新する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| すでにチェックアウト済み | `ALREADY_CHECKED_OUT` |
| 宿泊が存在しない | `STAY_NOT_FOUND` |
| 支払金額が計算結果と異なる | `PAYMENT_AMOUNT_MISMATCH` |
| 料金作成が重複した | `lodging_charges.stay_id` の一意制約で検出し、`ALREADY_CHECKED_OUT` |

## 予約キャンセル

### 処理手順

1. Route Handler が予約番号、連絡先の形式を検証する。
2. `ReservationCancelService.cancelReservation` がトランザクションを開始する。
3. 予約番号で予約を取得する。
4. 予約に紐づく連絡先を照合する。
5. 予約状態が `RESERVED` であることを確認する。
6. `reservations.status` を `CANCELLED` に更新する。

### 競合時の扱い

| 条件 | 扱い |
| --- | --- |
| 同じ予約を同時にキャンセルした | 状態更新で検出し、`INVALID_RESERVATION_STATUS` |
| キャンセル直前にチェックインされた | 状態更新で検出し、`INVALID_RESERVATION_STATUS` |
| 予約番号と連絡先が一致しない | `RESERVATION_NOT_FOUND` |

## Repository 方針

Repository は、通常の Prisma Client と Transaction Client のどちらでも動くようにする。

```ts
type PrismaExecutor = PrismaClient | Prisma.TransactionClient
```

アプリケーション層は次の形を基本とする。

```ts
await prisma.$transaction(async (tx) => {
  const reservationRepository = new ReservationRepository(tx)
  const roomRepository = new RoomRepository(tx)
  const stayRepository = new StayRepository(tx)

  // 業務処理
})
```

## 未確定事項

- Postgres の分離レベルは初期実装では既定値を使う。競合テストで不十分な場合に `Serializable` または明示ロックを検討する。
- 予約作成時の空室数を厳密に守るため、将来は在庫テーブルや日別在庫テーブルを追加する可能性がある。
- 外部決済を導入する場合は、決済確定とDB更新の整合性を別途設計する。
