import type { Loan } from "@/features/loan/types";

/**
 * モック融資データ。prop-003 はローンなし（現金購入）として残し、対比できるようにする。
 * prop-002 は途中で金利が変わるケース（変動金利の引き上げ）を含む。
 */
export const mockLoans: Loan[] = [
  {
    propertyId: "prop-001",
    principal: 25_000_000,
    startDate: "2023-01-15",
    termMonths: 35 * 12,
    method: "元利均等",
    ratePeriods: [{ from: "2023-01-15", annualRatePercent: 1.8 }],
  },
  {
    propertyId: "prop-002",
    principal: 56_000_000,
    startDate: "2022-06-01",
    termMonths: 30 * 12,
    method: "元利均等",
    ratePeriods: [
      { from: "2022-06-01", annualRatePercent: 1.5 },
      // 2025年4月に変動金利が引き上げ
      { from: "2025-04-01", annualRatePercent: 2.3 },
    ],
  },
];
