"use client";

import { useMemo, useState } from "react";
import type { Transaction } from "@/features/transaction/types";
import { Badge } from "@/shared/components/ui/Badge";
import { Select } from "@/shared/components/ui/Field";
import { formatDate, formatYen } from "@/shared/lib/format";

const PAGE_SIZE = 12;

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [page, setPage] = useState(1);

  // 取引が持つ年の一覧（降順）
  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 4)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (year === "all" ? true : t.date.slice(0, 4) === year))
      .filter((t) => (month === "all" ? true : t.date.slice(5, 7) === month))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, year, month]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function changeFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Select
          value={year}
          onChange={(e) => changeFilter(setYear, e.target.value)}
          className="max-w-[140px]"
        >
          <option value="all">すべての年</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </Select>
        <Select
          value={month}
          onChange={(e) => changeFilter(setMonth, e.target.value)}
          className="max-w-[120px]"
        >
          <option value="all">すべての月</option>
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
            <option key={m} value={m}>
              {Number(m)}月
            </option>
          ))}
        </Select>
        <span className="ml-auto text-xs text-slate-500">全 {filtered.length} 件</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">該当する取引はありません。</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">計上日</th>
                <th className="px-4 py-2.5 font-medium">区分</th>
                <th className="px-4 py-2.5 font-medium">科目</th>
                <th className="px-4 py-2.5 font-medium">メモ / 内訳</th>
                <th className="px-4 py-2.5 text-right font-medium">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => {
                const income = t.kind === "income";
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 tabular-nums text-slate-600">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={income ? "income" : "expense"}>
                        {income ? "収入" : "支出"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{t.category}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {t.breakdown ? (
                        <span className="text-xs">
                          元本 {formatYen(t.breakdown.principal)}
                          <span className="text-slate-300"> ・ </span>
                          利息 {formatYen(t.breakdown.interest)}
                        </span>
                      ) : (
                        <span className="text-slate-400">{t.memo ?? "—"}</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                        income ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {income ? "+" : "−"}
                      {formatYen(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition enabled:hover:bg-slate-50 disabled:opacity-40"
          >
            前へ
          </button>
          <span className="tabular-nums text-slate-500">
            {current} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 transition enabled:hover:bg-slate-50 disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
