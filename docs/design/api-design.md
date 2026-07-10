# API設計

- 本ドキュメントでは、HRS の画面から利用する REST 風 API を定義する
- 実装では `Next.js App Router` の `Route Handler` (`app/api/**/route.ts`) に配置し、`HTTP` と `JSON` の境界処理に責務を限定する

## 共通方針

- データ形式は `JSON` とする
- 日付は `YYYY-MM-DD`、日時は `ISO 8601` 文字列で返す
- 金額は整数の円単位で扱う
- パス中の予約識別子には、内部IDではなく利用者に提示する `reservationNumber` を使う
- 入力値の構文チェックは Route Handler、業務ルールの検証はユースケースサービスで行う
- 正常レスポンスは必要な表示データだけを返し、DB内部のIDは画面に不要な限り返さない
- 連絡先は予約登録時の連絡先として扱う。予約番号と氏名で本人照合できた予約詳細では、登録済みのメールアドレスと電話番号を確認用に返してよい
- 初期実装ではログイン、セッション、ロールによる認証・認可は扱わない
- 予約番号と氏名（姓・名）の照合は、認証基盤ではなく予約照会・状態変更時の業務ルールとして扱う

## エラー形式

- エラー形式とエラーコードの詳細は [バリデーション・エラー設計](validation-error-design.md) に従う。

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
| `404 Not Found` | 予約番号と氏名の組み合わせ、宿泊、部屋タイプが存在しない |
| `409 Conflict` | 予約済みでない予約のチェックイン、空室不足、二重チェックアウトなど状態競合 |
| `422 Unprocessable Entity` | 日付逆転、定員超過など業務ルール違反 |
| `500 Internal Server Error` | 想定外のサーバーエラー |

## エンドポイント一覧

| メソッド | パス | 対応ユースケース | 概要 |
| --- | --- | --- | --- |
| `GET` | `/api/room-types` | 部屋を予約する | 予約時に選択できる部屋タイプを取得する |
| `GET` | `/api/availability` | 部屋を予約する | 宿泊条件に合う部屋タイプ別の空室と料金候補を取得する |
| `GET` | `/api/availability/calendar` | 部屋を予約する | 対象人数で宿泊可能な日別空室数を月単位で取得する |
| `POST` | `/api/chat` | 部屋を予約する / 予約をキャンセルする | 読み取り専用チャットで空室・部屋タイプ・キャンセルポリシーを案内する |
| `POST` | `/api/reservations` | 部屋を予約する | 予約を作成し、予約番号を発行する |
| `GET` | `/api/reservations/{reservationNumber}` | 予約を確認する / チェックインする / 予約をキャンセルする | 予約番号と氏名（姓・名）から予約内容と状態を取得する |
| `GET` | `/api/reservations/{reservationNumber}/cancel/quote` | 予約をキャンセルする | キャンセル確認画面用の予約内容とキャンセル可否を返す |
| `POST` | `/api/reservations/{reservationNumber}/check-in` | チェックインする | 予約をチェックイン済みにし、部屋を割り当てる |
| `POST` | `/api/reservations/{reservationNumber}/cancel` | 予約をキャンセルする | 予約をキャンセル済みにする |
| `GET` | `/api/rooms/{roomNumber}/check-out/quote` | チェックアウトする | 部屋番号から宿泊中の予約を特定し料金を返す（表示用・未確定） |
| `POST` | `/api/rooms/{roomNumber}/check-out` | チェックアウトする | 宿泊を終了し、料金と支払いを記録する |
| `GET` | `/api/cron/check-in-reminder` | — | 翌日チェックイン予定ゲストにリマインダーメールを送る（Cron専用） |

## エンドポイント設計の理由

| 判断 | 理由 |
| --- | --- |
| REST風APIにする | 小規模なCRUDと状態変更が中心であり、GraphQLより設計と実装が単純になるため |
| Route Handlerに置く | Next.js App Routerだけで画面とAPIを同じリポジトリに置けるため |
| 内部IDではなく予約番号をパスに使う | 利用者が実際に控える識別子が予約番号であり、DB内部IDを画面へ漏らす必要がないため |
| 予約照会を `GET /api/reservations/{reservationNumber}` にする | 照会は冪等な取得操作であり GETが自然。氏名はクエリパラメータで渡す（ログ残留リスクは許容範囲と判断） |
| 本人確認を「連絡先」ではなく「姓・名」で行う | 予約確認・チェックイン・キャンセルでは氏名（familyName + givenName）を照合キーとして使う。連絡先フィールドは予約登録時に email / phone の2フィールドに分けており、照合には使わない |
| チェックイン/キャンセルを `POST` にする | 予約状態を変更する操作であり、冪等な取得ではないため |
| チェックアウトを部屋番号ベースにする | フロントスタッフは部屋番号から操作を開始する。予約番号は guest 側の識別子であり、チェックアウト操作の起点として部屋番号の方が実務に合う |
| チェックアウトで `stayId` を指定させない | 利用者・スタッフは宿泊IDを知らない。部屋番号から現在の宿泊をアプリケーション層で特定するほうが画面とドメインに合うため |
| キャンセル確認用に quote エンドポイントを分ける | 予約内容表示（読み取り）とキャンセル確定（状態変更）を分離することで、確認画面と確定操作を独立させるため |

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

