"use client";

import type { Property } from "@/features/property/types";
import { simulate } from "@/features/simulation/calc";
import { Card, CardLabel, CardValue } from "@/shared/components/ui/Card";
import { formatPercent, formatYen } from "@/shared/lib/format";

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right tabular-nums text-slate-800">
        {value}
        {sub && <span className="ml-1 text-xs text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}

export function SimulationPanel({ property: p }: { property: Property }) {
  const sim = simulate({
    purchasePrice: p.purchasePrice,
    landAssessedValue: p.landAssessedValue,
    buildingAssessedValue: p.buildingAssessedValue,
    handoverDate: p.purchaseDate,
    monthlyRent: p.monthlyRent,
    brokerageFee: p.brokerageFee,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardLabel>初期費用合計</CardLabel>
          <CardValue className="text-2xl">{formatYen(sim.initialCostTotal)}</CardValue>
          <p className="mt-1 text-xs text-slate-500">物件価格＋諸費用＋税</p>
        </Card>
        <Card>
          <CardLabel>表面利回り</CardLabel>
          <CardValue className="text-2xl text-indigo-600">
            {formatPercent(sim.grossYield)}
          </CardValue>
        </Card>
        <Card>
          <CardLabel>実質利回り（概算）</CardLabel>
          <CardValue className="text-2xl text-indigo-600">
            {formatPercent(sim.netYield)}
          </CardValue>
        </Card>
        <Card>
          <CardLabel>想定月額家賃</CardLabel>
          <CardValue className="text-2xl text-emerald-600">{formatYen(p.monthlyRent)}</CardValue>
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-bold text-slate-900">収支シミュレーション内訳</h2>
        <div className="divide-y divide-slate-100">
          <Row label="物件価格" value={formatYen(p.purchasePrice)} />
          <Row
            label="価格按分（評価額比・端数は土地）"
            value={`土地 ${formatYen(sim.land)} / 建物 ${formatYen(sim.building)}`}
          />
          <Row
            label="不動産取得税"
            value={formatYen(sim.acquisitionTax.total)}
            sub={`土地 ${formatYen(sim.acquisitionTax.landTax)}・建物 ${formatYen(sim.acquisitionTax.buildingTax)}`}
          />
          <Row
            label="固定資産税精算金"
            value={formatYen(sim.settlement.settlement)}
            sub={`年税額 ${formatYen(sim.settlement.annual)}・${sim.settlement.remainingDays}/${sim.settlement.totalDays}日`}
          />
          <Row label="仲介手数料（税込）" value={formatYen(sim.brokerageFee)} />
          <Row label="印紙代" value={formatYen(sim.stampDuty)} />
          <Row label="取得原価（価格＋取得税＋精算金）" value={formatYen(sim.acquisitionCost)} />
        </div>
      </Card>
    </div>
  );
}
