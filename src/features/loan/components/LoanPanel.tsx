"use client";

import { useState } from "react";
import {
  PREPAYMENT_TYPE_LABEL,
  type Loan,
  type PrepaymentType,
} from "@/features/loan/types";
import { buildSchedule, loanSummary } from "@/features/loan/amortization";
import { addPrepayment, addRatePeriod } from "@/data/store";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { Button, Input, Label, Select } from "@/shared/components/ui/Field";
import {
  formatMan,
  formatPercent,
  formatMonth,
  formatYen,
  withThousands,
} from "@/shared/lib/format";
import { TODAY_ISO } from "@/shared/lib/clock";
import { isValidDate, sanitizeNumberInput, validateNumber } from "@/shared/lib/validation";

export function LoanPanel({ loan }: { loan: Loan }) {
  const s = loanSummary(loan, TODAY_ISO);
  const [from, setFrom] = useState("");
  const [rate, setRate] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 繰上返済フォーム
  const [ppOpen, setPpOpen] = useState(false);
  const [ppDate, setPpDate] = useState("");
  const [ppAmount, setPpAmount] = useState("");
  const [ppType, setPpType] = useState<PrepaymentType>("shorten_term");
  const [ppError, setPpError] = useState<string | null>(null);

  // 完済予定月（スケジュール最終行）
  const schedule = buildSchedule(loan);
  const payoffMonth = schedule.length > 0 ? schedule[schedule.length - 1].month : null;

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

  function submitPrepayment(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidDate(ppDate)) return setPpError("実行日を正しく入力してください。");
    const amt = validateNumber(ppAmount, { label: "繰上返済額" });
    if (typeof amt === "string") return setPpError(amt);
    if (amt === null) return setPpError("繰上返済額を入力してください。");
    setPpError(null);
    addPrepayment(loan.propertyId, { date: ppDate, amount: amt * 1000, type: ppType });
    setPpDate("");
    setPpAmount("");
    setPpOpen(false);
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">融資・返済</h2>
        <span className="text-right text-xs text-slate-500">
          {loan.bankName && <span className="text-slate-700">{loan.bankName}・</span>}
          {loan.method} / 期間 {loan.termMonths / 12}年
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <CardLabel>借入元本</CardLabel>
          <CardValue className="text-xl">{formatMan(s.principal)}</CardValue>
          {loan.downPayment ? (
            <p className="mt-1 text-xs text-slate-500">
              手出し {formatMan(loan.downPayment)}
            </p>
          ) : null}
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
          <CardValue className="text-xl text-green-700">
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
            className="text-sm font-semibold text-green-700 hover:underline"
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

      {/* 繰り上げ返済 */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            繰り上げ返済
            {payoffMonth && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                完済予定 {formatMonth(`${payoffMonth}-01`)}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => setPpOpen((v) => !v)}
            className="text-sm font-semibold text-green-700 hover:underline"
          >
            {ppOpen ? "閉じる" : "＋ 繰上返済を登録"}
          </button>
        </div>

        {loan.prepayments && loan.prepayments.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {loan.prepayments.map((pp, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5"
              >
                <span className="text-slate-600">
                  {formatMonth(pp.date)}・{PREPAYMENT_TYPE_LABEL[pp.type]}
                </span>
                <span className="font-semibold tabular-nums text-rose-600">
                  {formatYen(pp.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">繰り上げ返済の登録はありません。</p>
        )}

        {ppOpen && (
          <form onSubmit={submitPrepayment} className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="ppDate">実行日</Label>
              <Input
                id="ppDate"
                type="date"
                value={ppDate}
                onChange={(e) => setPpDate(e.target.value)}
                required
                className="max-w-[170px]"
              />
            </div>
            <div>
              <Label htmlFor="ppAmount">繰上返済額（千円）</Label>
              <Input
                id="ppAmount"
                type="text"
                inputMode="numeric"
                value={withThousands(ppAmount)}
                onChange={(e) => setPpAmount(sanitizeNumberInput(e.target.value))}
                placeholder="3000"
                required
                className="max-w-[150px]"
              />
            </div>
            <div>
              <Label htmlFor="ppType">方式</Label>
              <Select
                id="ppType"
                value={ppType}
                onChange={(e) => setPpType(e.target.value as PrepaymentType)}
              >
                <option value="shorten_term">期間短縮型</option>
                <option value="reduce_payment">返済額軽減型</option>
              </Select>
            </div>
            <Button type="submit">登録</Button>
          </form>
        )}
        {ppError && <p className="mt-2 text-xs text-rose-600">{ppError}</p>}
        <p className="mt-2 text-xs text-slate-500">
          期間短縮型は完済を早め、返済額軽減型は以降の毎月返済を下げます。残債・利息・明細に反映されます。
        </p>
      </div>
    </Card>
  );
}
