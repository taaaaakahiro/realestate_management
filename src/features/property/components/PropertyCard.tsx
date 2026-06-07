import { Link } from "@/router";
import type { PropertyAnalytics } from "@/features/analytics/service";
import { STATUS_LABEL } from "@/features/property/types";
import { Badge } from "@/shared/components/ui/Badge";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { formatMan, formatPercent, formatYen } from "@/shared/lib/format";

const STATUS_TONE = {
  prospect: "neutral",
  owned: "success",
  sold: "expense",
} as const;

export function PropertyCard({ analytics }: { analytics: PropertyAnalytics }) {
  const { property: p, recoveryRate, totalIncome, netProfit, grossYield } = analytics;
  const recovered = netProfit >= 0;
  const isProspect = p.status === "prospect";

  return (
    <Link
      href={`/properties/detail?id=${p.id}`}
      className="block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-2xl ring-1 ring-slate-100">
            {p.emoji}
          </span>
          <div>
            <h3 className="font-bold text-slate-900">{p.name}</h3>
            <p className="text-xs text-slate-500">{p.address}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={STATUS_TONE[p.status]} dot>
            {STATUS_LABEL[p.status]}
          </Badge>
          <Badge tone="neutral">{p.type}</Badge>
        </div>
      </div>

      {isProspect ? (
        <>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm text-slate-500">想定表面利回り</span>
            <span className="text-2xl font-bold tabular-nums text-slate-700">
              {formatPercent(grossYield)}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            取得前のためポートフォリオには含まれません
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div>
              <dt className="text-xs text-slate-500">想定取得原価</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {formatMan(analytics.acquisitionCost)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">想定月額家賃</dt>
              <dd className="text-sm font-semibold tabular-nums">
                {formatMan(p.monthlyRent)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <>
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
        </>
      )}
    </Link>
  );
}
