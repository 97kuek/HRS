# テスト戦略

HRS における自動テストの全体方針をまとめる。

## 1. テストピラミッド

```
        ┌───────────────┐
        │  受入テスト    │  手動確認 (#46)
        │ Acceptance    │  UC 記述に基づくシナリオ操作
        ├───────────────┤
        │  結合テスト    │  Vitest + vi.mock (Prisma)
        │ Integration   │  API Route Handler の正常系・異常系
        ├───────────────┤
        │  単体テスト    │  Vitest（純関数のみ）
        │  Unit         │  DB 接触なし、最も多く・速く
        └───────────────┘
```

| テスト種 | 対象 | 観点 | ツール | コマンド |
|---|---|---|---|---|
| **単体** | `src/lib/` 配下の純関数 | ホワイトボックス | Vitest | `npm test` |
| **結合** | API Route Handler（Prisma モック） | ブラックボックス | Vitest + vi.mock | `npm test` |
| **受入** | UC シナリオ全体（画面操作） | ブラックボックス | 手動（#46） | — |

---

## 2. 単体テスト（Unit Test）

### 観点: ホワイトボックス

実装コードを参照し、分岐・境界値・エラーパスを全て網羅する。

### 対象

コメント `// DB に触れない純関数なので単体テスト可能（#48）` が付いている関数、および `src/lib/validation.ts` の全バリデーター。

| ファイル | テスト対象関数 |
|---|---|
| `src/lib/validation.ts` | `validateName`, `validateEmail`, `validatePhone`, `validateReservationNumber`, `validateRoomNumber`, `validateStayDates`, `validateGuestCount` |
| `src/lib/reservations/reservationNumber.ts` | `generateReservationNumber` |
| `src/lib/reservations/cancellation.ts` | `evaluateCancellation` |
| `src/lib/reservations/checkIn.ts` | `evaluateCheckIn`, `pickAssignableRoom` |
| `src/lib/reservations/availability.ts` | `validateReservationCondition` |
| `src/lib/stays/checkOut.ts` | `classifyMissingStay`, `calculateNights`, `calculateCharge` |

### テストファイルの配置

```
src/lib/<module>/__tests__/<function>.test.ts
```

---

## 3. 結合テスト（Integration Test）

### 観点: ブラックボックス

API 仕様書（`api-design.md`）と UC 記述を入力仕様とし、実装の中身を知らない前提でテストケースを設計する。実装を変更してもテストは変えない。

### なぜ増加テスト（ボトムアップ）か

```
非増加テスト（ビッグバン）の問題:
  「POST /api/reservations が 500 を返した」
  → DB seed が足りないのか？ Prisma クエリが間違っているのか？
    入力検証で弾かれたのか？ 区別できない。

ボトムアップ増加テストの利点:
  単体テスト（純関数）が通っている
  → 結合テスト（API Route）が失敗したら、DB 接続 or モック設定が原因と即断できる
```

```
テスト層の積み上げ:
  [1] 純関数の単体テスト（済） ← validateReservationCondition などが正しく動く前提
  [2] API Route の結合テスト（済） ← Prisma をモックして HTTP 境界を検証
  [3] 受入テスト（#46 手動確認） ← 実 DB・実ブラウザで UC 全体を通し確認
```

### 実装方針

- **Prisma クライアントをモック** (`vi.mock("@/lib/db/prisma", ...)`) し DB 接続不要で実行
- **Email 送信をモック** し外部通信なしで実行
- `$transaction` はコールバック関数を受け取る形でモック (`vi.hoisted` を使用)
- 現在時刻に依存する関数（`todayInHotelTz`）は `vi.mock` でテスト用固定日時を返す

### テストファイルの配置

```
src/app/api/<route>/__tests__/<METHOD>.test.ts
```

### 現在のカバレッジ（#48 で追加）

| エンドポイント | テストファイル | 正常系 | 異常系 |
|---|---|---|---|
| `POST /api/reservations` | `reservations/__tests__/POST.test.ts` | ✓ | E1/E3/E4・定員超過・部屋なし |
| `POST /api/reservations/[number]/cancel` | `cancel/__tests__/POST.test.ts` | ✓ | E1・E2（全ステータス）・競合更新 |
| `POST /api/reservations/[number]/check-in` | `check-in/__tests__/POST.test.ts` | ✓ | E1・E2・E3・E4 |

---

## 4. 受入テスト（Acceptance Test）

### 観点: ブラックボックス

UC 記述（`docs/requirements-analysis/ユースケース記述_*.md`）を仕様書とし、画面操作で確認する。チェックリストは `acceptance-test-checklist.md` を参照。

### #46 との分担

| 作業 | 担当 |
|---|---|
| 自動テスト基盤の整備（単体・結合） | #48（このドキュメント） |
| シナリオ手動確認・デモ手順作成 | #46 |
| E2E 自動テスト（Playwright） | 余裕があれば #48 で追加 |

---

## 5. テスト実行コマンド

```powershell
npm test               # 全テスト（単体 + 結合）を一度実行
npm run test:watch     # ファイル保存ごとに自動再実行（開発中）
npm run test:coverage  # カバレッジレポートを出力
```

DB 接続は不要。`.env` なしで実行できる。

---

## 6. 新しいテストを書く際のガイドライン

### 単体テストを追加すべき場合

- `src/lib/` 配下に新しい純関数を追加したとき
- 既存関数のバグ修正をしたとき（バグを再現するテストを先に書く）

### 結合テストを追加すべき場合

- 新しい API エンドポイントを追加したとき
- 既存エンドポイントの仕様（ステータスコード・レスポンス形式）を変更したとき

### テストケースの設計基準（ブラックボックス）

1. UC 記述の基本系列を正常系テストに対応させる
2. 例外系列（E1, E2, ...）を異常系テストに対応させる
3. 境界値（0泊, 1泊, 31泊など）をテストケースに加える
4. 実装コードを見てテストケースを増やさない（それは単体テストの役割）
