# AmorWorks Showcase

AmorWorksとして制作したホームページ、問い合わせ導線、予約導線、運用サポートのビルド事例を紹介する静的サイトです。

## 構成

- `index.html`: 公開ページ本体
- `styles.css`: デザイン
- `script.js`: モバイルメニュー、事例フィルター、年表示
- `assets/`: ロゴと事例ビジュアル
- `.nojekyll`: GitHub Pages用

## 公開前チェック

- 事例ごとの公開URLを載せるか確認する
- 問い合わせ先をLINE、メール、Googleフォームのどれにするか決める
- 料金表を公開するか、相談後提示にするか決める
- 独自ドメインを使う場合はドメイン更新料の説明を入れる

## GitHub Pages公開手順

1. このフォルダを `main` ブランチでGitHubへpushする
2. GitHubの `Settings > Pages` を開く
3. `Build and deployment` で `Deploy from a branch` を選ぶ
4. Branchを `main`、folderを `/root` にして保存する
5. 表示された公開URLを事例カードやSNSプロフィールに反映する
