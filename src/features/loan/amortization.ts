import type { Transaction } from "@/features/transaction/types";
import type { Loan, RepaymentMethod } from "./types";

/** 返済スケジュールの1か月分 */
export interface ScheduleRow {
  month: string; // YYYY-MM
  ratePercent: number;
  interest: number;
  principal: number;
  payment: number;
  /** 返済後の残債 */
  balance: number;
}

function ym(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthStart(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 指定月に適用される年利(%)を、金利変更履歴から求める */
function rateForMonth(loan: Loan, monthDate: Date): number {
  let rate = loan.ratePeriods[0]?.annualRatePercent ?? 0;
  for (const rp of loan.ratePeriods) {
    if (monthStart(rp.from).getTime() <= monthDate.getTime()) rate = rp.annualRatePercent;
    else break;
  }
  return rate;
}

/**
 * 返済スケジュールを生成する。
 * - 元利均等: 毎月の返済額を一定にする。金利変更時は残高・残期間で返済額を再計算。
 * - 元金均等: 毎月の元金返済を一定にし、利息は残高に応じて逓減。
 */
export function buildSchedule(loan: Loan): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const start = new Date(loan.startDate);
  const n0 = loan.termMonths;
  if (n0 <= 0 || loan.principal <= 0) return rows;

  let balance = loan.principal;
  const equalPrincipal = loan.principal / n0; // 元金均等用
  let payment = 0; // 元利均等用（金利変更時に再計算）
  let prevRate = Number.NaN;

  for (let i = 0; i < n0 && balance > 0.5; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const annual = rateForMonth(loan, monthDate);
    const r = annual / 100 / 12;
    const remaining = n0 - i;
    const interest = balance * r;
    let principalPart: number;

    if (loan.method === "元利均等") {
      if (annual !== prevRate) {
        payment =
          r === 0 ? balance / remaining : (balance * r) / (1 - Math.pow(1 + r, -remaining));
        prevRate = annual;
      }
      principalPart = payment - interest;
    } else {
      principalPart = equalPrincipal;
    }

    // 最終月や端数で過剰返済しないよう調整
    if (principalPart > balance || i === n0 - 1) principalPart = balance;

    balance -= principalPart;
    rows.push({
      month: ym(monthDate),
      ratePercent: annual,
      interest: Math.round(interest),
      principal: Math.round(principalPart),
      payment: Math.round(principalPart + interest),
      balance: Math.max(0, Math.round(balance)),
    });
  }
  return rows;
}

/** 指定日までの返済を、元本・利息それぞれの支出取引（仮想）に展開する */
export function loanTransactions(loan: Loan, untilISO: string): Transaction[] {
  const until = monthStart(untilISO).getTime();
  const txns: Transaction[] = [];
  for (const row of buildSchedule(loan)) {
    if (monthStart(`${row.month}-01`).getTime() > until) break;
    const date = `${row.month}-27`;
    if (row.principal > 0) {
      txns.push({
        id: `loan-${loan.propertyId}-${row.month}-p`,
        propertyId: loan.propertyId,
        date,
        kind: "expense",
        category: "ローン元本",
        amount: row.principal,
      });
    }
    if (row.interest > 0) {
      txns.push({
        id: `loan-${loan.propertyId}-${row.month}-i`,
        propertyId: loan.propertyId,
        date,
        kind: "expense",
        category: "ローン利息",
        amount: row.interest,
      });
    }
  }
  return txns;
}

export interface LoanSummary {
  principal: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
  currentRatePercent: number;
  method: RepaymentMethod;
}

/** 指定日時点での融資サマリー（残債・累計利息・現在金利など） */
export function loanSummary(loan: Loan, untilISO: string): LoanSummary {
  const until = monthStart(untilISO).getTime();
  let principalPaid = 0;
  let interestPaid = 0;
  let balance = loan.principal;
  let currentRate = loan.ratePeriods[0]?.annualRatePercent ?? 0;

  for (const row of buildSchedule(loan)) {
    if (monthStart(`${row.month}-01`).getTime() > until) break;
    principalPaid += row.principal;
    interestPaid += row.interest;
    balance = row.balance;
    currentRate = row.ratePercent;
  }
  return {
    principal: loan.principal,
    principalPaid,
    interestPaid,
    balance,
    currentRatePercent: currentRate,
    method: loan.method,
  };
}
