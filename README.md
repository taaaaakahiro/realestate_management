# PropFolio

🌐 **公開URL: https://taaaaakahiro.github.io/realestate_management/**

📖 **使い方マニュアル: [docs/MANUAL.md](docs/MANUAL.md)**

購入時の**原価**に加えて、**日々の支出**・**家賃収入**・**融資（ローン）**を管理し、不動産投資の**回収率**を見える化するアプリです。

> 回収率 = 累計収入 ÷ 取得原価。取得原価をどれだけ家賃で取り戻せたかを表します。

## 主要機能

- **ダッシュボード** — ポートフォリオ全体の回収率・取得原価・損益サマリー、物件別の回収状況、売却済みの**実現損益**
- **物件管理** — 登録 / 編集 / 削除。状態（取得前・保有中・売却済み）の管理と一覧の状態フィルター。ポートフォリオ集計は「保有中」のみ
- **取得前の逆算登録** — 想定家賃と目標利回りから投資総額を算出し、経費（取得税・精算金・仲介・印紙）を引いて物件価格を逆算
- **取得原価の自動計算** — 評価額比で土地・建物を按分、不動産取得税・固定資産税精算金・印紙代（印紙税法）を自動算出
- **融資・返済** — 借入銀行（検索選択）・**手出し金額（自己資金）**・借入元本・残債・累計利息を表示。毎月の返済を**元本／利息に自動分解**（元利均等／元金均等）。**変動金利**の途中変更にも対応
- **収支 登録/編集/削除** — 年・月・収入/支出・**科目**でフィルター、ページネーション、**CSV／PDF エクスポート**。ローン返済は適用金利で内訳自動分解。収支・損益は色分け表示
- **売却** — 売却価格・売却経費・売却日を登録すると損益が確定し、ダッシュボードに反映
- **地図リンク** — 物件詳細の住所クリックで Google マップ検索を別タブ表示

## 起動方法

```bash
npm install
npm run dev
# http://localhost:5173/
```

## 設計方針：疎結合・feature ベース

```
src/
├─ main.tsx                     # エントリ
├─ App.tsx                      # 画面のルーティング（薄く保つ）
├─ router.tsx                   # 依存ゼロの自前ハッシュルーター
├─ pages/                       # 各画面（ダッシュボード/一覧/登録 等）
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

- **React 19 / Vite / TypeScript**（ランタイム依存は react / react-dom のみの薄い構成）
- ルーティングは外部ライブラリ不使用の**自前ハッシュルーター**（`src/router.tsx`）
- Tailwind CSS v4（`@tailwindcss/vite`）
- チャートは依存ライブラリなしの自作 SVG コンポーネント

> セキュリティと保守性のため依存関係を最小化しています（Next.js から移行）。

## モックデータ

`data/mock/` で物件4件（保有中3・取得前1）と、取得月から現在（2026-06）までの月次取引を決定論的に生成しています。
空室・修繕費・更新料などのイベントも擬似的に含まれます。

## GitHub Pages へのデプロイ

Vite で静的ビルドし、GitHub Pages で公開できます。

- `npm run build` で `dist/` に静的ファイルを生成（`vite.config.ts` の `base` でサブパス対応）
- サーバーを持てないため、**登録データはブラウザの localStorage に保存**（`data/store.ts`）。
  モックデータをシードとし、物件・収支の登録は端末ごとにブラウザ内へ永続化されます
- 郵便番号→住所の検索は zipcloud をブラウザから直接呼び出します
- `.github/workflows/deploy.yml` が `main` への push で `dist` を自動ビルド＆デプロイ

### 公開手順

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定
2. このブランチを `main` にマージ（または Actions タブから `Deploy to GitHub Pages` を手動実行）
3. https://taaaaakahiro.github.io/realestate_management/ で公開

ローカルで本番ビルドを確認する場合:

```bash
npm run build     # dist/ に生成
npm run preview   # ローカルでプレビュー
```

