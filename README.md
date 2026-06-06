# 不動産回収率マネージャー（モック）

購入時の**原価**に加えて、**日々の支出**と**家賃収入**を管理し、投資の**回収率**を見える化する不動産管理システムのモックです。

> 「改修率」ではなく、取得原価をどれだけ家賃で取り戻せたかを示す **回収率（= 累計収入 ÷ 取得原価）** として実装しています。

## 主要機能

- **ダッシュボード** — ポートフォリオ全体の回収率・取得原価・損益サマリー、物件別の回収状況
- **物件一覧 / 詳細** — 物件ごとの回収率、表面利回り、月次キャッシュフロー
- **回収率の推移チャート** — 累計収入と投資総額の交点で損益分岐（回収完了）を可視化
- **取引明細** — 家賃・更新料などの収入、ローン・管理費・修繕費・税などの支出

## 起動方法

```bash
npm install
npm run dev
# http://localhost:3000
```

## 設計方針：疎結合・feature ベース

```
src/
├─ app/                         # Next.js ルーティング層（薄く保つ）
│  ├─ page.tsx                  #   ダッシュボード
│  └─ properties/[id]/page.tsx  #   物件詳細
│
├─ features/                    # 機能単位のモジュール（相互依存を最小化）
│  ├─ property/                 #   物件ドメイン
│  │  ├─ types.ts               #     ドメイン型
│  │  ├─ repository.ts          #     データアクセス抽象（IF + モック実装）
│  │  └─ components/
│  ├─ transaction/              #   取引（収入・支出）ドメイン
│  │  ├─ types.ts
│  │  ├─ repository.ts
│  │  └─ components/
│  └─ analytics/                #   回収率などの計算ロジック
│     ├─ service.ts             #     純粋関数（データソース非依存）
│     └─ components/
│
├─ shared/                      # 横断的な共通基盤
│  ├─ components/ui/            #   UI プリミティブ（Card / Badge / ProgressBar）
│  └─ lib/                      #   フォーマッタ・ユーティリティ
│
└─ data/mock/                   # モックデータ（実DB導入時はここだけ差し替え）
```

### 疎結合のポイント

- **Repository パターン** — UI / サービス層は `PropertyRepository` などの**インターフェース**にのみ依存。
  モック → REST → DB の差し替えが `data/` と `repository.ts` の交換だけで完結します。
- **計算ロジックの分離** — `analytics/service.ts` はドメイン型のみを受け取る**純粋関数**。
  UI やデータ取得から独立しており、単体テストが容易です。
- **feature 境界** — 各機能は `types / repository / components` を自己完結で持ち、
  他 feature へはドメイン型経由でのみ依存します。

## 技術スタック

- Next.js 16（App Router / Server Components）
- React 19 / TypeScript
- Tailwind CSS v4
- チャートは依存ライブラリなしの自作 SVG コンポーネント

## モックデータ

`data/mock/` で物件3件と、取得月から現在（2026-06）までの月次取引を決定論的に生成しています。
空室・修繕費・更新料などのイベントも擬似的に含まれます。

## GitHub Pages へのデプロイ

静的サイトとして書き出し、GitHub Pages で公開できます。

- `next.config.ts` の `output: "export"` で静的HTMLを `out/` に生成
- サーバーを持てないため、**登録データはブラウザの localStorage に保存**（`data/store.ts`）。
  モックデータをシードとし、物件・収支の登録は端末ごとにブラウザ内へ永続化されます
- 郵便番号→住所の検索は zipcloud をブラウザから直接呼び出します
- `.github/workflows/deploy.yml` が `main` への push で自動ビルド＆デプロイ

### 公開手順

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定
2. このブランチを `main` にマージ（または Actions タブから `Deploy to GitHub Pages` を手動実行）
3. `https://<ユーザー名>.github.io/realestate_management/` で公開

ローカルで本番ビルドを確認する場合:

```bash
NODE_ENV=production npm run build   # out/ に生成
npx serve out                       # 簡易配信（basePath に注意）
```

