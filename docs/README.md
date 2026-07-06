# Docs

- HRS の分析、設計、レビュー、発表資料を管理
- Web アプリケーションのコードは `src/`、DB 関連は `prisma/` に配置
- 用語は UML、ユースケース、コード、ルート README で統一

## 構成

```text
docs/
├── architecture-design/    # API、DB、画面、テスト、デプロイ設計
├── design/                 # ワイヤーフレーム
├── domain-analysis/        # クラス図、オブジェクト図
├── presentation/           # 発表資料、デモ手順
├── requirements-analysis/  # ユースケース、アクティビティ図、受入テスト
├── reviews/                # レビュー記録
├── system-analysis/        # コラボレーション図、保守分析
├── tech-stack/             # 技術選定
└── *.pdf                    # 公開許可と再配布権を確認済みの課題資料
```

## 成果物

| 分類               | 内容                                               | 索引                                                               |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| ドメイン分析       | クラス図、オブジェクト図                           | [domain-analysis/README.md](domain-analysis/README.md)             |
| 要求分析           | ユースケース図・記述、アクティビティ図、受入テスト | [requirements-analysis/README.md](requirements-analysis/README.md) |
| システム分析       | コラボレーション図、保守分析                       | [system-analysis/README.md](system-analysis/README.md)             |
| アーキテクチャ設計 | API、DB、画面、エラー、テスト、デプロイ            | [architecture-design/README.md](architecture-design/README.md)     |
| UI 設計            | ワイヤーフレーム                                   | [design/wireframes.md](design/wireframes.md)                       |
| 技術選定           | 採用技術と選定理由                                 | [tech-stack/README.md](tech-stack/README.md)                       |
| レビュー           | 指摘と修正判断                                     | [reviews/README.md](reviews/README.md)                             |
| 発表               | 発表資料とデモ手順                                 | [presentation/README.md](presentation/README.md)                   |

## 作業順序

| 順序 | 作業                                         | 主な配置                          |
| ---- | -------------------------------------------- | --------------------------------- |
| 1    | 問題領域の概念と関係を整理                   | `domain-analysis/`                |
| 2    | 利用者の目的とシステムの振る舞いを整理       | `requirements-analysis/`          |
| 3    | Boundary / Control / Entity の相互作用を整理 | `system-analysis/`                |
| 4    | 実装方式と責務を設計                         | `architecture-design/`, `design/` |
| 5    | 成果物間の整合性をレビュー                   | `reviews/`                        |
| 6    | 発表内容とデモ手順を作成                     | `presentation/`                   |

## ファイル規則

| 対象       | 規則                                                |
| ---------- | --------------------------------------------------- |
| ファイル名 | 内容を識別できる名前にする                          |
| 日付       | `YYYY-MM-DD` 形式を使う                             |
| 更新       | レビュー後も同じファイルを更新し、履歴は Git で管理 |
| UML        | `.asta` と書き出した `.png` / `.md` を対応させる    |
| 用語       | 関連する図、記述、コードで表記を統一                |
| 配布物     | 公開許可と再配布権を確認できたものだけを追加する    |

```text
domain-analysis/class-diagram.asta
domain-analysis/class-diagram.md
domain-analysis/クラス図.png
requirements-analysis/ユースケース記述_部屋を予約する.md
reviews/domain-analysis-review-2026-06-19.md
```

## 変更時の確認

- 関連する分析・設計資料との矛盾がない
- 図の元ファイルと書き出し結果が一致している
- Markdown の相対リンクが有効
- README の索引と実際のファイル構成が一致している
- Public リポジトリに公開できる内容だけを含む

## レビュー

- Pull Request またはレビュー Issue で実施
- `.github/ISSUE_TEMPLATE/review.md` と各ディレクトリのチェックリストを使用
- 指摘に含める内容:
  - 問題点
  - 問題となる理由
  - 修正案
