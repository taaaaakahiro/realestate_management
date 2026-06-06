"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Transaction,
  type TransactionCategory,
  type TransactionKind,
} from "@/features/transaction/types";
import { iconForType } from "@/features/property/types";
import { splitPayment } from "@/features/loan/amortization";
import { addTransaction, updateTransaction, useStore } from "@/data/store";
import { formatPercent, formatYen } from "@/shared/lib/format";
import { isValidDate, sanitizeNumberInput, validateNumber } from "@/shared/lib/validation";
import {
  Button,
  FormRow,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/components/ui/Field";

export function TransactionForm({
  defaultPropertyId,
  initialTransaction,
}: {
  defaultPropertyId?: string;
  initialTransaction?: Transaction;
}) {
  const router = useRouter();
  const { properties, loans } = useStore();
  const isEdit = !!initialTransaction;
  const t0 = initialTransaction;

  const [propertyId, setPropertyId] = useState(
    t0?.propertyId ?? defaultPropertyId ?? properties[0]?.id ?? "",
  );
  const [kind, setKind] = useState<TransactionKind>(t0?.kind ?? "income");
  const [category, setCategory] = useState<TransactionCategory>(t0?.category ?? "家賃");
  const [date, setDate] = useState(t0?.date ?? "");
  const [amount, setAmount] = useState(t0 ? String(t0.amount) : "");
  const [memo, setMemo] = useState(t0?.memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isLoanRepayment = kind === "expense" && category === "ローン返済";
  const loan = loans.find((l) => l.propertyId === propertyId);

  // ローン返済の内訳プレビュー
  const preview =
    isLoanRepayment && loan && Number(amount) > 0 && date
      ? splitPayment(loan, date, Number(amount))
      : null;

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

  function changeKind(next: TransactionKind) {
    setKind(next);
    setCategory(next === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!propertyId) return setError("物件を選択してください。");
    if (!isValidDate(date)) return setError("計上日を正しく入力してください。");
    const amt = validateNumber(amount, {
      label: isLoanRepayment ? "返済額" : "金額",
      integer: true,
    });
    if (typeof amt === "string") return setError(amt);
    if (amt === null) return setError("金額を入力してください。");

    let breakdown: { principal: number; interest: number } | undefined;
    if (isLoanRepayment) {
      if (!loan)
        return setError(
          "この物件には融資が登録されていません。物件登録時に融資を設定してください。",
        );
      const split = splitPayment(loan, date, amt);
      breakdown = { principal: split.principal, interest: split.interest };
    }

    setError(null);
    setPending(true);
    const payload = {
      propertyId,
      kind,
      category,
      date,
      amount: amt,
      memo: memo.trim() || undefined,
      breakdown,
    };
    if (isEdit) updateTransaction(t0!.id, payload);
    else addTransaction(payload);
    router.push(`/properties/detail?id=${propertyId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="propertyId">対象物件</Label>
        <Select
          id="propertyId"
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

      <FormRow>
        <div>
          <Label htmlFor="kind">区分</Label>
          <Select
            id="kind"
            value={kind}
            onChange={(e) => changeKind(e.target.value as TransactionKind)}
          >
            <option value="income">収入</option>
            <option value="expense">支出</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">科目</Label>
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label htmlFor="date">計上日</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="amount">{isLoanRepayment ? "返済額（円）" : "金額（円）"}</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(sanitizeNumberInput(e.target.value))}
            placeholder="138000"
            required
          />
        </div>
      </FormRow>

      {/* ローン返済の内訳プレビュー（適用金利を考慮して自動分解） */}
      {isLoanRepayment && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
          {!loan ? (
            <span className="text-rose-600">この物件には融資が登録されていません。</span>
          ) : preview ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>適用金利 {formatPercent(preview.ratePercent, 2)}（年率）</span>
                <span>返済前残高 {formatYen(preview.balanceBefore)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-700">
                  元本{" "}
                  <strong className="tabular-nums text-slate-900">
                    {formatYen(preview.principal)}
                  </strong>
                </span>
                <span className="text-slate-700">
                  利息{" "}
                  <strong className="tabular-nums text-rose-600">
                    {formatYen(preview.interest)}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <span className="text-slate-500">計上日と返済額を入力すると内訳を表示します。</span>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="memo">メモ（任意）</Label>
        <Textarea
          id="memo"
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: エアコン交換"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : isEdit ? "更新する" : "取引を登録"}
        </Button>
        <Link href={isEdit ? `/properties/detail?id=${propertyId}` : "/properties"}>
          <Button type="button" variant="ghost">
            キャンセル
          </Button>
        </Link>
      </div>
    </form>
  );
}
