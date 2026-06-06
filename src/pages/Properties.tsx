import { useState } from "react";
import { Link } from "@/router";
import { analyzeProperty } from "@/features/analytics/service";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { STATUS_LABEL, type PropertyStatus } from "@/features/property/types";
import { propertyTransactions } from "@/features/loan/service";
import { TODAY_ISO } from "@/shared/lib/clock";
import { Button } from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/cn";
import { useStore } from "@/data/store";

const STATUS_ORDER: Record<PropertyStatus, number> = { prospect: 0, owned: 1, sold: 2 };
type Filter = "all" | PropertyStatus;

export function Properties() {
  const { properties, transactions, loans } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  const counts: Record<Filter, number> = {
    all: properties.length,
    prospect: properties.filter((p) => p.status === "prospect").length,
    owned: properties.filter((p) => p.status === "owned").length,
    sold: properties.filter((p) => p.status === "sold").length,
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "prospect", label: STATUS_LABEL.prospect },
    { key: "owned", label: STATUS_LABEL.owned },
    { key: "sold", label: STATUS_LABEL.sold },
  ];

  const analytics = properties
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
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

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              filter === f.key
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {f.label}
            <span
              className={cn(
                "ml-1.5 text-xs",
                filter === f.key ? "text-indigo-100" : "text-slate-400",
              )}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {analytics.length === 0 ? (
        <p className="text-sm text-slate-500">該当する物件がありません。</p>
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
