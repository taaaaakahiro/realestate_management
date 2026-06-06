"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PropertyForm } from "@/features/property/components/PropertyForm";
import { Card } from "@/shared/components/ui/Card";
import { useStore } from "@/data/store";

export function PropertyEditView() {
  const id = useSearchParams().get("id");
  const { properties, loans } = useStore();
  const property = properties.find((p) => p.id === id);
  const loan = loans.find((l) => l.propertyId === id);

  if (!property) {
    return (
      <div className="space-y-4">
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <p className="text-sm text-slate-500">物件が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/properties/detail?id=${property.id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← 物件詳細へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">物件を編集</h1>
        <p className="mt-1 text-sm text-slate-500">{property.name} の情報を更新します。</p>
      </div>

      <Card>
        {/* データ変更時に初期値を反映するため key で再マウント */}
        <PropertyForm
          key={JSON.stringify({ property, loan })}
          initialProperty={property}
          initialLoan={loan}
        />
      </Card>
    </div>
  );
}
