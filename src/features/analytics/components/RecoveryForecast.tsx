import { recoveryPace, type PropertyAnalytics } from "@/features/analytics/service";
import type { Transaction } from "@/features/transaction/types";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { formatYen } from "@/shared/lib/format";

/**
 * 投下資本の回収予測カード。
 * 直近 windowMonths か月の純キャッシュフローのペースで、あと何年で回収できるかを表示。
 * 自己完結（props のみに依存）なので、他画面への影響なく差し替え可能。
 */
export function RecoveryForecast({
  analytics,
  transactions,
  untilISO,
  windowMonths = 12,
}: {
  analytics: PropertyAnalytics;
  transactions: Transaction[];
  untilISO: string;
  windowMonths?: number;
}) {
  const p = recoveryPace(analytics, transactions, untilISO, windowMonths);

  let headline: string;
  let tone = "text-indigo-600";
  if (p.remaining === 0) {
    headline = "回収済み";
    tone = "text-emerald-600";
  } else if (p.yearsToRecover === null) {
    headline = "算定不可";
    tone = "text-slate-500";
  } else {
    headline = `あと約 ${p.yearsToRecover.toFixed(1)} 年`;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardLabel>投下資本（取得原価）の回収予測</CardLabel>
          <CardValue className={`text-2xl ${tone}`}>{headline}</CardValue>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>
            直近{p.months}か月の収入ペース（年換算）:{" "}
            <span className="font-semibold text-emerald-600">
              {formatYen(Math.round(p.annual))}
            </span>
          </div>
          {p.remaining > 0 && <div>未回収 {formatYen(p.remaining)}</div>}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {p.remaining === 0
          ? "取得原価は回収済み（回収率 100% 以上）です。"
          : p.yearsToRecover === null
            ? "直近の収入がないため、回収時期は算定できません。"
            : "直近の家賃収入ペースが続いた場合に、取得原価を回収しきるまでの目安です。"}
      </p>
    </Card>
  );
}
