import {
  analyzeProperty,
  realizedPnL,
  summarizePortfolio,
} from "@/features/analytics/service";
import { PortfolioSummaryCards } from "@/features/analytics/components/PortfolioSummary";
import { AssetAllocation } from "@/features/analytics/components/AssetAllocation";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { isInPortfolio } from "@/features/property/types";
import { propertyTransactions } from "@/features/loan/service";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { formatMan } from "@/shared/lib/format";
import { TODAY_ISO } from "@/shared/lib/clock";
import { useStore } from "@/data/store";

export function Dashboard() {
  const { properties, transactions, loans } = useStore();

  const analytics = properties
    .filter(isInPortfolio)
    .map((p) =>
      analyzeProperty(p, propertyTransactions(p.id, transactions, loans, TODAY_ISO)),
    );
  const summary = summarizePortfolio(analytics);
  const ranked = [...analytics].sort((a, b) => b.recoveryRate - a.recoveryRate);

  // 売却済みの実現損益（ポートフォリオに反映）
  const soldProps = properties.filter((p) => p.status === "sold");
  const realizedTotal = soldProps.reduce((sum, p) => {
    const until = p.saleDate ?? TODAY_ISO;
    const a = analyzeProperty(p, propertyTransactions(p.id, transactions, loans, until));
    return sum + realizedPnL(a);
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-500">
          購入原価・日々の支出・家賃収入から投資回収の進捗を一覧します。
        </p>
      </div>

      {/* ポートフォリオ概況（保有中の全体指標） */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">ポートフォリオ概況</h2>
        <PortfolioSummaryCards summary={summary} />
        {soldProps.length > 0 && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardLabel>実現損益（売却済み {soldProps.length} 件）</CardLabel>
              <CardValue
                className={realizedTotal >= 0 ? "text-emerald-600" : "text-rose-600"}
              >
                {realizedTotal >= 0 ? "+" : "−"}
                {formatMan(Math.abs(realizedTotal))}
              </CardValue>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              売却で確定した通算損益（保有期間の収支 ＋ 売却純額）
            </p>
          </Card>
        )}
      </section>

      {/* 資産構成（種別別の割合） */}
      {analytics.length > 0 && (
        <section>
          <AssetAllocation analytics={analytics} />
        </section>
      )}

      {/* 物件別の回収状況 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          物件別の回収状況
          <span className="ml-2 text-sm font-medium text-slate-400">
            保有 {ranked.length} 件
          </span>
        </h2>
        {ranked.length === 0 ? (
          <p className="text-sm text-slate-500">
            保有中の物件がありません。物件を登録して「保有中」に切り替えると、ここに回収状況が表示されます。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ranked.map((a) => (
              <PropertyCard key={a.property.id} analytics={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
