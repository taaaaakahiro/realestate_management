import { useState } from "react";
import { Link } from "@/router";
import { analyzeProperty, type PropertyAnalytics } from "@/features/analytics/service";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { STATUS_LABEL, type PropertyStatus } from "@/features/property/types";
import { propertyTransactions } from "@/features/loan/service";
import { TODAY_ISO } from "@/shared/lib/clock";
import { splitAddress } from "@/shared/lib/address";
import { Button, Select } from "@/shared/components/ui/Field";
import { cn } from "@/shared/lib/cn";
import { useStore, deleteProperties } from "@/data/store";

const STATUS_ORDER: Record<PropertyStatus, number> = { prospect: 0, owned: 1, sold: 2 };
type Filter = "all" | PropertyStatus;

/** 並び替えの種類。"region" は都道府県・市区町村でのグループ表示。 */
type SortKey =
  | "region"
  | "recovery_desc"
  | "recovery_asc"
  | "cost_desc"
  | "cost_asc"
  | "date_desc"
  | "date_asc"
  | "name_asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "region", label: "地域別（都道府県・市区町村）" },
  { key: "recovery_desc", label: "回収率が高い順" },
  { key: "recovery_asc", label: "回収率が低い順" },
  { key: "cost_desc", label: "取得原価が高い順" },
  { key: "cost_asc", label: "取得原価が低い順" },
  { key: "date_desc", label: "取得日が新しい順" },
  { key: "date_asc", label: "取得日が古い順" },
  { key: "name_asc", label: "物件名（あいうえお順）" },
];

type RegionItem = { a: PropertyAnalytics; prefecture: string; city: string };

function sortItems(items: RegionItem[], sort: SortKey): RegionItem[] {
  const arr = [...items];
  switch (sort) {
    case "recovery_desc":
      return arr.sort((x, y) => y.a.recoveryRate - x.a.recoveryRate);
    case "recovery_asc":
      return arr.sort((x, y) => x.a.recoveryRate - y.a.recoveryRate);
    case "cost_desc":
      return arr.sort((x, y) => y.a.acquisitionCost - x.a.acquisitionCost);
    case "cost_asc":
      return arr.sort((x, y) => x.a.acquisitionCost - y.a.acquisitionCost);
    case "date_desc":
      return arr.sort((x, y) =>
        y.a.property.purchaseDate.localeCompare(x.a.property.purchaseDate),
      );
    case "date_asc":
      return arr.sort((x, y) =>
        x.a.property.purchaseDate.localeCompare(y.a.property.purchaseDate),
      );
    case "name_asc":
      return arr.sort((x, y) => x.a.property.name.localeCompare(y.a.property.name, "ja"));
    default:
      return arr;
  }
}

export function Properties() {
  const { properties, transactions, loans } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [prefFilter, setPrefFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("region");
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

  // 状態フィルター後の物件に地域情報を付与
  const statusItems: RegionItem[] = properties
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    .map((p) => {
      const a = analyzeProperty(
        p,
        propertyTransactions(p.id, transactions, loans, TODAY_ISO),
      );
      const { prefecture, city } = splitAddress(p.address);
      return { a, prefecture, city };
    });

  // 都道府県・市区町村の選択肢（状態フィルター後の物件から生成）
  const prefOptions = [...new Set(statusItems.map((i) => i.prefecture))].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
  const cityOptions = [
    ...new Set(
      statusItems
        .filter((i) => prefFilter === "all" || i.prefecture === prefFilter)
        .map((i) => i.city),
    ),
  ].sort((a, b) => a.localeCompare(b, "ja"));

  // 地域フィルター適用
  const visible = statusItems.filter(
    (i) =>
      (prefFilter === "all" || i.prefecture === prefFilter) &&
      (cityFilter === "all" || i.city === cityFilter),
  );

  // 地域別（グループ表示）
  const byPref = new Map<string, Map<string, PropertyAnalytics[]>>();
  for (const { a, prefecture, city } of visible) {
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

  // フラット並び替え（地域別以外）
  const sortedFlat = sortItems(visible, sort);

  const changePref = (v: string) => {
    setPrefFilter(v);
    setCityFilter("all"); // 都道府県を変えたら市区町村は全件に戻す
  };

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

      {/* 地域フィルター・並び替え */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5 text-slate-500">
          都道府県
          <Select
            value={prefFilter}
            onChange={(e) => changePref(e.target.value)}
            className="max-w-[150px]"
          >
            <option value="all">すべて</option>
            {prefOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-1.5 text-slate-500">
          市区町村
          <Select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="max-w-[160px]"
          >
            <option value="all">すべて</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </label>
        <label className="ml-auto flex items-center gap-1.5 text-slate-500">
          並び替え
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="max-w-[230px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-500">該当する物件がありません。</p>
      ) : sort === "region" ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedFlat.map(({ a }) => (
            <PropertyCard
              key={a.property.id}
              analytics={a}
              selectionMode={selecting}
              selected={selected.has(a.property.id)}
              onToggleSelect={() => toggleSelect(a.property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
