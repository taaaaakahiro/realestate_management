import { useState } from "react";
import { Link } from "@/router";
import { analyzeProperty, type PropertyAnalytics } from "@/features/analytics/service";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { STATUS_LABEL, type PropertyStatus } from "@/features/property/types";
import { propertyTransactions } from "@/features/loan/service";
import { TODAY_ISO } from "@/shared/lib/clock";
import { splitAddress } from "@/shared/lib/address";
import { Button } from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/cn";
import { useStore, deleteProperties } from "@/data/store";

const STATUS_ORDER: Record<PropertyStatus, number> = { prospect: 0, owned: 1, sold: 2 };
type Filter = "all" | PropertyStatus;

export function Properties() {
  const { properties, transactions, loans } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`選択した${ids.length}件の物件を削除します。\n紐づく取引・融資もすべて削除されます。よろしいですか？`)) return;
    deleteProperties(ids);
    exitSelect();
  };

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

  // 都道府県 → 市区町村 でグループ化
  const byPref = new Map<string, Map<string, PropertyAnalytics[]>>();
  for (const a of analytics) {
    const { prefecture, city } = splitAddress(a.property.address);
    if (!byPref.has(prefecture)) byPref.set(prefecture, new Map());
    const cityMap = byPref.get(prefecture)!;
    if (!cityMap.has(city)) cityMap.set(city, []);
    cityMap.get(city)!.push(a);
  }
  const grouped = [...byPref.entries()]
    .map(([prefecture, cityMap]) => ({
      prefecture,
      count: [...cityMap.values()].reduce((s, items) => s + items.length, 0),
      cities: [...cityMap.entries()]
        .map(([city, items]) => ({ city, items }))
        .sort((a, b) => a.city.localeCompare(b.city, "ja")),
    }))
    .sort((a, b) => a.prefecture.localeCompare(b.prefecture, "ja"));

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
          {selecting ? (
            <>
              <Button variant="ghost" onClick={exitSelect}>
                キャンセル
              </Button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selected.size === 0}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-700 disabled:opacity-50"
              >
                選択を削除{selected.size > 0 ? `（${selected.size}）` : ""}
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setSelecting(true)}>
                選択して削除
              </Button>
              <Link href="/transactions/new">
                <Button variant="ghost">収支を登録</Button>
              </Link>
              <Link href="/properties/new">
                <Button>＋ 物件を登録</Button>
              </Link>
            </>
          )}
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
                ? "border-green-600 bg-green-600 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {f.label}
            <span
              className={cn(
                "ml-1.5 text-xs",
                filter === f.key ? "text-green-100" : "text-slate-400",
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
        <div className="space-y-8">
          {grouped.map((pref) => (
            <section key={pref.prefecture} className="space-y-4">
              <h2 className="flex items-baseline gap-2 border-b border-slate-200 pb-1.5 text-lg font-bold text-slate-900">
                {pref.prefecture}
                <span className="text-sm font-medium text-slate-400">{pref.count}件</span>
              </h2>
              {pref.cities.map((c) => (
                <div key={c.city} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600">
                    {c.city}
                    <span className="ml-1.5 text-xs font-medium text-slate-400">
                      {c.items.length}件
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {c.items.map((a) => (
                      <PropertyCard
                        key={a.property.id}
                        analytics={a}
                        selectionMode={selecting}
                        selected={selected.has(a.property.id)}
                        onToggleSelect={() => toggleSelect(a.property.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
