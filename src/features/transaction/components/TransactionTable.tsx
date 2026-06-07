"use client";

import { useMemo, useState } from "react";
import { Link } from "@/router";
import type { Transaction, TransactionKind } from "@/features/transaction/types";
import { Badge } from "@/shared/components/ui/Badge";
import { Button, Select } from "@/shared/components/ui/Field";
import { formatDate, formatYen } from "@/shared/lib/format";
import { deleteTransaction, deleteTransactions } from "@/data/store";
import { downloadTransactionsCsv, printTransactionsPdf } from "@/features/transaction/export";

/** 自動計上（ローン返済）は編集・削除不可。手動登録分のみ操作できる。 */
const isEditable = (t: Transaction) => !t.id.startsWith("loan-");

const PAGE_SIZE_OPTIONS = [50, 100, 200];

export function TransactionTable({
  transactions,
  title = "取引明細",
}: {
  transactions: Transaction[];
  title?: string;
}) {
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [kind, setKind] = useState<TransactionKind | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // 取引が持つ年の一覧（降順）
  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 4)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // 取引が持つ科目の一覧
  const categories = useMemo(() => {
    return [...new Set(transactions.map((t) => t.category))];
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (year === "all" ? true : t.date.slice(0, 4) === year))
      .filter((t) => (month === "all" ? true : t.date.slice(5, 7) === month))
      .filter((t) => (kind === "all" ? true : t.kind === kind))
      .filter((t) => (category === "all" ? true : t.category === category))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, year, month, kind, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  // 一括選択は手動登録（編集可能）の行のみ対象
  const editableRows = rows.filter(isEditable);
  const allPageSelected =
    editableRows.length > 0 && editableRows.every((t) => selected.has(t.id));

  const toggleSelectAllPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) editableRows.forEach((t) => next.delete(t.id));
      else editableRows.forEach((t) => next.add(t.id));
      return next;
    });

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`選択した${ids.length}件の取引を削除します。よろしいですか？`)) return;
    deleteTransactions(ids);
    setSelected(new Set());
  };

  function reset<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Select
          value={kind}
          onChange={(e) => reset(setKind, e.target.value as TransactionKind | "all")}
          className="max-w-[120px]"
        >
          <option value="all">収入・支出</option>
          <option value="income">収入のみ</option>
          <option value="expense">支出のみ</option>
        </Select>
        <Select
          value={year}
          onChange={(e) => reset(setYear, e.target.value)}
          className="max-w-[130px]"
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
          onChange={(e) => reset(setMonth, e.target.value)}
          className="max-w-[110px]"
        >
          <option value="all">すべての月</option>
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
            <option key={m} value={m}>
              {Number(m)}月
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => reset(setCategory, e.target.value)}
          className="max-w-[150px]"
        >
          <option value="all">すべての科目</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">全 {filtered.length} 件</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => downloadTransactionsCsv(filtered, title)}
          >
            CSV
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => printTransactionsPdf(filtered, title)}
          >
            PDF
          </Button>
        </div>
      </div>

      {/* 一括削除バー */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm">
          <span className="font-medium text-rose-700">{selected.size} 件を選択中</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-white"
            >
              選択解除
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white transition hover:bg-rose-700"
            >
              選択を削除
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">該当する取引はありません。</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="表示中の取引をすべて選択"
                    checked={allPageSelected}
                    disabled={editableRows.length === 0}
                    onChange={toggleSelectAllPage}
                    className="h-4 w-4 cursor-pointer accent-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </th>
                <th className="px-4 py-2.5 font-medium">計上日</th>
                <th className="px-4 py-2.5 font-medium">区分</th>
                <th className="px-4 py-2.5 font-medium">科目</th>
                <th className="px-4 py-2.5 font-medium">メモ / 内訳</th>
                <th className="px-4 py-2.5 text-right font-medium">金額</th>
                <th className="px-4 py-2.5 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => {
                const income = t.kind === "income";
                const editable = isEditable(t);
                const checked = selected.has(t.id);
                return (
                  <tr
                    key={t.id}
                    className={checked ? "bg-rose-50/60" : "hover:bg-slate-50"}
                  >
                    <td className="px-4 py-2.5">
                      {editable ? (
                        <input
                          type="checkbox"
                          aria-label="この取引を選択"
                          checked={checked}
                          onChange={() => toggleSelect(t.id)}
                          className="h-4 w-4 cursor-pointer accent-rose-600"
                        />
                      ) : null}
                    </td>
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
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {isEditable(t) ? (
                        <span className="flex justify-end gap-2">
                          <Link
                            href={`/transactions/edit?id=${t.id}`}
                            className="text-green-700 hover:underline"
                          >
                            編集
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("この取引を削除しますか？")) deleteTransaction(t.id);
                            }}
                            className="text-rose-600 hover:underline"
                          >
                            削除
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">自動</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 表示件数 + ページネーション */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-slate-500">
          表示件数
          <Select
            value={String(pageSize)}
            onChange={(e) => reset(setPageSize, Number(e.target.value))}
            className="max-w-[100px]"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}件
              </option>
            ))}
          </Select>
        </label>

        {totalPages > 1 && (
          <div className="flex items-center gap-3">
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
    </div>
  );
}
