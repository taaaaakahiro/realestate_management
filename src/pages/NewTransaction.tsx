import { useState } from "react";
import { Link, useSearchParams } from "@/router";
import { TransactionForm } from "@/features/transaction/components/TransactionForm";
import { BatchTransactionForm } from "@/features/transaction/components/BatchTransactionForm";
import { Card } from "@/shared/components/ui/Card";
import { cn } from "@/shared/lib/cn";

export function NewTransaction() {
  const propertyId = useSearchParams().get("propertyId") ?? undefined;
  const [batch, setBatch] = useState(false);

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

      <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
        {[
          { key: false, label: "1件ずつ" },
          { key: true, label: "まとめて（複数件）" },
        ].map((m) => (
          <button
            key={String(m.key)}
            type="button"
            onClick={() => setBatch(m.key)}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition",
              batch === m.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Card>
        {batch ? (
          <BatchTransactionForm defaultPropertyId={propertyId} />
        ) : (
          <TransactionForm defaultPropertyId={propertyId} />
        )}
      </Card>
    </div>
  );
}
