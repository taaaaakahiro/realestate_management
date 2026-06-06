/**
 * 表示用フォーマッタ群。
 * ドメイン層・UI層のどちらからも参照される横断的ユーティリティ。
 */

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

/** 円表記 (例: ¥12,300,000) */
export function formatYen(value: number): string {
  return yen.format(value);
}

/** 万円表記 (例: 1,230万円) — 大きな金額の概観用 */
export function formatMan(value: number): string {
  return `${Math.round(value / 10000).toLocaleString("ja-JP")}万円`;
}

/** パーセント表記 (例: 42.5%) */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** YYYY/MM 表記 */
export function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** YYYY/MM/DD 表記 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
