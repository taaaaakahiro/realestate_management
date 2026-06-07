import type { PortfolioSummary } from "@/features/analytics/service";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { formatMan, formatPercent } from "@/shared/lib/format";

export function PortfolioSummaryCards({ summary }: { summary: PortfolioSummary }) {
  const profit = summary.netProfit >= 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="brand-gradient relative overflow-hidden rounded-2xl p-5 text-white shadow-md sm:col-span-2 lg:col-span-1">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <p className="text-sm font-medium text-white/80">ポートフォリオ回収率</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {formatPercent(summary.recoveryRate)}
        </p>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(summary.recoveryRate, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/80">取得原価に対する累計家賃収入の割合</p>
      </div>

      <Card>
        <CardLabel>取得原価合計</CardLabel>
        <CardValue>{formatMan(summary.acquisitionCost)}</CardValue>
        <p className="mt-2 text-xs text-slate-500">
          物件 {summary.propertyCount} 件・諸費用込み
        </p>
      </Card>

      <Card>
        <CardLabel>累計収入 / 支出</CardLabel>
        <CardValue className="text-emerald-600">
          {formatMan(summary.totalIncome)}
        </CardValue>
        <p className="mt-2 text-xs text-slate-500">
          支出累計 <span className="font-semibold text-rose-600">{formatMan(summary.totalExpense)}</span>
        </p>
      </Card>

      <Card>
        <CardLabel>累計損益</CardLabel>
        <CardValue className={profit ? "text-emerald-600" : "text-rose-600"}>
          {profit ? "+" : "−"}
          {formatMan(Math.abs(summary.netProfit))}
        </CardValue>
        <p className="mt-2 text-xs text-slate-500">
          収入 − 投資総額（取得原価 + 支出）
        </p>
      </Card>
    </div>
  );
}
