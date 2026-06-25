# DB設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [技術選定の記録](../tech-stack/README.md)
- 関連: [アーキテクチャ設計](README.md), [API設計](api-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

HRS のドメイン概念を Postgres のテーブルとして整理する。実装では Prisma を使い、`schema.prisma` を DB スキーマの正とする。

## ER構造

```mermaid
erDiagram
    guests ||--o{ reservations : makes
    room_types ||--o{ rooms : classifies
    room_types ||--o{ reservations : requested_by
    reservations ||--o| stays : becomes
    rooms ||--o{ stays : assigned_to
    stays ||--|| lodging_charges : has
    lodging_charges ||--o{ payments : paid_by
```

予約は「部屋タイプ」に対して作成する。具体的な「部屋」はチェックイン時に `stays` に割り当てる。

## テーブル一覧

| テーブル | 対応概念 | 説明 |
| --- | --- | --- |
| `guests` | 利用者 | 予約者の氏名と連絡先 |
| `room_types` | 部屋タイプ | 種別名、定員、基本宿泊料 |
| `rooms` | 部屋 | 個別の客室番号と部屋タイプ |
| `reservations` | 予約 | 予約番号、宿泊予定、人数、状態 |
| `stays` | 宿泊 | チェックイン/チェックアウト実績と割当部屋 |
| `lodging_charges` | 宿泊料金 | 宿泊に対する請求金額 |
| `payments` | 支払い | 宿泊料金に対する支払い |

## 共通カラム方針

- 主キーは Prisma の扱いやすさを優先し、文字列ID (`String @id @default(cuid())`) とする。
- 画面に表示する予約識別子は `reservations.reservation_number` とし、内部IDとは分ける。
- 作成日時 `created_at` と更新日時 `updated_at` は主要テーブルに持たせる。
- 金額は整数の円単位で保存する。
- 日付だけで扱う宿泊予定は `DateTime` にせず、実装時は Postgres の `date` 型に対応させる。

## `guests`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `name` | string | not null | 氏名 |
| `contact` | string | not null | メールアドレスまたは電話番号 |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

利用者アカウントは扱わず、予約ごとに入力された予約者情報を保存する。

## `room_types`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `name` | string | unique, not null | 種別名 |
| `capacity` | integer | not null | 定員 |
| `base_rate` | integer | not null | 1泊あたりの基本宿泊料 |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

`capacity > 0`、`base_rate >= 0` を制約とする。

## `rooms`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `room_number` | string | unique, not null | 部屋番号 |
| `room_type_id` | string | FK, not null | 部屋タイプID |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

チェックイン時には、予約の部屋タイプに属し、対象期間に他の宿泊へ割り当てられていない部屋を選ぶ。

## `reservations`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `reservation_number` | string | unique, not null | 利用者に提示する予約番号 |
| `guest_id` | string | FK, not null | 利用者ID |
| `room_type_id` | string | FK, not null | 希望部屋タイプID |
| `check_in_date` | date | not null | チェックイン予定日 |
| `check_out_date` | date | not null | チェックアウト予定日 |
| `guest_count` | integer | not null | 宿泊人数 |
| `status` | enum | not null | 予約状態 |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

予約番号は `HRS-YYYYMMDD-連番` のように、人が読める形式で発行する。連番採番の衝突は DB の一意制約と再試行で防ぐ。

## `stays`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `reservation_id` | string | unique, FK, not null | 対応する予約ID |
| `room_id` | string | FK, not null | 割り当てた部屋ID |
| `checked_in_at` | datetime | not null | チェックイン日時 |
| `checked_out_at` | datetime | nullable | チェックアウト日時 |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

1つの予約から作成できる宿泊は最大1件とするため、`reservation_id` に一意制約を置く。

## `lodging_charges`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `stay_id` | string | unique, FK, not null | 宿泊ID |
| `amount` | integer | not null | 請求金額 |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

現時点では、料金は `room_types.base_rate * 泊数` で計算する。割引、追加料金、税を扱う場合は別テーブルを追加する。

## `payments`

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| `id` | string | PK | 内部ID |
| `lodging_charge_id` | string | FK, not null | 宿泊料金ID |
| `amount` | integer | not null | 支払金額 |
| `paid_at` | datetime | not null | 支払日時 |
| `method` | string | not null | 支払方法 |
| `created_at` | datetime | not null | 作成日時 |
| `updated_at` | datetime | not null | 更新日時 |

分割払いを許すため、1つの宿泊料金に対して複数の支払いを持てる。今回のチェックアウトAPIでは、請求金額と同額の支払い1件を登録する。

## 列挙型

| 値 | 説明 |
| --- | --- |
| `RESERVED` | 予約済 |
| `CHECKED_IN` | チェックイン済 |
| `CHECKED_OUT` | チェックアウト済 |
| `CANCELLED` | 取消済 |

`CANCELLED` はドメイン分析に存在する状態として保持する。ただし、予約取消ユースケースを正式採用するまでは API を用意しない。

## 制約とインデックス

| 対象 | 制約 |
| --- | --- |
| `reservations.reservation_number` | 一意 |
| `rooms.room_number` | 一意 |
| `room_types.name` | 一意 |
| `stays.reservation_id` | 一意 |
| `lodging_charges.stay_id` | 一意 |
| `reservations.check_in_date`, `reservations.check_out_date` | `check_in_date < check_out_date` |
| `reservations.guest_count` | `guest_count > 0` |
| `room_types.capacity` | `capacity > 0` |
| `room_types.base_rate`, `lodging_charges.amount`, `payments.amount` | `0` 以上 |

空室検索では `reservations(room_type_id, check_in_date, check_out_date, status)` と `stays(room_id, checked_in_at, checked_out_at)` にインデックスを置く。

## トランザクションが必要な処理

| 処理 | 理由 |
| --- | --- |
| 予約作成 | 空室確認と予約登録の間で競合が起きる可能性がある |
| チェックイン | 部屋割当、宿泊作成、予約状態更新を一体で確定する必要がある |
| チェックアウト | 宿泊終了、料金作成、支払い作成、予約状態更新を一体で確定する必要がある |

## Prismaモデル案

```prisma
enum ReservationStatus {
  RESERVED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
}

model Guest {
  id           String        @id @default(cuid())
  name         String
  contact      String
  reservations Reservation[]
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  @@map("guests")
}

model RoomType {
  id           String        @id @default(cuid())
  name         String        @unique
  capacity     Int
  baseRate     Int           @map("base_rate")
  rooms        Room[]
  reservations Reservation[]
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  @@map("room_types")
}

model Room {
  id         String   @id @default(cuid())
  roomNumber String   @unique @map("room_number")
  roomTypeId String   @map("room_type_id")
  roomType   RoomType @relation(fields: [roomTypeId], references: [id])
  stays      Stay[]
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("rooms")
}

model Reservation {
  id                String            @id @default(cuid())
  reservationNumber String            @unique @map("reservation_number")
  guestId           String            @map("guest_id")
  guest             Guest             @relation(fields: [guestId], references: [id])
  roomTypeId        String            @map("room_type_id")
  roomType          RoomType          @relation(fields: [roomTypeId], references: [id])
  checkInDate       DateTime          @map("check_in_date") @db.Date
  checkOutDate      DateTime          @map("check_out_date") @db.Date
  guestCount        Int               @map("guest_count")
  status            ReservationStatus @default(RESERVED)
  stay              Stay?
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  @@index([roomTypeId, checkInDate, checkOutDate, status])
  @@map("reservations")
}

model Stay {
  id            String           @id @default(cuid())
  reservationId String           @unique @map("reservation_id")
  reservation   Reservation      @relation(fields: [reservationId], references: [id])
  roomId        String           @map("room_id")
  room          Room             @relation(fields: [roomId], references: [id])
  checkedInAt   DateTime         @map("checked_in_at")
  checkedOutAt  DateTime?        @map("checked_out_at")
  charge        LodgingCharge?
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  @@index([roomId, checkedInAt, checkedOutAt])
  @@map("stays")
}

model LodgingCharge {
  id        String    @id @default(cuid())
  stayId    String    @unique @map("stay_id")
  stay      Stay      @relation(fields: [stayId], references: [id])
  amount    Int
  payments  Payment[]
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  @@map("lodging_charges")
}

model Payment {
  id              String         @id @default(cuid())
  lodgingChargeId String         @map("lodging_charge_id")
  lodgingCharge   LodgingCharge  @relation(fields: [lodgingChargeId], references: [id])
  amount          Int
  paidAt          DateTime       @map("paid_at")
  method          String
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  @@map("payments")
}
```

## 未確定事項

- Postgres の CHECK 制約は Prisma の標準スキーマだけでは表現しにくいため、実装時にマイグレーションSQLで追加するか、アプリケーション層の検証に寄せるかを決める。
- 支払い方法を列挙型にするか、文字列のままにするかは実装時に決める。
- 利用者アカウントや認証を追加する場合は、`guests` とログインユーザーを分けるか統合するか再設計する。
