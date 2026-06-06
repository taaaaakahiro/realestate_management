import { analyzeProperty, summarizePortfolio } from "@/features/analytics/service";
import { PortfolioSummaryCards } from "@/features/analytics/components/PortfolioSummary";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { getPropertyRepository } from "@/features/property/repository";
import { getTransactionRepository } from "@/features/transaction/repository";

export default async function DashboardPage() {
  const properties = await getPropertyRepository().findAll();
  const txnRepo = getTransactionRepository();

  const analytics = await Promise.all(
    properties.map(async (p) =>
      analyzeProperty(p, await txnRepo.findByPropertyId(p.id)),
    ),
  );
  const summary = summarizePortfolio(analytics);

  const ranked = [...analytics].sort((a, b) => b.recoveryRate - a.recoveryRate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-slate-500">
          購入原価・日々の支出・家賃収入から投資回収の進捗を一覧します。
        </p>
      </div>

      <PortfolioSummaryCards summary={summary} />

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">物件別の回収状況</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ranked.map((a) => (
            <PropertyCard key={a.property.id} analytics={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
