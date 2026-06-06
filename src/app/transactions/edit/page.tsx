import { Suspense } from "react";
import { TransactionEdit } from "./NewTransactionEdit";

export default function TransactionEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">読み込み中...</p>}>
      <TransactionEdit />
    </Suspense>
  );
}
