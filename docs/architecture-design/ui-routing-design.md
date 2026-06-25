# 画面構成・ルーティング設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [API設計](api-design.md)
- 状態: **ドラフト**（[#14 システム分析レビュー](https://github.com/97kuek/HRS/issues/14) 後に見直す）

HRS の利用者向け画面、画面遷移、API呼び出しの対応を定義する。Next.js App Router を前提に、ページは利用者の操作単位で分ける。

## 基本方針

- 初期実装では利用者向けセルフサービス画面だけを作る。
- 管理者、受付係、会員マイページは現行スコープ外とする。
- 画面は API の結果表示とフォーム送信を担当し、業務ルールは API 側へ委譲する。
- 予約確認、チェックイン、チェックアウトでは予約番号と連絡先を入力させる。
- 予約番号は利用者に提示する識別子として URL に含めてもよいが、連絡先は URL に含めない。
- 初期実装ではログイン状態に依存するページは作らない。

## CSR / SSR / SSG の使い分け

Next.js App Router では、画面ごとにデータの性質で描画方式を分ける。ここでいう SSG は静的生成を指す。授業メモなどで SGR と書かれている場合は、ここでは SSG として扱う。

| 方式 | 使う場面 | HRSでの対象 | 理由 |
| --- | --- | --- | --- |
| SSG | 利用者ごとに変わらない静的な画面 | `/` のメニュー、説明だけの画面 | ビルド時に生成でき、DBアクセスが不要なため |
| SSR | 初回表示時点でサーバー側データが必要な画面 | 将来、予約詳細をサーバー側で直接表示する場合 | 個人情報や予約状態を扱うため、必要になった場合もサーバーで取得するほうが安全なため |
| CSR | フォーム入力後にAPIを呼び、結果を画面に反映する画面 | 予約作成、予約確認、チェックイン、チェックアウト、キャンセル | 入力内容に応じて候補や結果が変わり、送信中・エラー・成功表示を同じ画面で扱うため |
| ISR | 初期実装では使わない | なし | 客室在庫や予約状態は即時性が必要で、再生成間隔つきキャッシュと相性が悪いため |

初期実装の基本は「静的に出せる入口は SSG、操作画面は CSR」でよい。予約内容や宿泊状態を含むデータは、画面ビルド時に埋め込まず、ユーザー操作後に API から取得する。

### 画面別の描画方針

| ルート | 描画方針 | 理由 |
| --- | --- | --- |
| `/` | SSG | 固定メニューであり、DBに依存しないため |
| `/reservations/new` | CSR | 宿泊条件入力、空室確認、予約作成の状態変化を同じ画面で扱うため |
| `/reservations/lookup` | CSR | 予約番号と連絡先の入力後に予約情報を取得するため |
| `/reservations/[reservationNumber]` | CSR または SSR | 初期実装では直接表示せず照会画面へ誘導する。将来、サーバー側で予約詳細を表示する場合は SSR を検討する |
| `/check-in` | CSR | 入力、予約確認、チェックイン実行、エラー表示を段階的に扱うため |
| `/check-out` | CSR | 宿泊確認、支払い入力、チェックアウト実行を段階的に扱うため |
| `/reservations/cancel` | CSR | 予約確認後にキャンセル実行を行うため |

## 画面一覧

| ルート | 画面 | 主な役割 |
| --- | --- | --- |
| `/` | ホーム | 予約、予約確認、チェックイン、チェックアウトへの導線 |
| `/reservations/new` | 予約作成 | 宿泊条件、利用者情報、部屋タイプを入力し予約を作成する |
| `/reservations/[reservationNumber]` | 予約結果・予約詳細 | 予約作成後または予約情報照合後に予約内容を表示する |
| `/reservations/lookup` | 予約確認 | 予約番号と連絡先を入力し予約内容を確認する |
| `/check-in` | チェックイン | 予約番号と連絡先を入力し、予約内容確認後にチェックインする |
| `/check-out` | チェックアウト | 予約番号と連絡先を入力し、支払い情報を入力してチェックアウトする |
| `/reservations/cancel` | 予約キャンセル | 予約番号と連絡先を入力し、予約内容確認後にキャンセルする |

`/reservations/[reservationNumber]` は直接アクセス時に連絡先を持たないため、予約詳細を表示する前に `/reservations/lookup` へ誘導する。

## 画面と API の対応

| 画面 | 呼び出す API | 備考 |
| --- | --- | --- |
| `/reservations/new` | `GET /api/room-types`, `GET /api/availability`, `POST /api/reservations` | 予約作成後に予約番号を表示する |
| `/reservations/lookup` | `POST /api/reservations/lookup` | 連絡先は本文で送る |
| `/check-in` | `POST /api/reservations/lookup`, `POST /api/reservations/{reservationNumber}/check-in` | 予約内容確認後に実行ボタンを表示する |
| `/check-out` | `POST /api/reservations/lookup`, `POST /api/reservations/{reservationNumber}/check-out` | 支払金額と方法を入力する |
| `/reservations/cancel` | `POST /api/reservations/lookup`, `POST /api/reservations/{reservationNumber}/cancel` | 予約内容確認後にキャンセルする |

## 予約作成フロー

```mermaid
flowchart TD
    start["/reservations/new"]
    roomTypes["部屋タイプを取得"]
    input["宿泊条件・利用者情報を入力"]
    availability["空室と概算料金を確認"]
    submit["予約を確定"]
    result["予約番号と予約内容を表示"]

    start --> roomTypes --> input --> availability --> submit --> result
```

予約作成後は、予約番号と連絡先が今後の予約照会に必要であることを画面上で明確に表示する。

## 予約確認フロー

```mermaid
flowchart TD
    start["/reservations/lookup"]
    input["予約番号・連絡先を入力"]
    lookup["予約を照会"]
    detail["予約内容を表示"]
    error["エラーを表示"]

    start --> input --> lookup
    lookup --> detail
    lookup --> error
```

予約番号と連絡先の照合失敗時は、予約番号が存在しないのか連絡先が違うのかを区別せずに表示する。

## チェックインフロー

```mermaid
flowchart TD
    start["/check-in"]
    input["予約番号・連絡先を入力"]
    lookup["予約内容を確認"]
    confirm["チェックインを指示"]
    complete["部屋番号と完了を表示"]
    error["理由を表示"]

    start --> input --> lookup
    lookup --> confirm
    lookup --> error
    confirm --> complete
    confirm --> error
```

チェックイン実行前に、予約日、宿泊人数、部屋タイプを確認できるようにする。

## チェックアウトフロー

```mermaid
flowchart TD
    start["/check-out"]
    input["予約番号・連絡先を入力"]
    lookup["宿泊内容を確認"]
    payment["支払い情報を入力"]
    submit["チェックアウトを指示"]
    complete["料金・支払い・完了を表示"]
    error["理由を表示"]

    start --> input --> lookup --> payment --> submit
    submit --> complete
    lookup --> error
    submit --> error
```

初期実装では外部決済を行わず、支払い方法と支払金額の記録だけを行う。

## 予約キャンセルフロー

```mermaid
flowchart TD
    start["/reservations/cancel"]
    input["予約番号・連絡先を入力"]
    lookup["予約内容を確認"]
    confirm["キャンセルを指示"]
    complete["キャンセル完了を表示"]
    error["理由を表示"]

    start --> input --> lookup
    lookup --> confirm
    lookup --> error
    confirm --> complete
    confirm --> error
```

キャンセル実行前に、宿泊日、宿泊人数、部屋タイプを確認できるようにする。チェックイン済みまたはチェックアウト済みの予約はキャンセル不可として扱う。

## コンポーネント責務

| コンポーネント | 責務 |
| --- | --- |
| `ReservationForm` | 宿泊条件、利用者情報、部屋タイプを入力する |
| `AvailabilityResult` | 空室候補と概算料金を表示する |
| `ReservationResult` | 予約番号と予約内容を表示する |
| `ReservationAccessForm` | 予約番号と連絡先を入力する |
| `ReservationDetail` | 予約内容、状態、部屋番号を表示する |
| `CheckInForm` | 照会済み予約に対してチェックインを指示する |
| `CheckOutForm` | 支払い情報を入力しチェックアウトを指示する |
| `ReservationCancelForm` | 照会済み予約に対してキャンセルを指示する |
| `ApiErrorMessage` | APIエラーを利用者向け文言で表示する |

## 表示状態

| 状態 | 表示方針 |
| --- | --- |
| 初期 | 必要な入力フォームを表示する |
| 送信中 | 二重送信を防ぐため送信ボタンを無効化する |
| 成功 | 次に必要な操作や予約番号を表示する |
| 入力エラー | 該当フィールドの近くに表示する |
| 業務エラー | 画面上部または操作ボタン付近に理由を表示する |
| 想定外エラー | 再試行を促す一般的なメッセージを表示する |

## 未確定事項

- `/` を簡易メニューにするか、予約作成画面へリダイレクトするかは実装時に決める。
- 予約作成後の詳細画面で連絡先をどの程度表示するかは、プライバシー観点で実装時に調整する。
- 管理者や受付係を追加する場合は、利用者向けルートと管理者向けルートを分ける。
