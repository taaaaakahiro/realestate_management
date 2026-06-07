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

/** 繰り上げ返済の方式 */
export type PrepaymentType = "reduce_payment" | "shorten_term";

export const PREPAYMENT_TYPE_LABEL: Record<PrepaymentType, string> = {
  reduce_payment: "返済額軽減型",
  shorten_term: "期間短縮型",
};

/** 繰り上げ返済（元金へ充当） */
export interface Prepayment {
  /** 実行日 (ISO 8601) */
  date: string;
  /** 繰上返済額 */
  amount: number;
  /** 返済額軽減型 / 期間短縮型 */
  type: PrepaymentType;
}

export interface Loan {
  propertyId: string;
  /** 借入先の銀行名（任意） */
  bankName?: string;
  /** 手出し金額（自己資金。借入で賄わない分） */
  downPayment?: number;
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
  /** 繰り上げ返済（実行日の昇順） */
  prepayments?: Prepayment[];
}
