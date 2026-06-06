/**
 * 取得前物件の収支シミュレーション計算（純粋関数）。
 *
 * 税率・特例は日本の一般的な軽減措置を前提とした概算。
 * - 不動産取得税: 土地=評価額×1/2×3%、建物=評価額×3%（軽減税率・宅地特例を仮定）
 * - 固定資産税(年額): 土地=評価額×1/6×1.4%、建物=評価額×1.4%（小規模住宅用地特例を仮定）
 * - 固定資産税精算: 引き渡し予定日〜その年12/31までの日割りを買主が負担
 */

/** 仲介手数料の既定値（税込）。3% + 6万円 + 消費税 の上限に近い概算。 */
export const DEFAULT_BROKERAGE_FEE = 330_000;

const ACQ_TAX_RATE = 0.03; // 不動産取得税の軽減税率
const FIXED_TAX_RATE = 0.014; // 固定資産税の標準税率

/** 物件価格を土地・建物に按分。建物は千円単位に切り捨て、端数は土地に乗せる。 */
export function allocatePrice(
  price: number,
  landAssessed: number,
  buildingAssessed: number,
): { land: number; building: number } {
  const denom = landAssessed + buildingAssessed;
  if (price <= 0 || denom <= 0) return { land: Math.max(0, price), building: 0 };
  const building = Math.floor((price * buildingAssessed) / denom / 1000) * 1000;
  return { land: price - building, building };
}

/** 不動産取得税（土地・建物の評価額から算出） */
export function calcAcquisitionTax(
  landAssessed: number,
  buildingAssessed: number,
): { landTax: number; buildingTax: number; total: number } {
  // 課税標準は1,000円未満切り捨て、税額は100円未満切り捨て
  const landBase = Math.floor((landAssessed * 0.5) / 1000) * 1000;
  const buildingBase = Math.floor(buildingAssessed / 1000) * 1000;
  const landTax = Math.floor((landBase * ACQ_TAX_RATE) / 100) * 100;
  const buildingTax = Math.floor((buildingBase * ACQ_TAX_RATE) / 100) * 100;
  return { landTax, buildingTax, total: landTax + buildingTax };
}

/** 年間固定資産税（概算） */
export function calcAnnualPropertyTax(
  landAssessed: number,
  buildingAssessed: number,
): number {
  const land = (landAssessed / 6) * FIXED_TAX_RATE;
  const building = buildingAssessed * FIXED_TAX_RATE;
  return Math.round((land + building) / 100) * 100;
}

const DAY = 86_400_000;

/** 固定資産税精算額（買主負担）: 引き渡し予定日〜その年12/31の日割り */
export function calcPropertyTaxSettlement(
  landAssessed: number,
  buildingAssessed: number,
  handoverISO: string,
): { annual: number; settlement: number; remainingDays: number; totalDays: number } {
  const annual = calcAnnualPropertyTax(landAssessed, buildingAssessed);
  const d = new Date(handoverISO);
  if (Number.isNaN(d.getTime())) {
    return { annual, settlement: 0, remainingDays: 0, totalDays: 365 };
  }
  const year = d.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalDays = Math.round((yearEnd.getTime() - yearStart.getTime()) / DAY) + 1;
  const remainingDays = Math.max(
    0,
    Math.round((yearEnd.getTime() - d.getTime()) / DAY) + 1,
  );
  const settlement = Math.round((annual * remainingDays) / totalDays);
  return { annual, settlement, remainingDays, totalDays };
}

export interface SimulationInput {
  purchasePrice: number;
  landAssessedValue: number;
  buildingAssessedValue: number;
  /** 引き渡し予定日 (ISO) */
  handoverDate: string;
  monthlyRent: number;
  brokerageFee: number;
  stampDuty: number;
}

export interface SimulationResult {
  land: number;
  building: number;
  acquisitionTax: { landTax: number; buildingTax: number; total: number };
  settlement: { annual: number; settlement: number; remainingDays: number; totalDays: number };
  brokerageFee: number;
  stampDuty: number;
  /** 取得原価 = 物件価格 + 不動産取得税 + 固定資産税精算金 */
  acquisitionCost: number;
  /** 初期費用合計 = 物件価格 + 仲介手数料 + 印紙代 + 不動産取得税 + 固定資産税精算金 */
  initialCostTotal: number;
  /** 表面利回り = 年間家賃 ÷ 物件価格 */
  grossYield: number;
  /** 実質利回り（概算）= 年間家賃 ÷ 初期費用合計 */
  netYield: number;
}

export function simulate(input: SimulationInput): SimulationResult {
  const { purchasePrice, landAssessedValue, buildingAssessedValue, handoverDate } = input;
  const { land, building } = allocatePrice(
    purchasePrice,
    landAssessedValue,
    buildingAssessedValue,
  );
  const acquisitionTax = calcAcquisitionTax(landAssessedValue, buildingAssessedValue);
  const settlement = calcPropertyTaxSettlement(
    landAssessedValue,
    buildingAssessedValue,
    handoverDate,
  );
  const acquisitionCost = purchasePrice + acquisitionTax.total + settlement.settlement;
  const initialCostTotal =
    acquisitionCost + input.brokerageFee + input.stampDuty;
  const annualRent = input.monthlyRent * 12;
  return {
    land,
    building,
    acquisitionTax,
    settlement,
    brokerageFee: input.brokerageFee,
    stampDuty: input.stampDuty,
    acquisitionCost,
    initialCostTotal,
    grossYield: purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0,
    netYield: initialCostTotal > 0 ? (annualRent / initialCostTotal) * 100 : 0,
  };
}
