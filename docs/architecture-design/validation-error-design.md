# バリデーション・エラー設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [API設計](api-design.md), [DB設計](db-design.md), [認証・認可設計](auth-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

HRS の API で行う入力検証、業務ルール検証、エラー応答の方針を定義する。実装では Route Handler、アプリケーション層、DB制約で役割を分け、同じ条件に対して同じステータスコードと `error.code` を返す。

## 基本方針

- Route Handler は JSON の構文、必須項目、型、日付形式などの構文チェックを行う。
- アプリケーション層は空室、定員、予約状態、支払金額などの業務ルールを検証する。
- DB制約は一意性、外部キー、最低限の不変条件を最後に守る。
- エラー応答は常に `error.code` と利用者向け `message` を返す。
- フィールド単位の入力エラーがある場合だけ `details` を返す。
- 予約番号や連絡先の照合失敗では、予約番号が存在するかどうかを画面メッセージで区別しない。

## 検証責務

| 層 | 主な検証 | 例 |
| --- | --- | --- |
| UI | 送信前に分かる軽い検証 | 必須入力、人数が1以上、日付未入力 |
| Route Handler | リクエスト形式の検証 | JSON不正、型不正、日付形式不正、必須項目不足 |
| アプリケーション層 | 業務ルールの検証 | 空室不足、定員超過、予約状態不一致、本人確認失敗 |
| DB | 永続化時の不変条件 | 一意制約、外部キー、日時・金額の制約 |

UI の検証は利便性のために行う。API は UI から呼ばれるとは限らないため、Route Handler とアプリケーション層でも必ず検証する。

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

`details[].field` はリクエストJSON上のパスに合わせる。例: `guest.name`, `payment.amount`。

## ステータスコード方針

| ステータス | 用途 |
| --- | --- |
| `400 Bad Request` | JSON構文不正、型不正、必須項目不足、形式不正 |
| `401 Unauthorized` | 予約番号と連絡先による本人確認に失敗 |
| `403 Forbidden` | 本人確認済みだが、対象予約への操作が許可されない |
| `404 Not Found` | 認証不要または認証済みの文脈で対象リソースが存在しない |
| `409 Conflict` | 予約状態、空室、二重操作など現在状態との競合 |
| `422 Unprocessable Entity` | 構文は正しいが業務ルールに違反 |
| `500 Internal Server Error` | 想定外のサーバーエラー |

## 共通入力規約

| 項目 | 規約 |
| --- | --- |
| 日付 | `YYYY-MM-DD`。宿泊予定日として扱い、時刻を含めない |
| 日時 | `ISO 8601`。省略可能な操作時刻は省略時にサーバー時刻を使う |
| 金額 | 整数の円単位。小数、負数は受け付けない |
| 人数・泊数 | 整数。`guestCount >= 1`, `nights >= 1` |
| 予約番号 | 空白不可。利用者に提示する `reservationNumber` を使う |
| 連絡先 | 前後空白を除去する。メールアドレスは小文字化する |
| 支払方法 | 初期実装では文字列。UIで選択肢を固定し、APIでは空文字を拒否する |

## エラーコード一覧

| `code` | ステータス | 用途 |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | 必須項目不足、型不正、形式不正 |
| `RESERVATION_AUTH_FAILED` | `401` | 予約番号または連絡先が一致しない |
| `ROOM_TYPE_NOT_FOUND` | `404` | 部屋タイプが存在しない |
| `RESERVATION_NOT_FOUND` | `404` | 認証済みの文脈で予約が存在しない |
| `STAY_NOT_FOUND` | `404` | 対応する宿泊が存在しない |
| `NO_AVAILABILITY` | `409` | 条件に合う空室がない |
| `NO_ASSIGNABLE_ROOM` | `409` | チェックイン時に割り当て可能な部屋がない |
| `INVALID_RESERVATION_STATUS` | `409` | 操作に必要な予約状態ではない |
| `ALREADY_CHECKED_OUT` | `409` | すでにチェックアウト済み |
| `INVALID_STAY_CONDITION` | `422` | 日付、泊数、人数など宿泊条件が業務ルールに合わない |
| `CAPACITY_EXCEEDED` | `422` | 宿泊人数が部屋タイプの定員を超える |
| `PAYMENT_AMOUNT_MISMATCH` | `422` | 支払金額が請求金額と一致しない |
| `INTERNAL_SERVER_ERROR` | `500` | 想定外のエラー |

## エンドポイント別検証

| API | Route Handler の検証 | アプリケーション層の検証 |
| --- | --- | --- |
| `GET /api/room-types` | なし | なし |
| `GET /api/availability` | `checkInDate`, `nights`, `guestCount`, `roomTypeId` の形式 | 宿泊条件、定員、空室 |
| `POST /api/reservations` | `guest.name`, `guest.contact`, `checkInDate`, `nights`, `guestCount`, `roomTypeId` | 部屋タイプ存在、定員、空室、予約番号一意性 |
| `POST /api/reservations/lookup` | `reservationNumber`, `contact` | 予約本人確認 |
| `POST /api/reservations/{reservationNumber}/check-in` | パスの `reservationNumber`, 本文の `contact`, `checkedInAt` | 本人確認、予約状態、チェックイン可能日、部屋割当 |
| `POST /api/reservations/{reservationNumber}/check-out` | パスの `reservationNumber`, 本文の `contact`, `checkedOutAt`, `payment` | 本人確認、予約状態、宿泊存在、料金計算、支払金額 |

## 実装時の注意

- サーバーログには内部エラー詳細を残してよいが、レスポンスにはスタックトレースやSQLエラーを返さない。
- DB一意制約違反などはアプリケーション層で捕捉し、APIの `code` に変換する。
- 予約本人確認失敗では `RESERVATION_AUTH_FAILED` に統一する。
- バリデーションライブラリを使う場合も、外部ライブラリ固有のエラー構造をそのままAPIに漏らさない。
