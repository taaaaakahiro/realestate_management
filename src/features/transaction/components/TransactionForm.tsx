"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionCategory,
  type TransactionKind,
} from "@/features/transaction/types";
import { iconForType } from "@/features/property/types";
import { addTransaction, useStore } from "@/data/store";
import {
  Button,
  FormRow,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/components/ui/Field";

export function TransactionForm({ defaultPropertyId }: { defaultPropertyId?: string }) {
  const router = useRouter();
  const { properties } = useStore();
  const [kind, setKind] = useState<TransactionKind>("income");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const propertyId = String(fd.get("propertyId") ?? "");
    const category = String(fd.get("category") ?? "") as TransactionCategory;
    const date = String(fd.get("date") ?? "");
    const amount = Number(fd.get("amount"));
    const memo = String(fd.get("memo") ?? "").trim();

    if (!propertyId) return setError("物件を選択してください。");
    if (!date) return setError("計上日を入力してください。");
    if (!(amount > 0)) return setError("金額は正の数で入力してください。");

    setError(null);
    setPending(true);
    addTransaction({
      propertyId,
      kind,
      category,
      date,
      amount,
      memo: memo || undefined,
    });
    router.push(`/properties/detail?id=${propertyId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="propertyId">対象物件</Label>
        <Select
          id="propertyId"
          name="propertyId"
          defaultValue={defaultPropertyId ?? properties[0]?.id}
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
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as TransactionKind)}
          >
            <option value="income">収入</option>
            <option value="expense">支出</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">科目</Label>
          <Select id="category" name="category" key={kind} defaultValue={categories[0]}>
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
          <Input id="date" name="date" type="date" required />
        </div>
        <div>
          <Label htmlFor="amount">金額（円）</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step={1000}
            placeholder="138000"
            required
          />
        </div>
      </FormRow>

      <div>
        <Label htmlFor="memo">メモ（任意）</Label>
        <Textarea id="memo" name="memo" rows={2} placeholder="例: エアコン交換" />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "登録中..." : "取引を登録"}
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
