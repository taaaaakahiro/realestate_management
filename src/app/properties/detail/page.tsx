import { Suspense } from "react";
import { PropertyDetailView } from "@/features/property/components/PropertyDetailView";

export default function PropertyDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">読み込み中...</p>}>
      <PropertyDetailView />
    </Suspense>
  );
}
