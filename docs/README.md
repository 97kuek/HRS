# Docs

- HRS の分析・設計成果物を管理
- Web アプリケーションは `src/`、DB 関連は `prisma/` に配置
- レビューは Pull Request または Issue、発表資料は必要になった時点で管理

## 構成

```text
docs/
├── analysis/
│   ├── domain/          # クラス図、オブジェクト図
│   ├── requirements/    # ユースケース、アクティビティ図、受入テスト
│   └── system/          # コラボレーション図、保守分析
├── design/              # 技術選定、画面、API、DB、テスト、デプロイ設計
├── README.md
└── *.pdf                # 公開許可と再配布権を確認済みの課題資料
```

## 成果物

| 分類         | 内容                                               | 索引                                                               |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| ドメイン分析 | クラス図、オブジェクト図                           | [analysis/domain/README.md](analysis/domain/README.md)             |
| 要求分析     | ユースケース図・記述、アクティビティ図、受入テスト | [analysis/requirements/README.md](analysis/requirements/README.md) |
| システム分析 | コラボレーション図、保守分析                       | [analysis/system/README.md](analysis/system/README.md)             |
| 設計         | 技術選定、UI、API、DB、エラー、テスト、デプロイ    | [design/README.md](design/README.md)                               |

## 作業順序

| 順序 | 作業                                                    | 配置                     |
| ---- | ------------------------------------------------------- | ------------------------ |
| 1    | 問題領域の概念と関係を整理                              | `analysis/domain/`       |
| 2    | 利用者の目的とシステムの振る舞いを整理                  | `analysis/requirements/` |
| 3    | Boundary / Control / Entity の相互作用を整理            | `analysis/system/`       |
| 4    | 実装方式と責務を設計                                    | `design/`                |
| 5    | 成果物間の整合性を Pull Request または Issue でレビュー | GitHub                   |

## ファイル管理

| 対象       | 規則                                                      |
| ---------- | --------------------------------------------------------- |
| ファイル名 | 内容を識別できる名前にする                                |
| 日付       | 必要な場合だけ `YYYY-MM-DD` 形式を使う                    |
| 更新履歴   | 同じ成果物を更新し、履歴は Git で管理する                 |
| UML        | `.asta` を編集元、`.png` を閲覧用の出力として対で管理する |
| Markdown   | 図の説明、判断理由、レビュー結果を記録する                |
| 用語       | UML、ユースケース、設計、コードで統一する                 |
| 配布物     | 公開許可と再配布権を確認できたものだけを追加する          |

```text
analysis/domain/class-diagram.asta
analysis/domain/class-diagram.md
analysis/domain/クラス図.png
analysis/requirements/ユースケース記述_部屋を予約する.md
design/api-design.md
```

## 変更時の確認

- 関連する分析・設計資料と矛盾していない
- `.asta` と書き出した `.png` が一致している
- Markdown の相対リンクが有効
- 本索引と実際のファイル構成が一致している
- Public リポジトリに公開できる内容だけを含む
- 指摘には問題点、理由、修正案を含める
