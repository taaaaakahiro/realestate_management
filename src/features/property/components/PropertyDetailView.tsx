"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  analyzeProperty,
  buildCumulativeSeries,
} from "@/features/analytics/service";
import { RecoveryChart } from "@/features/analytics/components/RecoveryChart";
import { formatPostalCode } from "@/features/property/types";
import { LoanPanel } from "@/features/loan/components/LoanPanel";
import { propertyTransactions } from "@/features/loan/service";
import { TransactionTable } from "@/features/transaction/components/TransactionTable";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { formatMan, formatPercent, formatYen } from "@/shared/lib/format";
import { TODAY_ISO } from "@/shared/lib/clock";
import { useStore } from "@/data/store";

export function PropertyDetailView() {
  const id = useSearchParams().get("id");
  const { properties, transactions, loans } = useStore();
  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="space-y-4">
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <p className="text-sm text-slate-500">物件が見つかりませんでした。</p>
      </div>
    );
  }

  const loan = loans.find((l) => l.propertyId === property.id);
  const propertyTxns = propertyTransactions(property.id, transactions, loans, TODAY_ISO);
  const a = analyzeProperty(property, propertyTxns);
  const series = buildCumulativeSeries(property, propertyTxns);
  const profit = a.netProfit >= 0;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-4xl">{property.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
            <p className="text-sm text-slate-500">
              {property.postalCode && `〒${formatPostalCode(property.postalCode)} `}
              {property.address}
            </p>
          </div>
          <Badge tone="neutral">{property.type}</Badge>
        </div>
      </div>

      {/* 回収率ハイライト */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <CardLabel>回収率（取得原価ベース）</CardLabel>
            <CardValue className="text-3xl text-indigo-600">
              {formatPercent(a.recoveryRate)}
            </CardValue>
          </div>
          <div className="text-right text-sm text-slate-500">
            累計損益{" "}
            <span className={`font-bold ${profit ? "text-emerald-600" : "text-rose-600"}`}>
              {profit ? "+" : "−"}
              {formatYen(Math.abs(a.netProfit))}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar percent={a.recoveryRate} />
        </div>
      </Card>

      {/* 指標カード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardLabel>取得原価</CardLabel>
          <CardValue>{formatMan(a.acquisitionCost)}</CardValue>
          <p className="mt-1 text-xs text-slate-500">
            物件 {formatMan(property.purchasePrice)} + 不動産取得税{" "}
            {formatMan(property.realEstateAcquisitionTax)} + 固定資産税清算金{" "}
            {formatMan(property.propertyTaxSettlement)}
          </p>
        </Card>
        <Card>
          <CardLabel>累計収入</CardLabel>
          <CardValue className="text-emerald-600">{formatMan(a.totalIncome)}</CardValue>
        </Card>
        <Card>
          <CardLabel>累計支出</CardLabel>
          <CardValue className="text-rose-600">{formatMan(a.totalExpense)}</CardValue>
        </Card>
        <Card>
          <CardLabel>表面利回り</CardLabel>
          <CardValue>{formatPercent(a.grossYield)}</CardValue>
          <p className="mt-1 text-xs text-slate-500">
            月CF {formatYen(Math.round(a.monthlyCashFlow))}
          </p>
        </Card>
      </div>

      {/* 融資・返済 */}
      {loan && <LoanPanel loan={loan} />}

      {/* 推移チャート */}
      <Card>
        <h2 className="mb-1 text-lg font-bold text-slate-900">回収率の推移</h2>
        <p className="mb-4 text-xs text-slate-500">
          緑（累計収入）が赤（投資総額 = 取得原価 + 累計支出）を上回ると投資回収が完了します。
        </p>
        <RecoveryChart data={series} />
      </Card>

      {/* 取引明細 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">取引明細</h2>
          <Link
            href={`/transactions/new?propertyId=${property.id}`}
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            ＋ この物件に収支を登録
          </Link>
        </div>
        <TransactionTable transactions={propertyTxns} limit={30} />
      </section>
    </div>
  );
}
