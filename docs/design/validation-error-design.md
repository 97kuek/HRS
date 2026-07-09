# バリデーション・エラー設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [API設計](api-design.md), [DB設計](db-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

HRS の API で行う入力検証、業務ルール検証、エラー応答の方針を定義する。実装では Route Handler、アプリケーション層、DB制約で役割を分け、同じ条件に対して同じステータスコードと `error.code` を返す。

## 基本方針

- Route Handler は JSON の構文、必須項目、型、日付形式などの構文チェックを行う。
- アプリケーション層は空室、定員、予約状態、支払金額などの業務ルールを検証する。
- DB制約は一意性、外部キー、最低限の不変条件を最後に守る。
- エラー応答は常に `error.code` と利用者向け `message` を返す。
- フィールド単位の入力エラーがある場合だけ `details` を返す。
- 予約番号や氏名の照合失敗では、予約番号が存在するかどうかを画面メッセージで区別しない。

## 検証責務

| 層 | 主な検証 | 例 |
| --- | --- | --- |
| UI | 送信前に分かる軽い検証 | 必須入力、人数が1以上、日付未入力 |
| Route Handler | リクエスト形式の検証 | JSON不正、型不正、日付形式不正、必須項目不足 |
| アプリケーション層 | 業務ルールの検証 | 空室不足、定員超過、予約状態不一致、予約番号と氏名の照合失敗 |
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
| `404 Not Found` | 対象リソースが存在しない、または予約番号と氏名の組み合わせが一致しない |
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
| メールアドレス | 前後空白を除去する |
| 電話番号 | 任意。入力された場合は市外局番から始まる10〜11桁（ハイフン・スペース除く）を受け付ける |
| 支払方法 | `"現金"` または `"クレジットカード"` のみ受け付ける。それ以外は `VALIDATION_ERROR` |

## エラーコード一覧

| `code` | ステータス | 用途 |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | 必須項目不足、型不正、形式不正 |
| `ROOM_TYPE_NOT_FOUND` | `404` | 部屋タイプが存在しない |
| `RESERVATION_NOT_FOUND` | `404` | 予約が存在しない、または予約番号と氏名が一致しない |
| `STAY_NOT_FOUND` | `404` | 対応する宿泊が存在しない |
| `NO_AVAILABILITY` | `404` | 空室検索で条件に合う空室がない（`/api/availability`）、または予約直前の再確認で空室がなくなった場合は `409` |
| `NO_ASSIGNABLE_ROOM` | `409` | チェックイン時に割り当て可能な部屋がない |
| `INVALID_RESERVATION_STATUS` | `409` | 操作に必要な予約状態ではない |
| `NOT_CHECKIN_DATE` | `409` | チェックイン予定日が今日ではない |
| `ALREADY_CHECKED_OUT` | `409` | すでにチェックアウト済み |
| `INVALID_STAY_CONDITION` | `400` | 日付逆転、人数が0以下など宿泊条件が業務ルールに合わない |
| `CAPACITY_EXCEEDED` | `400` | 宿泊人数が部屋タイプの定員を超える |
| `PAYMENT_AMOUNT_MISMATCH` | `409` | 支払金額が請求金額と一致しない |
| `INTERNAL_SERVER_ERROR` | `500` | 想定外のエラー |

## エンドポイント別検証

| API | Route Handler の検証 | アプリケーション層の検証 |
| --- | --- | --- |
| `GET /api/room-types` | なし | なし |
| `GET /api/availability` | `checkIn`, `checkOut`, `guestCount`, `roomTypeId` の形式 | 宿泊条件（日付順序・人数）、空室 |
| `GET /api/availability/calendar` | `year`, `month`, `guestCount` の形式 | 月別の日別空室数 |
| `POST /api/reservations` | `guest.name`, `guest.email`, `guest.phone`, `checkInDate`, `checkOutDate`, `guestCount`, `roomTypeId` | 部屋タイプ存在、定員、空室、予約番号一意性 |
| `GET /api/reservations/{reservationNumber}` | クエリの `familyName`, `givenName` | 予約番号と氏名の照合 |
| `GET /api/reservations/{reservationNumber}/cancel/quote` | クエリの `familyName`, `givenName` | 予約番号と氏名の照合、キャンセル可否 |
| `POST /api/reservations/{reservationNumber}/check-in` | パスの `reservationNumber`, 本文の `familyName`, `givenName` | 予約番号と氏名の照合、予約状態、チェックイン可能日、部屋割当 |
| `POST /api/reservations/{reservationNumber}/cancel` | パスの `reservationNumber`, 本文の `familyName`, `givenName` | 予約番号と氏名の照合、予約状態 |
| `GET /api/rooms/{roomNumber}/check-out/quote` | パスの `roomNumber` | 宿泊存在、チェックアウト済み確認 |
| `POST /api/rooms/{roomNumber}/check-out` | パスの `roomNumber`, 本文の `amount`, `method` | 宿泊存在、料金計算、支払金額一致 |

## 実装時の注意

- サーバーログには内部エラー詳細を残してよいが、レスポンスにはスタックトレースやSQLエラーを返さない。
- DB一意制約違反などはアプリケーション層で捕捉し、APIの `code` に変換する。
- 予約番号と氏名の照合失敗では `RESERVATION_NOT_FOUND` に統一し、予約番号が存在するかどうかを区別しない。
- バリデーションライブラリを使う場合も、外部ライブラリ固有のエラー構造をそのままAPIに漏らさない。
