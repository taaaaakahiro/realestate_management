"use client";

import { useState } from "react";
import type { Loan } from "@/features/loan/types";
import { loanSummary } from "@/features/loan/amortization";
import { addRatePeriod } from "@/data/store";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { Button, Input, Label } from "@/shared/components/ui/Field";
import { formatMan, formatPercent, formatMonth } from "@/shared/lib/format";
import { TODAY_ISO } from "@/shared/lib/clock";
import { isValidDate, sanitizeNumberInput, validateNumber } from "@/shared/lib/validation";

export function LoanPanel({ loan }: { loan: Loan }) {
  const s = loanSummary(loan, TODAY_ISO);
  const [from, setFrom] = useState("");
  const [rate, setRate] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submitRate(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidDate(from)) return setError("適用開始日を正しく入力してください。");
    const r = validateNumber(rate, { label: "年利", min: 0, max: 30, allowZero: true });
    if (typeof r === "string") return setError(r);
    if (r === null) return setError("年利を入力してください。");
    setError(null);
    addRatePeriod(loan.propertyId, { from, annualRatePercent: r });
    setFrom("");
    setRate("");
    setOpen(false);
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">融資・返済</h2>
        <span className="text-xs text-slate-500">{loan.method} / 期間 {loan.termMonths / 12}年</span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <CardLabel>借入元本</CardLabel>
          <CardValue className="text-xl">{formatMan(s.principal)}</CardValue>
        </div>
        <div>
          <CardLabel>現在の残債</CardLabel>
          <CardValue className="text-xl text-slate-900">{formatMan(s.balance)}</CardValue>
          <p className="mt-1 text-xs text-slate-500">
            元本返済済 {formatMan(s.principalPaid)}
          </p>
        </div>
        <div>
          <CardLabel>累計利息</CardLabel>
          <CardValue className="text-xl text-rose-600">{formatMan(s.interestPaid)}</CardValue>
        </div>
        <div>
          <CardLabel>現在の適用金利</CardLabel>
          <CardValue className="text-xl text-indigo-600">
            {formatPercent(s.currentRatePercent, 2)}
          </CardValue>
        </div>
      </div>

      {/* 金利の推移 */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">金利の推移</h3>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            {open ? "閉じる" : "＋ 金利変更を登録"}
          </button>
        </div>
        <ul className="space-y-1 text-sm">
          {loan.ratePeriods.map((rp, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
              <span className="text-slate-600">{formatMonth(rp.from)} 〜</span>
              <span className="font-semibold tabular-nums">
                {formatPercent(rp.annualRatePercent, 2)}
              </span>
            </li>
          ))}
        </ul>

        {open && (
          <form onSubmit={submitRate} className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="rateFrom">適用開始日</Label>
              <Input
                id="rateFrom"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
                className="max-w-[180px]"
              />
            </div>
            <div>
              <Label htmlFor="rateValue">年利（%）</Label>
              <Input
                id="rateValue"
                type="number"
                step={0.01}
                min={0}
                max={30}
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(sanitizeNumberInput(e.target.value, { decimal: true }))}
                placeholder="2.30"
                required
                className="max-w-[140px]"
              />
            </div>
            <Button type="submit">登録</Button>
          </form>
        )}
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        <p className="mt-2 text-xs text-slate-500">
          金利変更を登録すると、以降の返済額・利息が再計算され、取引明細にも反映されます。
        </p>
      </div>
    </Card>
  );
}
