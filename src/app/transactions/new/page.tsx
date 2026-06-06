import Link from "next/link";
import { TransactionForm } from "@/features/transaction/components/TransactionForm";
import { getPropertyRepository } from "@/features/property/repository";
import { Card } from "@/shared/components/ui/Card";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const { propertyId } = await searchParams;
  const properties = await getPropertyRepository().findAll();

  const options = properties.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">収入・支出を登録</h1>
        <p className="mt-1 text-sm text-slate-500">
          家賃などの収入、ローン・修繕費などの支出を計上します。
        </p>
      </div>

      <Card>
        {options.length === 0 ? (
          <p className="text-sm text-slate-500">
            先に
            <Link href="/properties/new" className="text-indigo-600 hover:underline">
              物件を登録
            </Link>
            してください。
          </p>
        ) : (
          <TransactionForm properties={options} defaultPropertyId={propertyId} />
        )}
      </Card>
    </div>
  );
}
