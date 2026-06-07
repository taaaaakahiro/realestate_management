"use client";

import { useState } from "react";
import { recoveryPace, type PropertyAnalytics } from "@/features/analytics/service";
import type { Transaction } from "@/features/transaction/types";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { Select } from "@/shared/components/ui/Field";
import { formatYen } from "@/shared/lib/format";

const PERIOD_OPTIONS = [
  { months: 1, label: "直近1か月" },
  { months: 3, label: "直近3か月" },
  { months: 6, label: "直近半年" },
  { months: 12, label: "直近1年" },
];

function monthsSince(fromISO: string, until: Date): number {
  const f = new Date(fromISO);
  return (until.getFullYear() - f.getFullYear()) * 12 + (until.getMonth() - f.getMonth());
}

/** か月数を「N年Mか月」に整形 */
function formatYearsMonths(totalMonths: number): string {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y > 0 && m > 0) return `${y}年${m}か月`;
  if (y > 0) return `${y}年`;
  return `${m}か月`;
}

/**
 * 投下資本（取得原価）の回収予測カード。
 * 直近の期間（1か月〜1年）を選んで収入ペースを推定し、回収までの期間を表示。
 * 取得日から選択期間が経過していない場合、その期間は選択不可。
 */
export function RecoveryForecast({
  analytics,
  transactions,
  untilISO,
}: {
  analytics: PropertyAnalytics;
  transactions: Transaction[];
  untilISO: string;
}) {
  const until = new Date(untilISO);
  const elapsed = monthsSince(analytics.property.purchaseDate, until);
  const available = PERIOD_OPTIONS.filter((o) => o.months <= elapsed);

  const [period, setPeriod] = useState<number>(12);
  // 取得からの経過に収まる最大の期間を既定／補正値とする
  const fallback = available.length ? available[available.length - 1].months : 0;
  const effective = period <= elapsed && period > 0 ? period : fallback;

  if (available.length === 0) {
    return (
      <Card>
        <CardLabel>投下資本（取得原価）の回収予測</CardLabel>
        <p className="mt-2 text-sm text-slate-500">
          取得から1か月以上経過すると、直近ペースで回収予測を表示します。
        </p>
      </Card>
    );
  }

  const p = recoveryPace(analytics, transactions, untilISO, effective);

  let headline: string;
  let tone = "text-indigo-600";
  if (p.remaining === 0) {
    headline = "回収済み";
    tone = "text-emerald-600";
  } else if (p.yearsToRecover === null || p.annual <= 0) {
    headline = "算定不可";
    tone = "text-slate-500";
  } else {
    const totalMonths = Math.ceil(p.remaining / (p.annual / 12));
    headline = `あと ${formatYearsMonths(totalMonths)}`;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardLabel>投下資本（取得原価）の回収予測</CardLabel>
          <CardValue className={`text-2xl ${tone}`}>{headline}</CardValue>
        </div>
        <div className="text-right">
          <Select
            value={effective}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="max-w-[140px]"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.months} value={o.months} disabled={o.months > elapsed}>
                {o.label}
                {o.months > elapsed ? "（未経過）" : ""}
              </option>
            ))}
          </Select>
          <div className="mt-1 text-xs text-slate-500">
            収入ペース（年換算）{" "}
            <span className="font-semibold text-emerald-600">{formatYen(Math.round(p.annual))}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {p.remaining === 0
          ? "取得原価は回収済み（回収率 100% 以上）です。"
          : p.yearsToRecover === null || p.annual <= 0
            ? "直近の収入がないため、回収時期は算定できません。"
            : `選択期間の家賃収入ペースで取得原価（未回収 ${formatYen(p.remaining)}）を回収しきるまでの目安です。`}
      </p>
    </Card>
  );
}
