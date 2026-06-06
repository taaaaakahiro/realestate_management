"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TransactionForm } from "@/features/transaction/components/TransactionForm";
import { Card } from "@/shared/components/ui/Card";
import { useStore } from "@/data/store";

export function TransactionEdit() {
  const id = useSearchParams().get("id");
  const { transactions } = useStore();
  const transaction = transactions.find((t) => t.id === id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={
            transaction
              ? `/properties/detail?id=${transaction.propertyId}`
              : "/properties"
          }
          className="text-sm text-indigo-600 hover:underline"
        >
          ← 物件詳細へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">収支を編集</h1>
      </div>

      <Card>
        {transaction ? (
          <TransactionForm
            key={transaction.id}
            initialTransaction={transaction}
          />
        ) : (
          <p className="text-sm text-slate-500">
            取引が見つかりませんでした（自動計上のローン返済は編集できません）。
          </p>
        )}
      </Card>
    </div>
  );
}
