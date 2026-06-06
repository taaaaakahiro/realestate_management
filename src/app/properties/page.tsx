import Link from "next/link";
import { analyzeProperty } from "@/features/analytics/service";
import { PropertyCard } from "@/features/property/components/PropertyCard";
import { getPropertyRepository } from "@/features/property/repository";
import { getTransactionRepository } from "@/features/transaction/repository";
import { Button } from "@/shared/components/ui/Field";

export default async function PropertiesPage() {
  const properties = await getPropertyRepository().findAll();
  const txnRepo = getTransactionRepository();

  const analytics = await Promise.all(
    properties.map(async (p) =>
      analyzeProperty(p, await txnRepo.findByPropertyId(p.id)),
    ),
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {analytics.map((a) => (
          <PropertyCard key={a.property.id} analytics={a} />
        ))}
      </div>
    </div>
  );
}
