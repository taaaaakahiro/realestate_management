# PropFolio

🌐 **公開URL: https://taaaaakahiro.github.io/realestate_management/**

購入時の**原価**に加えて、**日々の支出**・**家賃収入**・**融資（ローン）**を管理し、不動産投資の**回収率**を見える化するアプリです。

> 回収率 = 累計収入 ÷ 取得原価。取得原価をどれだけ家賃で取り戻せたかを表します。

## 主要機能

- **ダッシュボード** — ポートフォリオ全体の回収率・取得原価・損益サマリー、物件別の回収状況
- **物件一覧 / 詳細** — 物件ごとの回収率、表面利回り、月次キャッシュフロー
- **回収率の推移チャート** — 累計収入と投資総額の交点で損益分岐（回収完了）を可視化
- **融資・返済** — 借入元本・残債・累計利息を表示。毎月の返済を**元本／利息に自動分解**（元利均等／元金均等）。**変動金利**にも対応し、途中の金利変更を登録すると以降を再計算
- **取引明細** — 家賃などの収入、広告料・修繕費・火災保険・固定資産税・ローン元本／利息などの支出

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
│  ├─ property/                 #   物件ドメイン（types / components）
│  ├─ transaction/              #   取引（収入・支出）ドメイン
│  ├─ loan/                     #   融資ドメイン
│  │  ├─ types.ts
│  │  ├─ amortization.ts        #     返済スケジュール計算（純粋関数）
│  │  ├─ service.ts             #     取引との結合ヘルパー
│  │  └─ components/
│  └─ analytics/                #   回収率などの計算ロジック
│     ├─ service.ts             #     純粋関数（データソース非依存）
│     └─ components/
│
├─ shared/                      # 横断的な共通基盤（UIプリミティブ・フォーマッタ等）
│
└─ data/
   ├─ store.ts                  # クライアントストア（localStorage 永続化）
   └─ mock/                     # シードデータ（物件・取引・融資）
```

### 疎結合のポイント

- **データ層の集約** — UI は `data/store.ts` の `useStore()` と各アクションにのみ依存。
  保存先（localStorage / 将来のAPI・DB）の差し替えはこの層に閉じます。
- **計算ロジックの分離** — `analytics/service.ts` や `loan/amortization.ts` はドメイン型のみを
  受け取る**純粋関数**。UI やデータ取得から独立しており、単体テストが容易です。
- **feature 境界** — 各機能は自己完結で持ち、他 feature へはドメイン型経由でのみ依存します。

## 技術スタック

- Next.js 16（App Router・静的書き出し `output: "export"`）
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
3. https://taaaaakahiro.github.io/realestate_management/ で公開

ローカルで本番ビルドを確認する場合:

```bash
NODE_ENV=production npm run build   # out/ に生成
npx serve out                       # 簡易配信（basePath に注意）
```

