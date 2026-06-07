import { acquisitionCost, type Property } from "@/features/property/types";
import type { Transaction } from "@/features/transaction/types";

/** 物件単位の収支サマリー */
export interface PropertyAnalytics {
  property: Property;
  /** 取得原価（物件価格 + 諸費用） */
  acquisitionCost: number;
  /** 累計家賃・更新料などの収入 */
  totalIncome: number;
  /** 取得後の累計支出（取得原価は含まない） */
  totalExpense: number;
  /** 投資総額（取得原価 + 累計支出） */
  totalInvestment: number;
  /** 累計損益（収入 − 投資総額）。プラスなら投資回収完了 */
  netProfit: number;
  /**
   * 回収率: 累計収入 ÷ 取得原価 × 100。
   * 「購入時の原価を家賃でどれだけ取り戻せたか」を表す主要指標。
   */
  recoveryRate: number;
  /** 表面利回り: 年間想定家賃 ÷ 物件価格 × 100 */
  grossYield: number;
  /** 月平均キャッシュフロー（収入 − 支出、取得原価を除く） */
  monthlyCashFlow: number;
}

/** 売却純額 = 売却価格 − 売却経費 */
export function saleNet(p: Property): number {
  return (p.salePrice ?? 0) - (p.saleExpenses ?? 0);
}

export interface RecoveryPace {
  /** 集計に使った月数 */
  months: number;
  /** 年換算した家賃等の収入ペース */
  annual: number;
  /** 取得原価の未回収額（取得原価 − 累計収入） */
  remaining: number;
  /** 直近ペースで取得原価を回収しきるまでの年数（回収済みは 0、ペースが0は null） */
  yearsToRecover: number | null;
}

/**
 * 回収率（累計収入 ÷ 取得原価）と整合する回収予測。
 * 直近 windowMonths か月の収入ペースで、取得原価をあと何年で回収できるかを試算する。
 */
export function recoveryPace(
  a: PropertyAnalytics,
  transactions: Transaction[],
  untilISO: string,
  windowMonths = 12,
): RecoveryPace {
  const until = new Date(untilISO);
  const startBound = new Date(until.getFullYear(), until.getMonth() - (windowMonths - 1), 1);
  let income = 0;
  const monthsSet = new Set<string>();
  for (const t of transactions) {
    if (t.kind !== "income") continue;
    const d = new Date(t.date);
    if (d >= startBound && d <= until) {
      income += t.amount;
      monthsSet.add(t.date.slice(0, 7));
    }
  }
  const months = Math.max(1, monthsSet.size);
  const annual = (income / months) * 12;
  const remaining = Math.max(0, a.acquisitionCost - a.totalIncome);
  const yearsToRecover = remaining === 0 ? 0 : annual > 0 ? remaining / annual : null;
  return { months, annual, remaining, yearsToRecover };
}

/**
 * 実現損益 = 累計損益（収入 − 投資総額）+ 売却純額。
 * 売却済み物件が確定させた通算の損益。
 */
export function realizedPnL(a: PropertyAnalytics): number {
  return a.netProfit + saleNet(a.property);
}

const sumBy = (txns: Transaction[], kind: Transaction["kind"]) =>
  txns.filter((t) => t.kind === kind).reduce((acc, t) => acc + t.amount, 0);

/** 物件 + 取引から収支サマリーを算出する純粋関数 */
export function analyzeProperty(
  property: Property,
  transactions: Transaction[],
): PropertyAnalytics {
  const cost = acquisitionCost(property);
  const totalIncome = sumBy(transactions, "income");
  const totalExpense = sumBy(transactions, "expense");
  const totalInvestment = cost + totalExpense;

  const monthsHeld = Math.max(1, countMonths(transactions));

  return {
    property,
    acquisitionCost: cost,
    totalIncome,
    totalExpense,
    totalInvestment,
    netProfit: totalIncome - totalInvestment,
    recoveryRate: cost === 0 ? 0 : (totalIncome / cost) * 100,
    grossYield:
      property.purchasePrice === 0
        ? 0
        : ((property.monthlyRent * 12) / property.purchasePrice) * 100,
    monthlyCashFlow: (totalIncome - totalExpense) / monthsHeld,
  };
}

function countMonths(transactions: Transaction[]): number {
  const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
  return months.size;
}

/** ポートフォリオ全体の合算サマリー */
export interface PortfolioSummary {
  propertyCount: number;
  acquisitionCost: number;
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  netProfit: number;
  recoveryRate: number;
}

export function summarizePortfolio(items: PropertyAnalytics[]): PortfolioSummary {
  const acc = items.reduce(
    (s, a) => {
      s.acquisitionCost += a.acquisitionCost;
      s.totalIncome += a.totalIncome;
      s.totalExpense += a.totalExpense;
      return s;
    },
    { acquisitionCost: 0, totalIncome: 0, totalExpense: 0 },
  );

  const totalInvestment = acc.acquisitionCost + acc.totalExpense;
  return {
    propertyCount: items.length,
    acquisitionCost: acc.acquisitionCost,
    totalIncome: acc.totalIncome,
    totalExpense: acc.totalExpense,
    totalInvestment,
    netProfit: acc.totalIncome - totalInvestment,
    recoveryRate:
      acc.acquisitionCost === 0 ? 0 : (acc.totalIncome / acc.acquisitionCost) * 100,
  };
}

/** 累計収入と累計コストの月次推移（損益分岐の可視化用） */
export interface CumulativePoint {
  month: string; // YYYY-MM
  cumulativeIncome: number;
  cumulativeCost: number; // 取得原価 + 累計支出
  recoveryRate: number;
}

export function buildCumulativeSeries(
  property: Property,
  transactions: Transaction[],
): CumulativePoint[] {
  const cost = acquisitionCost(property);
  const byMonth = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const ym = t.date.slice(0, 7);
    const cur = byMonth.get(ym) ?? { income: 0, expense: 0 };
    if (t.kind === "income") cur.income += t.amount;
    else cur.expense += t.amount;
    byMonth.set(ym, cur);
  }

  const months = [...byMonth.keys()].sort();
  let cumIncome = 0;
  let cumExpense = 0;

  return months.map((month) => {
    const m = byMonth.get(month)!;
    cumIncome += m.income;
    cumExpense += m.expense;
    const cumulativeCost = cost + cumExpense;
    return {
      month,
      cumulativeIncome: cumIncome,
      cumulativeCost,
      recoveryRate: cost === 0 ? 0 : (cumIncome / cost) * 100,
    };
  });
}
