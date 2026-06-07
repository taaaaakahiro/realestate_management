"use client";

import { useState } from "react";
import { Link, useRouter } from "@/router";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionCategory,
  type TransactionKind,
} from "@/features/transaction/types";
import { iconForType } from "@/features/property/types";
import { addTransaction, useStore } from "@/data/store";
import { isValidDate, sanitizeNumberInput, validateNumber } from "@/shared/lib/validation";
import { withThousands } from "@/shared/lib/format";
import { Button, Input, Label, Select } from "@/shared/components/ui/Field";

// ローン返済は内訳の自動分解が必要なため、一括登録の科目からは除外（単票で登録）
const BATCH_EXPENSE = EXPENSE_CATEGORIES.filter((c) => c !== "ローン返済");

interface Row {
  kind: TransactionKind;
  category: TransactionCategory;
  date: string;
  amount: string;
  memo: string;
}

const emptyRow = (): Row => ({
  kind: "income",
  category: INCOME_CATEGORIES[0],
  date: "",
  amount: "",
  memo: "",
});

const isBlank = (r: Row) => r.amount.trim() === "" && r.date.trim() === "";

const MAX_ROWS = 10;
const INITIAL_ROWS = 5;

export function BatchTransactionForm({ defaultPropertyId }: { defaultPropertyId?: string }) {
  const router = useRouter();
  const { properties } = useStore();
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId ?? properties[0]?.id ?? "",
  );
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: INITIAL_ROWS }, emptyRow));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (properties.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        先に
        <Link href="/properties/new" className="text-indigo-600 hover:underline">
          物件を登録
        </Link>
        してください。
      </p>
    );
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function changeKind(i: number, kind: TransactionKind) {
    update(i, {
      kind,
      category: kind === "income" ? INCOME_CATEGORIES[0] : BATCH_EXPENSE[0],
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!propertyId) return setError("物件を選択してください。");

    const targets = rows.filter((r) => !isBlank(r));
    if (targets.length === 0) return setError("登録する行がありません。");

    // 先に全行を検証（1件でも不正なら登録しない）
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (isBlank(r)) continue;
      if (!isValidDate(r.date)) return setError(`${i + 1}行目: 計上日を入力してください。`);
      const amt = validateNumber(r.amount, { label: `${i + 1}行目の金額` });
      if (typeof amt === "string") return setError(amt);
    }

    setError(null);
    setPending(true);
    for (const r of targets) {
      addTransaction({
        propertyId,
        kind: r.kind,
        category: r.category,
        date: r.date,
        amount: Number(r.amount),
        memo: r.memo.trim() || undefined,
      });
    }
    router.push(`/properties/detail?id=${propertyId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="batchProperty">対象物件</Label>
        <Select
          id="batchProperty"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          required
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {iconForType(p.type)} {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => {
          const cats = r.kind === "income" ? INCOME_CATEGORIES : BATCH_EXPENSE;
          return (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{i + 1} 件目</span>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={rows.length <= 1}
                  className="text-xs text-rose-600 hover:underline disabled:opacity-30"
                >
                  行を削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Select
                  value={r.kind}
                  onChange={(e) => changeKind(i, e.target.value as TransactionKind)}
                  aria-label="区分"
                >
                  <option value="income">収入</option>
                  <option value="expense">支出</option>
                </Select>
                <Select
                  value={r.category}
                  onChange={(e) => update(i, { category: e.target.value as TransactionCategory })}
                  aria-label="科目"
                >
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Input
                  type="date"
                  value={r.date}
                  onChange={(e) => update(i, { date: e.target.value })}
                  aria-label="計上日"
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="金額（円）"
                  value={withThousands(r.amount)}
                  onChange={(e) => update(i, { amount: sanitizeNumberInput(e.target.value) })}
                  aria-label="金額"
                />
                <Input
                  type="text"
                  placeholder="メモ（任意）"
                  value={r.memo}
                  onChange={(e) => update(i, { memo: e.target.value })}
                  aria-label="メモ"
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => (prev.length >= MAX_ROWS ? prev : [...prev, emptyRow()]))}
        disabled={rows.length >= MAX_ROWS}
        className="text-sm font-semibold text-indigo-600 hover:underline disabled:opacity-40"
      >
        ＋ 行を追加（最大{MAX_ROWS}件・現在{rows.length}件）
      </button>

      <p className="text-xs text-slate-500">
        金額が空の行はスキップされます。ローン返済は単票（1件ずつ）で登録してください。
      </p>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "登録中..." : "まとめて登録"}
        </Button>
        <Link href="/properties">
          <Button type="button" variant="ghost">
            キャンセル
          </Button>
        </Link>
      </div>
    </form>
  );
}
