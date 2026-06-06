"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  iconForType,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  STATUS_LABEL,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from "@/features/property/types";
import { lookupAddressByZip, normalizeZip } from "@/shared/lib/zipcode";
import { REPAYMENT_METHODS, type Loan, type RepaymentMethod } from "@/features/loan/types";
import { DEFAULT_BROKERAGE_FEE, simulate } from "@/features/simulation/calc";
import { addLoan, addProperty, removeLoan, updateProperty } from "@/data/store";
import { formatPercent, formatYen } from "@/shared/lib/format";
import {
  Button,
  FormRow,
  Input,
  Label,
  Select,
} from "@/shared/components/ui/Field";

/** 円 → 千円（入力欄の初期値用） */
const toSen = (yen: number) => Math.round(yen / 1000);
const sen = (s: string) => Math.round((Number(s) || 0) * 1000);
const yen = (s: string) => Math.max(0, Math.round(Number(s) || 0));

export function PropertyForm({
  initialProperty,
  initialLoan,
}: {
  initialProperty?: Property;
  initialLoan?: Loan;
}) {
  const router = useRouter();
  const isEdit = !!initialProperty;

  const [postalCode, setPostalCode] = useState(initialProperty?.postalCode ?? "");
  const [address, setAddress] = useState(initialProperty?.address ?? "");
  const [zipStatus, setZipStatus] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [useLoan, setUseLoan] = useState(!!initialLoan);

  // 金額・シミュレーション系は live 計算のため state で管理（千円/円）
  const [purchaseDate, setPurchaseDate] = useState(initialProperty?.purchaseDate ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    initialProperty ? String(toSen(initialProperty.purchasePrice)) : "",
  );
  const [landAssessed, setLandAssessed] = useState(
    initialProperty ? String(toSen(initialProperty.landAssessedValue)) : "",
  );
  const [buildingAssessed, setBuildingAssessed] = useState(
    initialProperty ? String(toSen(initialProperty.buildingAssessedValue)) : "",
  );
  const [brokerageFee, setBrokerageFee] = useState(
    String(initialProperty?.brokerageFee ?? DEFAULT_BROKERAGE_FEE),
  );
  const [stampDuty, setStampDuty] = useState(String(initialProperty?.stampDuty ?? 0));
  const [monthlyRent, setMonthlyRent] = useState(
    initialProperty ? String(toSen(initialProperty.monthlyRent)) : "",
  );

  const priceYen = sen(purchasePrice);
  const landAssessedYen = sen(landAssessed);
  const buildingAssessedYen = sen(buildingAssessed);
  const rentYen = sen(monthlyRent);

  const sim = simulate({
    purchasePrice: priceYen,
    landAssessedValue: landAssessedYen,
    buildingAssessedValue: buildingAssessedYen,
    handoverDate: purchaseDate,
    monthlyRent: rentYen,
    brokerageFee: yen(brokerageFee),
    stampDuty: yen(stampDuty),
  });
  const hasAssessed = landAssessedYen + buildingAssessedYen > 0;
  const showSim = priceYen > 0 && hasAssessed;

  async function lookupZip(code: string) {
    const normalized = normalizeZip(code);
    if (normalized.length !== 7) {
      setZipStatus("郵便番号は7桁で入力してください。");
      return;
    }
    setZipLoading(true);
    setZipStatus(null);
    const result = await lookupAddressByZip(normalized);
    if ("address" in result) {
      setAddress(result.address);
      setZipStatus("住所を入力しました。番地・建物名を追記してください。");
    } else {
      setZipStatus(result.error);
    }
    setZipLoading(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const status = String(fd.get("status") ?? "owned") as PropertyStatus;
    const type = String(fd.get("type") ?? "") as PropertyType;

    const loanPrincipal = useLoan ? sen(String(fd.get("loanPrincipal") ?? "")) : 0;
    const loanRate = Number(fd.get("loanRate")) || 0;
    const loanYears = Number(fd.get("loanYears")) || 0;
    const loanMethod = String(fd.get("loanMethod") ?? "元利均等") as RepaymentMethod;
    const loanStartDate = String(fd.get("loanStartDate") ?? "") || purchaseDate;

    if (!name) return setError("物件名を入力してください。");
    if (!PROPERTY_TYPES.includes(type)) return setError("物件種別を選択してください。");
    if (!purchaseDate) return setError("取得日（引き渡し予定日）を入力してください。");
    if (!(priceYen > 0)) return setError("物件価格は正の数で入力してください。");
    if (!(rentYen > 0)) return setError("想定月額家賃は正の数で入力してください。");
    if (useLoan && !(loanPrincipal > 0))
      return setError("融資を利用する場合は借入元本を入力してください。");
    if (useLoan && !(loanYears > 0))
      return setError("融資を利用する場合は返済期間（年）を入力してください。");
    if (useLoan && !loanStartDate)
      return setError("融資を利用する場合は返済開始日を入力してください。");

    setError(null);
    setPending(true);

    const fields = {
      name,
      status,
      postalCode: normalizeZip(postalCode),
      address: address.trim(),
      type,
      purchasePrice: priceYen,
      landAssessedValue: landAssessedYen,
      buildingAssessedValue: buildingAssessedYen,
      brokerageFee: yen(brokerageFee),
      stampDuty: yen(stampDuty),
      realEstateAcquisitionTax: sim.acquisitionTax.total,
      propertyTaxSettlement: sim.settlement.settlement,
      purchaseDate,
      monthlyRent: rentYen,
      emoji: iconForType(type),
    };

    const propertyId = isEdit ? initialProperty!.id : addProperty(fields).id;
    if (isEdit) updateProperty(propertyId, fields);

    if (useLoan && loanPrincipal > 0) {
      const tail = initialLoan ? initialLoan.ratePeriods.slice(1) : [];
      addLoan({
        propertyId,
        principal: loanPrincipal,
        startDate: loanStartDate,
        termMonths: Math.round(loanYears * 12),
        method: loanMethod,
        ratePeriods: [
          { from: loanStartDate, annualRatePercent: Math.max(0, loanRate) },
          ...tail,
        ],
      });
    } else if (isEdit) {
      removeLoan(propertyId);
    }

    router.push(isEdit ? `/properties/detail?id=${propertyId}` : "/properties");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">物件名</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialProperty?.name}
          placeholder="例: グランドメゾン新宿"
          required
        />
      </div>

      <div>
        <Label htmlFor="status">状態</Label>
        <Select id="status" name="status" defaultValue={initialProperty?.status ?? "owned"}>
          {PROPERTY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-slate-500">
          「取得前」はポートフォリオ（回収率集計）に含まれません。取得後に「保有中」へ切り替えできます。
        </p>
      </div>

      <div>
        <Label htmlFor="postalCode">郵便番号</Label>
        <div className="flex gap-2">
          <Input
            id="postalCode"
            name="postalCode"
            value={postalCode}
            onChange={(e) => {
              const v = e.target.value;
              setPostalCode(v);
              if (normalizeZip(v).length === 7) lookupZip(v);
            }}
            inputMode="numeric"
            placeholder="160-0023"
            className="max-w-[180px]"
          />
          <Button type="button" variant="ghost" disabled={zipLoading} onClick={() => lookupZip(postalCode)}>
            {zipLoading ? "検索中..." : "住所を検索"}
          </Button>
        </div>
        {zipStatus && <p className="mt-1.5 text-xs text-slate-500">{zipStatus}</p>}
      </div>

      <div>
        <Label htmlFor="address">所在地</Label>
        <Input
          id="address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例: 東京都新宿区西新宿7-1-1"
        />
      </div>

      <FormRow>
        <div>
          <Label htmlFor="type">物件種別</Label>
          <Select id="type" name="type" defaultValue={initialProperty?.type ?? PROPERTY_TYPES[0]}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="purchaseDate">取得日（引き渡し予定日）</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label htmlFor="purchasePrice">物件価格（千円）</Label>
          <Input
            id="purchasePrice"
            type="number"
            min={0}
            step={100}
            placeholder="28000"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="monthlyRent">想定月額家賃（千円）</Label>
          <Input
            id="monthlyRent"
            type="number"
            min={0}
            step={1}
            placeholder="138"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            required
          />
        </div>
      </FormRow>

      {/* 取得シミュレーション（評価額・引き渡し日から自動計算） */}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          取得シミュレーション
        </legend>

        <FormRow>
          <div>
            <Label htmlFor="landAssessed">土地の評価額（千円）</Label>
            <Input
              id="landAssessed"
              type="number"
              min={0}
              step={100}
              placeholder="8000"
              value={landAssessed}
              onChange={(e) => setLandAssessed(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="buildingAssessed">建物の評価額（千円）</Label>
            <Input
              id="buildingAssessed"
              type="number"
              min={0}
              step={100}
              placeholder="6000"
              value={buildingAssessed}
              onChange={(e) => setBuildingAssessed(e.target.value)}
            />
          </div>
        </FormRow>

        <FormRow>
          <div>
            <Label htmlFor="brokerageFee">仲介手数料（円・税込）</Label>
            <Input
              id="brokerageFee"
              type="number"
              min={0}
              step={1000}
              placeholder="330000"
              value={brokerageFee}
              onChange={(e) => setBrokerageFee(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="stampDuty">印紙代（円）</Label>
            <Input
              id="stampDuty"
              type="number"
              min={0}
              step={1000}
              placeholder="20000"
              value={stampDuty}
              onChange={(e) => setStampDuty(e.target.value)}
            />
          </div>
        </FormRow>

        {showSim ? (
          <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">価格按分（評価額比・端数は土地）</span>
              <span className="tabular-nums text-slate-800">
                土地 {formatYen(sim.land)} / 建物 {formatYen(sim.building)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">不動産取得税（自動）</span>
              <span className="tabular-nums text-slate-800">
                {formatYen(sim.acquisitionTax.total)}
                <span className="ml-1 text-xs text-slate-400">
                  （土地 {formatYen(sim.acquisitionTax.landTax)}・建物{" "}
                  {formatYen(sim.acquisitionTax.buildingTax)}）
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                固定資産税精算金（自動・引き渡し日〜年末 {sim.settlement.remainingDays}/
                {sim.settlement.totalDays}日）
              </span>
              <span className="tabular-nums text-slate-800">
                {formatYen(sim.settlement.settlement)}
              </span>
            </div>
            <hr className="border-slate-200" />
            <div className="flex justify-between">
              <span className="text-slate-500">取得原価</span>
              <span className="tabular-nums font-semibold text-slate-900">
                {formatYen(sim.acquisitionCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">初期費用合計（仲介・印紙含む）</span>
              <span className="tabular-nums font-semibold text-slate-900">
                {formatYen(sim.initialCostTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">表面利回り / 実質利回り（概算）</span>
              <span className="tabular-nums font-semibold text-indigo-600">
                {formatPercent(sim.grossYield)} / {formatPercent(sim.netYield)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            物件価格と土地・建物の評価額を入力すると、按分・不動産取得税・固定資産税精算金・利回りを自動計算します。
          </p>
        )}
      </fieldset>

      {/* 融資（任意） */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">融資</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={useLoan}
            onChange={(e) => setUseLoan(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
          />
          融資を利用する（ローンを組む）
        </label>

        {useLoan ? (
          <div className="mt-4 space-y-4">
            <FormRow>
              <div>
                <Label htmlFor="loanPrincipal">借入元本（千円）</Label>
                <Input
                  id="loanPrincipal"
                  name="loanPrincipal"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="25000"
                  defaultValue={initialLoan ? toSen(initialLoan.principal) : 0}
                />
              </div>
              <div>
                <Label htmlFor="loanStartDate">返済開始日</Label>
                <Input
                  id="loanStartDate"
                  name="loanStartDate"
                  type="date"
                  defaultValue={initialLoan?.startDate}
                  required
                />
              </div>
            </FormRow>
            <FormRow>
              <div>
                <Label htmlFor="loanRate">当初金利（年率 %）</Label>
                <Input
                  id="loanRate"
                  name="loanRate"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="1.80"
                  defaultValue={initialLoan?.ratePeriods[0]?.annualRatePercent ?? 0}
                />
              </div>
              <div>
                <Label htmlFor="loanYears">返済期間（年）</Label>
                <Input
                  id="loanYears"
                  name="loanYears"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="35"
                  defaultValue={initialLoan ? initialLoan.termMonths / 12 : 0}
                />
              </div>
            </FormRow>
            <div>
              <Label htmlFor="loanMethod">返済方式</Label>
              <Select id="loanMethod" name="loanMethod" defaultValue={initialLoan?.method ?? REPAYMENT_METHODS[0]}>
                {REPAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              毎月の返済は元本・利息に自動で分解されます。金利の途中変更は物件詳細から登録できます。
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">現金購入の場合はチェック不要です。</p>
        )}
      </fieldset>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : isEdit ? "更新する" : "物件を登録"}
        </Button>
        <Link href={isEdit ? `/properties/detail?id=${initialProperty!.id}` : "/properties"}>
          <Button type="button" variant="ghost">
            キャンセル
          </Button>
        </Link>
      </div>
    </form>
  );
}
