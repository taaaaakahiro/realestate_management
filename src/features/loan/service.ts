import type { Transaction } from "@/features/transaction/types";
import type { Loan } from "./types";
import { loanTransactions } from "./amortization";

/**
 * 物件の取引一覧を、融資から算出した元本・利息（仮想取引）と結合して返す。
 * これにより回収率や収支の計算・表示でローンの内訳が一貫して扱える。
 */
export function propertyTransactions(
  propertyId: string,
  transactions: Transaction[],
  loans: Loan[],
  untilISO: string,
): Transaction[] {
  const own = transactions.filter((t) => t.propertyId === propertyId);
  const loan = loans.find((l) => l.propertyId === propertyId);
  return loan ? [...own, ...loanTransactions(loan, untilISO)] : own;
}
