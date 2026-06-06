import Link from "next/link";
import type { PropertyAnalytics } from "@/features/analytics/service";
import { Badge } from "@/shared/components/ui/Badge";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { formatMan, formatPercent, formatYen } from "@/shared/lib/format";

export function PropertyCard({ analytics }: { analytics: PropertyAnalytics }) {
  const { property: p, recoveryRate, totalIncome, netProfit } = analytics;
  const recovered = netProfit >= 0;

  return (
    <Link
      href={`/properties/${p.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{p.emoji}</span>
          <div>
            <h3 className="font-bold text-slate-900">{p.name}</h3>
            <p className="text-xs text-slate-500">{p.address}</p>
          </div>
        </div>
        <Badge tone="neutral">{p.type}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-sm text-slate-500">回収率</span>
        <span className="text-2xl font-bold tabular-nums text-indigo-600">
          {formatPercent(recoveryRate)}
        </span>
      </div>
      <div className="mt-1.5">
        <ProgressBar percent={recoveryRate} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-xs text-slate-500">取得原価</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatMan(analytics.acquisitionCost)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">累計収入</dt>
          <dd className="text-sm font-semibold tabular-nums text-emerald-600">
            {formatMan(totalIncome)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">累計損益</dt>
          <dd
            className={`text-sm font-semibold tabular-nums ${
              recovered ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {netProfit >= 0 ? "+" : "−"}
            {formatYen(Math.abs(netProfit)).replace("￥", "¥")}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
