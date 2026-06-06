"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TransactionForm } from "@/features/transaction/components/TransactionForm";
import { Card } from "@/shared/components/ui/Card";

export function NewTransactionForm() {
  const propertyId = useSearchParams().get("propertyId") ?? undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">収入・支出を登録</h1>
        <p className="mt-1 text-sm text-slate-500">
          家賃などの収入、ローン・修繕費などの支出を計上します。
        </p>
      </div>

      <Card>
        <TransactionForm defaultPropertyId={propertyId} />
      </Card>
    </div>
  );
}
