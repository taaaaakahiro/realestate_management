import { Link } from "@/router";
import { PropertyForm } from "@/features/property/components/PropertyForm";
import { Card } from "@/shared/components/ui/Card";

export function NewProperty() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">物件を登録</h1>
        <p className="mt-1 text-sm text-slate-500">
          取得済みの物件は物件価格、取得前の物件は想定家賃と目標利回りから登録できます。
        </p>
      </div>

      <Card>
        <PropertyForm />
      </Card>
    </div>
  );
}
