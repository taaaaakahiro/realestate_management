/** 融資（ローン）ドメインの型定義 */

export type RepaymentMethod = "元利均等" | "元金均等";

export const REPAYMENT_METHODS: RepaymentMethod[] = ["元利均等", "元金均等"];

/** 金利の適用期間。途中変更に対応するため、適用開始日付きで履歴を持つ。 */
export interface RatePeriod {
  /** 適用開始日 (ISO 8601)。この月以降この金利が適用される。 */
  from: string;
  /** 年利（%） */
  annualRatePercent: number;
}

export interface Loan {
  propertyId: string;
  /** 借入元本 */
  principal: number;
  /** 返済開始日 (ISO 8601) */
  startDate: string;
  /** 返済期間（月数） */
  termMonths: number;
  /** 返済方式 */
  method: RepaymentMethod;
  /**
   * 金利の変更履歴（適用開始日の昇順）。
   * 先頭要素が当初金利。途中で金利が変わるたびに追加する。
   */
  ratePeriods: RatePeriod[];
}
