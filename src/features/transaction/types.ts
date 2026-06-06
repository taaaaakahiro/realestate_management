/** 取引（収入・支出）ドメインの型定義 */

export type TransactionKind = "income" | "expense";

export type IncomeCategory = "家賃" | "礼金" | "更新料" | "その他収入";
export type ExpenseCategory =
  | "広告料"
  | "修繕費"
  | "火災保険"
  | "固定資産税"
  | "不動産取得税"
  | "管理費"
  | "ローン返済"
  | "その他支出";

export type TransactionCategory = IncomeCategory | ExpenseCategory;

export const INCOME_CATEGORIES: IncomeCategory[] = [
  "家賃",
  "礼金",
  "更新料",
  "その他収入",
];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "広告料",
  "修繕費",
  "火災保険",
  "固定資産税",
  "不動産取得税",
  "管理費",
  "ローン返済",
  "その他支出",
];

export interface Transaction {
  id: string;
  propertyId: string;
  /** 計上日 (ISO 8601) */
  date: string;
  kind: TransactionKind;
  category: TransactionCategory;
  amount: number;
  memo?: string;
}
