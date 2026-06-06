import { Suspense } from "react";
import { PropertyEditView } from "@/features/property/components/PropertyEditView";

export default function PropertyEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">読み込み中...</p>}>
      <PropertyEditView />
    </Suspense>
  );
}
