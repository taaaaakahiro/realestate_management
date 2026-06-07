import type { Transaction } from "@/features/transaction/types";
import { formatYen } from "@/shared/lib/format";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const csvField = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** フィルタ後の取引を CSV としてダウンロード（Excel 対応で BOM 付与） */
export function downloadTransactionsCsv(rows: Transaction[], title: string): void {
  const header = ["計上日", "区分", "科目", "金額(円)", "元本(円)", "利息(円)", "メモ"];
  const lines = [header.map(csvField).join(",")];
  for (const t of rows) {
    const income = t.kind === "income";
    lines.push(
      [
        t.date,
        income ? "収入" : "支出",
        t.category,
        income ? t.amount : -t.amount,
        t.breakdown?.principal ?? "",
        t.breakdown?.interest ?? "",
        t.memo ?? "",
      ]
        .map(csvField)
        .join(","),
    );
  }
  const csv = "﻿" + lines.join("\r\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), `取引明細_${title}.csv`);
}

/** フィルタ後の取引を印刷用ウィンドウで開く（ブラウザの「PDFに保存」で出力） */
export function printTransactionsPdf(rows: Transaction[], title: string): void {
  const w = window.open("", "_blank", "width=960,height=720");
  if (!w) {
    alert("ポップアップがブロックされました。許可してから再度お試しください。");
    return;
  }
  const body = rows
    .map((t) => {
      const income = t.kind === "income";
      const amount = `${income ? "+" : "−"}${formatYen(t.amount)}`;
      const memo = t.breakdown
        ? `元本 ${formatYen(t.breakdown.principal)} / 利息 ${formatYen(t.breakdown.interest)}`
        : t.memo ?? "";
      return `<tr><td>${t.date}</td><td>${income ? "収入" : "支出"}</td><td>${esc(
        t.category,
      )}</td><td class="num ${income ? "income" : "expense"}">${amount}</td><td>${esc(
        memo,
      )}</td></tr>`;
    })
    .join("");

  w.document.write(`<!doctype html><html lang="ja"><head><meta charset="utf-8" />
<title>取引明細 ${esc(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #0f172a; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 12px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
  th { background: #f8fafc; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .income { color: #059669; }
  .expense { color: #e11d48; }
</style></head><body>
  <h1>取引明細 — ${esc(title)}</h1>
  <p class="sub">全 ${rows.length} 件</p>
  <table>
    <thead><tr><th>計上日</th><th>区分</th><th>科目</th><th class="num">金額</th><th>メモ / 内訳</th></tr></thead>
    <tbody>${body}</tbody>
  </table>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
