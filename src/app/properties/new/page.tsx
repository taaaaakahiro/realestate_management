import Link from "next/link";
import { PropertyForm } from "@/features/property/components/PropertyForm";
import { Card } from "@/shared/components/ui/Card";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">物件を登録</h1>
        <p className="mt-1 text-sm text-slate-500">
          購入時の原価（物件価格 + 諸費用）を登録すると、回収率の計算対象になります。
        </p>
      </div>

      <Card>
        <PropertyForm />
      </Card>
    </div>
  );
}
