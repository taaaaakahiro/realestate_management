import type { Transaction } from "@/features/transaction/types";
import { Badge } from "@/shared/components/ui/Badge";
import { formatDate, formatYen } from "@/shared/lib/format";

export function TransactionTable({
  transactions,
  limit,
}: {
  transactions: Transaction[];
  limit?: number;
}) {
  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">取引はまだありません。</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">計上日</th>
            <th className="px-4 py-2.5 font-medium">区分</th>
            <th className="px-4 py-2.5 font-medium">科目</th>
            <th className="px-4 py-2.5 font-medium">メモ</th>
            <th className="px-4 py-2.5 text-right font-medium">金額</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((t) => {
            const income = t.kind === "income";
            return (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 tabular-nums text-slate-600">
                  {formatDate(t.date)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={income ? "income" : "expense"}>
                    {income ? "収入" : "支出"}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{t.category}</td>
                <td className="px-4 py-2.5 text-slate-400">{t.memo ?? "—"}</td>
                <td
                  className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                    income ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {income ? "+" : "−"}
                  {formatYen(t.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
