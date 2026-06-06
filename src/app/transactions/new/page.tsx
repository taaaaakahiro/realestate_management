import { Suspense } from "react";
import { NewTransactionForm } from "./NewTransactionForm";

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">読み込み中...</p>}>
      <NewTransactionForm />
    </Suspense>
  );
}
