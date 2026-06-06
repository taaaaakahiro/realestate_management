import type { PortfolioSummary } from "@/features/analytics/service";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { formatMan, formatPercent } from "@/shared/lib/format";

export function PortfolioSummaryCards({ summary }: { summary: PortfolioSummary }) {
  const profit = summary.netProfit >= 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardLabel>ポートフォリオ回収率</CardLabel>
        <CardValue className="text-indigo-600">
          {formatPercent(summary.recoveryRate)}
        </CardValue>
        <div className="mt-3">
          <ProgressBar percent={summary.recoveryRate} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          取得原価に対する累計家賃収入の割合
        </p>
      </Card>

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
          支出累計 {formatMan(summary.totalExpense)}
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
