import type { PropertyAnalytics } from "@/features/analytics/service";
import { PROPERTY_TYPES, type PropertyType } from "@/features/property/types";
import { Card, CardLabel } from "@/shared/components/ui/Card";
import { DonutChart, type DonutSlice } from "@/shared/components/ui/DonutChart";
import { formatMan, formatPercent } from "@/shared/lib/format";

/** 物件種別ごとの配色（ブランドの緑・黄緑系で区別） */
const TYPE_COLOR: Record<PropertyType, string> = {
  区分マンション: "#16a34a", // green-600
  一棟アパート: "#4d7c0f", // lime-700
  戸建て: "#a3e635", // lime-400（黄緑）
};

/**
 * ポートフォリオ（保有中）の資産構成を、物件種別ごとの取得原価割合で円グラフ表示する。
 */
export function AssetAllocation({ analytics }: { analytics: PropertyAnalytics[] }) {
  const total = analytics.reduce((s, a) => s + a.acquisitionCost, 0);

  // 種別ごとに取得原価・件数を集計（PROPERTY_TYPES の順で安定化）
  const groups = PROPERTY_TYPES.map((type) => {
    const items = analytics.filter((a) => a.property.type === type);
    const value = items.reduce((s, a) => s + a.acquisitionCost, 0);
    return { type, value, count: items.length };
  }).filter((g) => g.count > 0);

  const slices: DonutSlice[] = groups.map((g) => ({
    label: g.type,
    value: g.value,
    color: TYPE_COLOR[g.type],
  }));

  return (
    <Card>
      <CardLabel>資産構成（取得原価ベース）</CardLabel>
      {total === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          保有中の物件がありません。物件を「保有中」に切り替えると資産構成が表示されます。
        </p>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <DonutChart
            data={slices}
            centerLabel={formatMan(total)}
            centerSub={`${analytics.length} 件`}
          />
          <ul className="w-full flex-1 space-y-2.5">
            {groups.map((g) => {
              const pct = (g.value / total) * 100;
              return (
                <li key={g.type} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: TYPE_COLOR[g.type] }}
                    aria-hidden
                  />
                  <span className="text-slate-700">
                    {g.type}
                    <span className="ml-1 text-xs text-slate-400">{g.count}件</span>
                  </span>
                  <span className="ml-auto tabular-nums font-semibold text-slate-900">
                    {formatPercent(pct)}
                  </span>
                  <span className="w-20 text-right tabular-nums text-xs text-slate-500">
                    {formatMan(g.value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
