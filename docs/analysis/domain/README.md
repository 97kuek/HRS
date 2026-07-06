# ドメイン分析

- HRSの問題領域に存在する概念、属性、関係を整理
- 実装技術ではなく、ホテル予約業務の用語を基準に記述
- クラス図を具体的なオブジェクト図で検証

## 成果物

| 成果物                              | 説明                                     | Astah                                      | 画像                                     |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| [クラス図](class-diagram.md)        | 主要概念、属性、関連、多重度             | [class-diagram.asta](class-diagram.asta)   | [class-diagram.png](class-diagram.png)   |
| [オブジェクト図](object-diagram.md) | 具体的な宿泊シナリオによるクラス図の検証 | [object-diagram.asta](object-diagram.asta) | [object-diagram.png](object-diagram.png) |

## ファイル管理

- 編集元は `.asta`
- レビュー用の画像は同名の `.png`
- 判断理由と検証結果は同名の `.md`
- Astahで変更した場合はPNGとMarkdownも同時に更新

```text
class-diagram.asta
class-diagram.md
class-diagram.png

object-diagram.asta
object-diagram.md
object-diagram.png
```

## レビュー観点

- 主要な概念と関係が網羅されている
- クラス名と属性名が直感的で一貫している
- 関連と多重度を両端から自然に読める
- オブジェクト図の具体値がクラス図の型・多重度・制約を満たす
- 実装固有のIDやフレームワーク詳細を持ち込んでいない
