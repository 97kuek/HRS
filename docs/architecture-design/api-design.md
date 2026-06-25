# API設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [技術選定の記録](../tech-stack/README.md)
- 関連: [アーキテクチャ設計](README.md), [DB設計](db-design.md), [認証・認可設計](auth-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

- 本ドキュメントでは、HRS の画面から利用する REST 風 API を定義する
- 実装では `Next.js App Router` の `Route Handler` (`app/api/**/route.ts`) に配置し、`HTTP` と `JSON` の境界処理に責務を限定する

## 共通方針

- データ形式は `JSON` とする
- 日付は `YYYY-MM-DD`、日時は `ISO 8601` 文字列で返す
- 金額は整数の円単位で扱う
- パス中の予約識別子には、内部IDではなく利用者に提示する `reservationNumber` を使う
- 入力値の構文チェックは Route Handler、業務ルールの検証はユースケースサービスで行う
- 正常レスポンスは必要な表示データだけを返し、DB内部のIDは画面に不要な限り返さない

## エラー形式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容を確認してください。",
    "details": [
      {
        "field": "guestCount",
        "message": "宿泊人数は1以上で入力してください。"
      }
    ]
  }
}
```

| ステータス | 用途 |
| --- | --- |
| `400 Bad Request` | JSON形式不正、型不正、必須項目不足 |
| `401 Unauthorized` | 予約番号と連絡先による本人確認に失敗 |
| `403 Forbidden` | 本人確認済みだが対象予約への操作権限がない |
| `404 Not Found` | 予約番号、宿泊、部屋タイプが存在しない |
| `409 Conflict` | 予約済みでない予約のチェックイン、空室不足、二重チェックアウトなど状態競合 |
| `422 Unprocessable Entity` | 日付逆転、定員超過など業務ルール違反 |
| `500 Internal Server Error` | 想定外のサーバーエラー |

## エンドポイント一覧

| メソッド | パス | 対応ユースケース | 概要 |
| --- | --- | --- | --- |
| `GET` | `/api/room-types` | 部屋を予約する | 予約時に選択できる部屋タイプを取得する |
| `GET` | `/api/availability` | 部屋を予約する | 宿泊条件に合う部屋タイプ別の空室と料金候補を取得する |
| `POST` | `/api/reservations` | 部屋を予約する | 予約を作成し、予約番号を発行する |
| `POST` | `/api/reservations/lookup` | 予約を確認する | 予約番号と連絡先から予約内容と状態を取得する |
| `POST` | `/api/reservations/{reservationNumber}/check-in` | チェックインする | 予約をチェックイン済みにし、部屋を割り当てる |
| `POST` | `/api/reservations/{reservationNumber}/check-out` | チェックアウトする | 宿泊を終了し、料金と支払いを記録する |

## `GET /api/room-types`

- 予約フォームの部屋タイプ選択肢を取得する。

### レスポンス

```json
{
  "roomTypes": [
    {
      "id": "rt_single",
      "name": "シングル",
      "capacity": 1,
      "baseRate": 8000
    },
    {
      "id": "rt_twin",
      "name": "ツイン",
      "capacity": 2,
      "baseRate": 12000
    }
  ]
}
```

## `GET /api/availability`

- 宿泊日、泊数、人数、部屋タイプから予約可能な候補を取得する。
- 予約作成前の候補表示に使う。

### クエリ

| 名前 | 必須 | 型 | 説明 |
| --- | --- | --- | --- |
| `checkInDate` | yes | `YYYY-MM-DD` | チェックイン予定日 |
| `nights` | yes | number | 泊数 |
| `guestCount` | yes | number | 宿泊人数 |
| `roomTypeId` | no | string | 希望部屋タイプ。未指定なら条件に合う部屋タイプを返す |

### レスポンス

```json
{
  "checkInDate": "2026-07-03",
  "checkOutDate": "2026-07-05",
  "guestCount": 2,
  "candidates": [
    {
      "roomTypeId": "rt_twin",
      "roomTypeName": "ツイン",
      "availableCount": 3,
      "nights": 2,
      "estimatedAmount": 24000
    }
  ]
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 日付形式が不正 | `400` | `VALIDATION_ERROR` |
| 泊数または人数が0以下 | `422` | `INVALID_STAY_CONDITION` |
| 条件に合う空室がない | `409` | `NO_AVAILABILITY` |

## `POST /api/reservations`

- 利用者情報と予約条件から予約を作成し、予約番号を発行する。
- 予約は部屋タイプに対して作成し、具体的な部屋はチェックイン時に割り当てる。

### リクエスト

```json
{
  "guest": {
    "name": "山田太郎",
    "contact": "taro@example.com"
  },
  "checkInDate": "2026-07-03",
  "nights": 2,
  "guestCount": 2,
  "roomTypeId": "rt_twin"
}
```

### レスポンス

```json
{
  "reservation": {
    "reservationNumber": "HRS-20260703-0001",
    "status": "RESERVED",
    "guestName": "山田太郎",
    "contact": "taro@example.com",
    "roomTypeName": "ツイン",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "guestCount": 2,
    "estimatedAmount": 24000
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 氏名または連絡先が空 | `400` | `VALIDATION_ERROR` |
| 宿泊人数が部屋タイプの定員を超える | `422` | `CAPACITY_EXCEEDED` |
| 作成直前に空室がなくなった | `409` | `NO_AVAILABILITY` |

## `POST /api/reservations/lookup`

- 予約番号と連絡先から予約内容と現在状態を取得する。
- 予約確認、チェックイン前確認、チェックアウト前確認で利用する。
- 連絡先を URL クエリに載せないため `POST` とする。

### リクエスト

```json
{
  "reservationNumber": "HRS-20260703-0001",
  "contact": "taro@example.com"
}
```

### レスポンス

```json
{
  "reservation": {
    "reservationNumber": "HRS-20260703-0001",
    "status": "RESERVED",
    "guestName": "山田太郎",
    "contact": "taro@example.com",
    "roomTypeName": "ツイン",
    "roomNumber": null,
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "guestCount": 2
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号または連絡先が一致しない | `401` | `RESERVATION_AUTH_FAILED` |

## `POST /api/reservations/{reservationNumber}/check-in`

- 予約済みの予約に対して部屋を割り当て、宿泊を作成し、予約状態を `CHECKED_IN` にする。

### リクエスト

```json
{
  "contact": "taro@example.com",
  "checkedInAt": "2026-07-03T15:00:00+09:00"
}
```

- `checkedInAt` は省略可能とし、省略時はサーバー時刻を使う。

### レスポンス

```json
{
  "reservation": {
    "reservationNumber": "HRS-20260703-0001",
    "status": "CHECKED_IN"
  },
  "stay": {
    "roomNumber": "502",
    "checkedInAt": "2026-07-03T15:00:00+09:00"
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号または連絡先が一致しない | `401` | `RESERVATION_AUTH_FAILED` |
| 予約状態が `RESERVED` ではない | `409` | `INVALID_RESERVATION_STATUS` |
| 割り当て可能な部屋がない | `409` | `NO_ASSIGNABLE_ROOM` |

## `POST /api/reservations/{reservationNumber}/check-out`

- 宿泊を終了し、宿泊料金と支払い情報を記録する。
- 予約状態は `CHECKED_OUT` にする。
- 利用者に内部IDである `stayId` を直接指定させず、予約番号と連絡先で本人確認する。

### リクエスト

```json
{
  "contact": "taro@example.com",
  "checkedOutAt": "2026-07-05T10:00:00+09:00",
  "payment": {
    "amount": 24000,
    "method": "card"
  }
}
```

- `checkedOutAt` は省略可能とし、省略時はサーバー時刻を使う。

### レスポンス

```json
{
  "reservation": {
    "reservationNumber": "HRS-20260703-0001",
    "status": "CHECKED_OUT"
  },
  "stay": {
    "roomNumber": "502",
    "checkedOutAt": "2026-07-05T10:00:00+09:00"
  },
  "charge": {
    "amount": 24000
  },
  "payment": {
    "amount": 24000,
    "method": "card"
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号または連絡先が一致しない | `401` | `RESERVATION_AUTH_FAILED` |
| 対応する宿泊が存在しない | `404` | `STAY_NOT_FOUND` |
| すでにチェックアウト済み | `409` | `ALREADY_CHECKED_OUT` |
| 支払金額が請求金額と一致しない | `422` | `PAYMENT_AMOUNT_MISMATCH` |

## ユースケースとの対応

| ユースケース | API | 備考 |
| --- | --- | --- |
| 部屋を予約する | `GET /api/room-types`, `GET /api/availability`, `POST /api/reservations` | 空室検索、候補表示、予約確定に分ける |
| 予約を確認する | `POST /api/reservations/lookup` | 予約番号と連絡先で本人確認する |
| チェックインする | `POST /api/reservations/lookup`, `POST /api/reservations/{reservationNumber}/check-in` | 状態確認後に部屋を割り当てる |
| チェックアウトする | `POST /api/reservations/lookup`, `POST /api/reservations/{reservationNumber}/check-out` | 予約番号と連絡先で本人確認し、宿泊IDは画面へ不要な限り返さない |

## 未確定事項

- 「予約を取消する」を正式ユースケースにする場合は `POST /api/reservations/{reservationNumber}/cancel` を追加する。
- 支払いを独立ユースケースにする場合は、チェックアウトAPIから支払い記録を分離する。
- 認証・認可の初期方針は [認証・認可設計](auth-design.md) に従い、予約番号だけでなく予約時の連絡先による本人確認を行う。