- チェックイン日、チェックアウト日、人数、部屋タイプから予約可能な候補を取得する。
- 予約作成前の候補表示に使う。

### クエリ

| 名前 | 必須 | 型 | 説明 |
| --- | --- | --- | --- |
| `checkIn` | yes | `YYYY-MM-DD` | チェックイン予定日 |
| `checkOut` | yes | `YYYY-MM-DD` | チェックアウト予定日 |
| `guestCount` | yes | number | 宿泊人数 |
| `roomTypeId` | no | string | 希望部屋タイプ。未指定なら条件に合う部屋タイプを全て返す |

### レスポンス

```json
{
  "condition": {
    "checkIn": "2026-07-03",
    "checkOut": "2026-07-05",
    "nights": 2,
    "guestCount": 2
  },
  "roomTypes": [
    {
      "id": "rt_twin",
      "name": "ツイン",
      "capacity": 2,
      "baseRate": 12000,
      "availableCount": 3,
      "totalCharge": 24000
    }
  ]
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 日付形式が不正、必須パラメータ不足 | `400` | `VALIDATION_ERROR` |
| チェックアウトがチェックイン以前、人数が0以下など | `400` | `VALIDATION_ERROR` |
| 条件に合う空室がない | `404` | `NO_AVAILABILITY` |

## `GET /api/availability/calendar`

- 予約作成画面の空室カレンダーに表示する日別空室数を取得する。
- 人数条件を満たす部屋タイプを対象に、1泊予約を入れられる総空室数を日別に返す。

### クエリ

| 名前 | 必須 | 型 | 説明 |
| --- | --- | --- | --- |
| `year` | yes | number | 表示対象年 |
| `month` | yes | number | 表示対象月（1〜12） |
| `guestCount` | yes | number | 宿泊人数 |

### レスポンス

```json
{
  "year": 2026,
  "month": 7,
  "guestCount": 2,
  "days": [
    {
      "date": "2026-07-03",
      "availableCount": 3,
      "status": "available"
    },
    {
      "date": "2026-07-04",
      "availableCount": 1,
      "status": "limited"
    }
  ]
}
```

- `status` は `past`、`available`、`limited`、`sold_out` のいずれかを返す。

## `POST /api/chat`

- 読み取り専用の予約支援チャットに利用する。
- 空室検索、日別空室数、部屋タイプ、キャンセルポリシーの一般案内だけを扱う。
- 予約作成、予約確認、キャンセル確定、チェックイン、チェックアウトは実行しない。
- 予約番号、氏名、メールアドレス、電話番号などの個人情報を含むメッセージは扱わず、専用画面へ誘導する。

### リクエスト

```json
{
  "message": "2名で2030-08-10に泊まれる部屋はありますか？"
}
```

### レスポンス

```json
{
  "chat": {
    "reply": "2030-08-10から1泊、2名で空室があります。",
    "provider": "gemini",
    "toolName": "search_availability",
    "cards": [
      {
        "title": "コンフォートダブル",
        "tone": "success",
        "rows": [
          {
            "label": "残室",
            "value": "4室"
          },
          {
            "label": "合計",
            "value": "¥16,000"
          }
        ]
      }
    ],
    "links": [
      {
        "href": "/reservations/new",
        "label": "予約画面へ"
      }
    ]
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| メッセージが空、または長すぎる | `400` | `VALIDATION_ERROR` |
| 短時間に送信しすぎた | `429` | `RATE_LIMIT_EXCEEDED` |

## `POST /api/reservations`

- 利用者情報と予約条件から予約を作成し、予約番号を発行する。
- 予約は部屋タイプに対して作成し、具体的な部屋はチェックイン時に割り当てる。
- 予約確定後、登録メールアドレスに確認メールを送信する。

### リクエスト

```json
{
  "guest": {
    "name": "山田 太郎",
    "email": "taro@example.com",
    "phone": "090-1234-5678"
  },
  "checkInDate": "2026-07-03",
  "checkOutDate": "2026-07-05",
  "guestCount": 2,
  "roomTypeId": "rt_twin"
}
```

- `guest.phone` は省略可能。
- `checkInDate` と `checkOutDate` を直接指定する（泊数は指定しない）。

### レスポンス

```json
{
  "reservation": {
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "nights": 2,
    "guestCount": 2,
    "guestName": "山田 太郎",
    "email": "taro@example.com",
    "phone": "090-1234-5678",
    "totalCharge": 24000
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 氏名・メールアドレスが空、形式不正 | `400` | `VALIDATION_ERROR` |
| 宿泊人数が部屋タイプの定員を超える | `400` | `CAPACITY_EXCEEDED` |
| 部屋タイプが存在しない | `404` | `ROOM_TYPE_NOT_FOUND` |
| 作成直前に空室がなくなった | `409` | `NO_AVAILABILITY` |

## `GET /api/reservations/{reservationNumber}`

- 予約番号と氏名（姓・名）から予約内容と現在状態を取得する。
- 予約確認、チェックイン前確認、キャンセル前確認で利用する。

### クエリ

| 名前 | 必須 | 型 | 説明 |
| --- | --- | --- | --- |
| `familyName` | yes | string | 予約者の姓 |
| `givenName` | yes | string | 予約者の名 |

### レスポンス

```json
{
  "reservation": {
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "nights": 2,
    "guestCount": 2,
    "guestName": "山田 太郎",
    "email": "taro@example.com",
    "phone": "090-1234-5678",
    "status": "RESERVED",
    "totalCharge": 24000,
    "roomNumber": null
  }
}
```

- `roomNumber` はチェックイン前は `null`、チェックイン済みは割当部屋番号を返す。
- 予約番号と氏名で本人照合できた後の予約詳細として、登録済みの `guestName`, `email`, `phone` を確認用に返す。`phone` は予約時に未入力の場合 `null` を返す。

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号が存在しない、または氏名が一致しない | `404` | `RESERVATION_NOT_FOUND` |

---

## `GET /api/reservations/{reservationNumber}/cancel/quote`

- キャンセル確認画面用の予約内容とキャンセル可否を返す。
- 予約が存在すれば内容を返す。キャンセル不可状態でも内容は返し、理由を `reason` で通知する。

### クエリ

| 名前 | 必須 | 型 | 説明 |
| --- | --- | --- | --- |
| `familyName` | yes | string | 予約者の姓 |
| `givenName` | yes | string | 予約者の名 |

### レスポンス

```json
{
  "quote": {
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "guestCount": 2,
    "totalCharge": 24000,
    "cancellationFee": 0,
    "cancellationPolicy": "前日まで無料",
    "cancellationPolicyDescription": "チェックイン日前日までのキャンセル料は無料です。",
    "status": "RESERVED",
    "cancelable": true,
    "reason": null
  }
}
```

- `cancelable` が `false` の場合、`reason` にキャンセル不可理由を返す。

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号が存在しない、または氏名が一致しない | `404` | `RESERVATION_NOT_FOUND` |

## `POST /api/reservations/{reservationNumber}/check-in`

- 予約済みの予約に対して部屋を割り当て、宿泊を作成し、予約状態を `CHECKED_IN` にする。
- チェックインはチェックイン予定日当日のみ可能（JST基準）。

### リクエスト

```json
{
  "familyName": "山田",
  "givenName": "太郎"
}
```

- チェックイン日時はサーバー時刻を使う（クライアントから指定しない）。

### レスポンス

```json
{
  "checkIn": {
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "roomNumber": "502",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "guestCount": 2,
    "checkedInAt": "2026-07-03T06:00:00.000Z"
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号が存在しない、または氏名が一致しない | `404` | `RESERVATION_NOT_FOUND` |
| チェックイン予定日が今日でない | `409` | `NOT_CHECKIN_DATE` |
| 予約状態が `RESERVED` ではない | `409` | `INVALID_RESERVATION_STATUS` |
| 割り当て可能な部屋がない | `409` | `NO_ASSIGNABLE_ROOM` |

## `GET /api/rooms/{roomNumber}/check-out/quote`

- 部屋番号から現在チェックイン中の宿泊を特定し、料金を計算して返す。
- 確認画面表示用であり、この時点ではDBに何も保存しない。

### レスポンス

```json
{
  "quote": {
    "roomNumber": "502",
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "nights": 2,
    "amount": 24000
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| チェックイン中の宿泊が存在しない | `404` | `STAY_NOT_FOUND` |
| チェックアウト済みの部屋 | `409` | `ALREADY_CHECKED_OUT` |

---

## `POST /api/rooms/{roomNumber}/check-out`

- 部屋番号から宿泊を特定し、宿泊料金と支払い情報を記録してチェックアウトを確定する。
- 予約状態は `CHECKED_OUT` にする。
- チェックアウト後、登録メールアドレスに領収書メールを送信する。

### リクエスト

```json
{
  "amount": 24000,
  "method": "現金"
}
```

- `method` は `"現金"` または `"クレジットカード"` のいずれかのみ受け付ける。
- `amount` は見積もり（quote）と一致しなければ `PAYMENT_AMOUNT_MISMATCH` を返す。
- チェックアウト日時はサーバー時刻を使う（クライアントから指定しない）。

### レスポンス

```json
{
  "checkOut": {
    "roomNumber": "502",
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "amount": 24000,
    "method": "現金",
    "paidAt": "2026-07-05T01:00:00.000Z",
    "checkedOutAt": "2026-07-05T01:00:00.000Z"
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 支払い方法が空 | `400` | `VALIDATION_ERROR` |
| 支払い方法が許可値以外 | `400` | `VALIDATION_ERROR` |
| チェックイン中の宿泊が存在しない | `404` | `STAY_NOT_FOUND` |
| すでにチェックアウト済み | `409` | `ALREADY_CHECKED_OUT` |
| 支払金額が請求金額と一致しない | `409` | `PAYMENT_AMOUNT_MISMATCH` |

## `POST /api/reservations/{reservationNumber}/cancel`

- 予約済みの予約をキャンセル済みにする。
- チェックイン済み、チェックアウト済み、すでにキャンセル済みの予約はキャンセルできない。
- キャンセル料は「チェックイン日前日まで無料、チェックイン当日50%、チェックイン予定日後100%」で算出する。
- キャンセル確定後、登録メールアドレスにキャンセル確認メールを送信する。

### リクエスト

```json
{
  "familyName": "山田",
  "givenName": "太郎"
}
```

### レスポンス

```json
{
  "cancellation": {
    "reservationNumber": "HRS-20260703-0001",
    "roomTypeName": "ツイン",
    "checkInDate": "2026-07-03",
    "checkOutDate": "2026-07-05",
    "guestCount": 2,
    "totalCharge": 24000,
    "cancellationFee": 0,
    "cancellationPolicy": "前日まで無料",
    "status": "CANCELLED"
  }
}
```

### 主なエラー

| 条件 | ステータス | `code` |
| --- | --- | --- |
| 予約番号が存在しない、または氏名が一致しない | `404` | `RESERVATION_NOT_FOUND` |
| 予約状態が `RESERVED` ではない | `409` | `INVALID_RESERVATION_STATUS` |

## ユースケースとの対応

| ユースケース | API | 備考 |
| --- | --- | --- |
| 部屋を予約する | `GET /api/room-types`, `GET /api/availability/calendar`, `GET /api/availability`, `POST /api/reservations` | 月別空室表示、候補表示、予約確定に分ける |
| 予約を確認する | `GET /api/reservations/{reservationNumber}` | 予約番号と氏名（姓・名）を照合する |
| チェックインする | `GET /api/reservations/{reservationNumber}`, `POST /api/reservations/{reservationNumber}/check-in` | 予約内容確認後にチェックイン実行。当日のみ可能 |
| チェックアウトする | `GET /api/rooms/{roomNumber}/check-out/quote`, `POST /api/rooms/{roomNumber}/check-out` | 部屋番号から宿泊を特定。見積もり確認後に支払い・確定 |
| 予約をキャンセルする | `GET /api/reservations/{reservationNumber}/cancel/quote`, `POST /api/reservations/{reservationNumber}/cancel` | キャンセル可否確認後に確定。予約済み状態だけキャンセルできる |

## `GET /api/cron/check-in-reminder`

- Vercel Cron Job から毎日 0:00 UTC（9:00 JST）に呼ばれ、翌日チェックイン予定のゲストにリマインダーメールを送る。
- `Authorization: Bearer {CRON_SECRET}` ヘッダーで認証する。

### レスポンス

```json
{ "sent": 3, "date": "2026-07-04" }
```

- `sent`: 送信対象件数（送信失敗は含めない）。
- このエンドポイントは画面からは呼ばない。

## 未確定事項

- 支払いを独立ユースケースにする場合は、チェックアウトAPIから支払い記録を分離する。
- 利用者アカウントや管理者機能を追加する場合は、認証・認可の専用設計を追加し、ステータスコードに `401` / `403` を導入する。
