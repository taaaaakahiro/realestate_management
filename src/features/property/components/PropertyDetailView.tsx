"use client";

import { useState } from "react";
import { Link, useRouter, useSearchParams } from "@/router";
import {
  analyzeProperty,
  buildCumulativeSeries,
  saleNet,
} from "@/features/analytics/service";
import { RecoveryChart } from "@/features/analytics/components/RecoveryChart";
import { acquisitionCost, formatPostalCode, STATUS_LABEL } from "@/features/property/types";
import { LoanPanel } from "@/features/loan/components/LoanPanel";
import { SimulationPanel } from "@/features/simulation/components/SimulationPanel";
import { propertyTransactions } from "@/features/loan/service";
import { TransactionTable } from "@/features/transaction/components/TransactionTable";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button, FormRow, Input, Label } from "@/shared/components/ui/Field";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";
import { formatMan, formatPercent, formatYen, withThousands } from "@/shared/lib/format";
import { isValidDate, sanitizeNumberInput, validateNumber } from "@/shared/lib/validation";
import { TODAY_ISO } from "@/shared/lib/clock";
import { deleteProperty, updateProperty, useStore } from "@/data/store";

export function PropertyDetailView() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const { properties, transactions, loans } = useStore();
  const property = properties.find((p) => p.id === id);

  const [selling, setSelling] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [saleExpenses, setSaleExpenses] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [saleError, setSaleError] = useState<string | null>(null);

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

  function handleDelete() {
    if (confirm(`「${property!.name}」を削除します。\n関連する取引・融資も削除されます。よろしいですか？`)) {
      deleteProperty(property!.id);
      router.push("/properties");
    }
  }

  function confirmSale() {
    const price = validateNumber(salePrice, { label: "売却価格" });
    if (typeof price === "string") return setSaleError(price);
    if (price === null) return setSaleError("売却価格を入力してください。");
    const exp = validateNumber(saleExpenses, {
      label: "売却経費",
      min: 0,
      allowZero: true,
      optional: true,
    });
    if (typeof exp === "string") return setSaleError(exp);
    if (!isValidDate(saleDate)) return setSaleError("売却日を正しく入力してください。");
    setSaleError(null);
    updateProperty(property!.id, {
      status: "sold",
      salePrice: price * 1000,
      saleExpenses: typeof exp === "number" ? exp : 0,
      saleDate,
    });
    setSelling(false);
  }

  const statusTone = { prospect: "neutral", owned: "success", sold: "expense" } as const;
  const loan = loans.find((l) => l.propertyId === property.id);
  // 売却済みは売却日までの取引で集計する
  const until = property.status === "sold" ? property.saleDate ?? TODAY_ISO : TODAY_ISO;
  const propertyTxns = propertyTransactions(property.id, transactions, loans, until);
  const a = analyzeProperty(property, propertyTxns);
  const series = buildCumulativeSeries(property, propertyTxns);
  const profit = a.netProfit >= 0;
  const realized = a.netProfit + saleNet(property);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/properties" className="text-sm text-indigo-600 hover:underline">
          ← 物件一覧へ戻る
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-4xl">{property.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
            <p className="text-sm text-slate-500">
              {property.postalCode && `〒${formatPostalCode(property.postalCode)} `}
              {property.address}
            </p>
          </div>
          <Badge tone={statusTone[property.status]}>{STATUS_LABEL[property.status]}</Badge>
          <Badge tone="neutral">{property.type}</Badge>
          <div className="ml-auto flex flex-wrap gap-2">
            {property.status === "prospect" && (
              <Button
                type="button"
                onClick={() => updateProperty(property.id, { status: "owned" })}
              >
                取得済みにする（ポートフォリオに追加）
              </Button>
            )}
            {property.status === "owned" && (
              <Button type="button" variant="ghost" onClick={() => setSelling((v) => !v)}>
                売却済みにする
              </Button>
            )}
            {property.status === "sold" && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  updateProperty(property.id, {
                    status: "owned",
                    salePrice: undefined,
                    saleExpenses: undefined,
                    saleDate: undefined,
                  })
                }
              >
                保有中に戻す
              </Button>
            )}
            <Link href={`/properties/edit?id=${property.id}`}>
              <Button type="button" variant="ghost">
                編集
              </Button>
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              削除
            </button>
          </div>
        </div>
        {property.status === "prospect" && (
          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
            この物件は「取得前」のため、ポートフォリオ（回収率集計）には含まれません。
          </p>
        )}
      </div>

      {/* 売却入力フォーム */}
      {selling && property.status === "owned" && (
        <Card>
          <h2 className="mb-3 text-lg font-bold text-slate-900">売却を登録</h2>
          <FormRow>
            <div>
              <Label htmlFor="salePrice">売却価格（千円）</Label>
              <Input
                id="salePrice"
                type="text"
                inputMode="numeric"
                placeholder="30000"
                value={withThousands(salePrice)}
                onChange={(e) => setSalePrice(sanitizeNumberInput(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="saleExpenses">売却経費（円）</Label>
              <Input
                id="saleExpenses"
                type="text"
                inputMode="numeric"
                placeholder="1000000"
                value={withThousands(saleExpenses)}
                onChange={(e) => setSaleExpenses(sanitizeNumberInput(e.target.value))}
              />
            </div>
          </FormRow>
          <div className="mt-4 max-w-[220px]">
            <Label htmlFor="saleDate">売却日</Label>
            <Input
              id="saleDate"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>
          {saleError && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {saleError}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <Button type="button" onClick={confirmSale}>
              売却を確定（ポートフォリオから外す）
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelling(false)}>
              キャンセル
            </Button>
          </div>
        </Card>
      )}

      {/* 売却済みサマリー */}
      {property.status === "sold" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">売却損益</h2>
            <span className="text-xs text-slate-500">
              売却日 {property.saleDate ?? "—"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <CardLabel>売却価格</CardLabel>
              <CardValue className="text-xl text-emerald-600">
                {formatYen(property.salePrice ?? 0)}
              </CardValue>
            </div>
            <div>
              <CardLabel>売却経費</CardLabel>
              <CardValue className="text-xl text-rose-600">
                {formatYen(property.saleExpenses ?? 0)}
              </CardValue>
            </div>
            <div>
              <CardLabel>譲渡損益（売却 − 経費 − 取得原価）</CardLabel>
              <CardValue
                className={`text-xl ${
                  saleNet(property) - acquisitionCost(property) >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {formatYen(saleNet(property) - acquisitionCost(property))}
              </CardValue>
            </div>
            <div>
              <CardLabel>実現損益（通算）</CardLabel>
              <CardValue className={realized >= 0 ? "text-xl text-emerald-600" : "text-xl text-rose-600"}>
                {realized >= 0 ? "+" : "−"}
                {formatYen(Math.abs(realized))}
              </CardValue>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            実現損益＝保有期間の収支（収入 − 投資総額）＋ 売却純額。ダッシュボードに反映されます。
          </p>
        </Card>
      )}

      {property.status === "prospect" ? (
        /* 取得前: 収支シミュレーション */
        <SimulationPanel property={property} />
      ) : (
        <>
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
        </>
      )}

      {/* 取引明細（取得前は不要） */}
      {property.status !== "prospect" && (
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
          <TransactionTable transactions={propertyTxns} />
        </section>
      )}
    </div>
  );
}
