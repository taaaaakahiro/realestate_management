"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createTransactionAction,
  type ActionState,
} from "@/features/transaction/actions";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionKind,
} from "@/features/transaction/types";
import {
  Button,
  FormRow,
  Input,
  Label,
  Select,
  Textarea,
} from "@/shared/components/ui/Field";

interface PropertyOption {
  id: string;
  name: string;
  emoji: string;
}

export function TransactionForm({
  properties,
  defaultPropertyId,
}: {
  properties: PropertyOption[];
  defaultPropertyId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createTransactionAction,
    {},
  );
  const [kind, setKind] = useState<TransactionKind>("income");

  const categories = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form action={formAction} className="space-y-5">
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
              {p.emoji} {p.name}
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
          {/* key で kind 切替時に defaultValue を再評価させる */}
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

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
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
