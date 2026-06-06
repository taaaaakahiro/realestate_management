"use client";

import { useState } from "react";
import Link from "next/link";
import { analyzeProperty } from "@/features/analytics/service";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { propertyTransactions } from "@/features/loan/service";
import { TODAY_ISO } from "@/shared/lib/clock";
import { Button } from "@/shared/components/ui/Field";
import { useStore } from "@/data/store";

export default function PropertiesPage() {
  const { properties, transactions, loans } = useStore();
  const [showSold, setShowSold] = useState(false);

  const soldCount = properties.filter((p) => p.status === "sold").length;

  const analytics = properties
    .filter((p) => showSold || p.status !== "sold")
    // 取得前 → 保有中 → 売却済み の順に並べる
    .sort((a, b) => {
      const order = { prospect: 0, owned: 1, sold: 2 } as const;
      return order[a.status] - order[b.status];
    })
    .map((p) =>
      analyzeProperty(p, propertyTransactions(p.id, transactions, loans, TODAY_ISO)),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">物件一覧</h1>
          <p className="mt-1 text-sm text-slate-500">
            各物件をクリックすると収支明細と回収率の推移を確認できます。
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions/new">
            <Button variant="ghost">収支を登録</Button>
          </Link>
          <Link href="/properties/new">
            <Button>＋ 物件を登録</Button>
          </Link>
        </div>
      </div>

      {soldCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showSold}
            onChange={(e) => setShowSold(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
          />
          売却済みも表示する（{soldCount}件）
        </label>
      )}

      {analytics.length === 0 ? (
        <p className="text-sm text-slate-500">表示できる物件がありません。</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analytics.map((a) => (
            <PropertyCard key={a.property.id} analytics={a} />
          ))}
        </div>
      )}
    </div>
  );
}
