"use client";

import { useState } from "react";
import { Link, useRouter } from "@/router";
import {
  acquisitionCost,
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
import { BANKS } from "@/features/loan/banks";
import { SearchSelect } from "@/shared/components/ui/SearchSelect";
import {
  calcAcquisitionTax,
  calcPropertyTaxSettlement,
  calcStampDuty,
  DEFAULT_BROKERAGE_FEE,
  simulate,
} from "@/features/simulation/calc";
import { addLoan, addProperty, removeLoan, updateProperty } from "@/data/store";
import { formatPercent, formatYen, withThousands } from "@/shared/lib/format";
import { isValidDate, sanitizeNumberInput, validateNumber } from "@/shared/lib/validation";
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
  const [status, setStatus] = useState<PropertyStatus>(initialProperty?.status ?? "owned");

  // 取得前は「想定家賃＋利回り」から物件価格を逆算する初期利回り（投資総額ベース）
  const initialTotal = initialProperty
    ? acquisitionCost(initialProperty) +
      initialProperty.brokerageFee +
      initialProperty.stampDuty
    : 0;
  const initialYield =
    initialTotal > 0 ? ((initialProperty!.monthlyRent * 12) / initialTotal) * 100 : 8;
  const [targetYield, setTargetYield] = useState(
    initialProperty?.status === "prospect" ? initialYield.toFixed(2) : "8",
  );

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
  const [monthlyRent, setMonthlyRent] = useState(
    initialProperty ? String(toSen(initialProperty.monthlyRent)) : "",
  );

  // 融資（任意）— 値はサニタイズ・検証するため state で管理
  const [loanPrincipal, setLoanPrincipal] = useState(
    initialLoan ? String(toSen(initialLoan.principal)) : "",
  );
  const [loanStartDate, setLoanStartDate] = useState(initialLoan?.startDate ?? "");
  const [loanRate, setLoanRate] = useState(
    initialLoan ? String(initialLoan.ratePeriods[0]?.annualRatePercent ?? "") : "",
  );
  const [loanYears, setLoanYears] = useState(
    initialLoan ? String(initialLoan.termMonths / 12) : "",
  );
  const [loanMethod, setLoanMethod] = useState<RepaymentMethod>(
    initialLoan?.method ?? REPAYMENT_METHODS[0],
  );
  const [loanBank, setLoanBank] = useState(initialLoan?.bankName ?? "");

  const landAssessedYen = sen(landAssessed);
  const buildingAssessedYen = sen(buildingAssessed);
  const rentYen = sen(monthlyRent);
  const isProspect = status === "prospect";

  // 取得時の経費（評価額・引き渡し日・仲介手数料は価格に依存しない）
  const acqTax = calcAcquisitionTax(landAssessedYen, buildingAssessedYen).total;
  const settlement = calcPropertyTaxSettlement(
    landAssessedYen,
    buildingAssessedYen,
    purchaseDate,
  ).settlement;
  const brokerageYen = yen(brokerageFee);
  const fixedExpense = acqTax + settlement + brokerageYen;

  // 取得前: 想定家賃と目標利回りから投資総額を算出し、経費を引いて物件価格を逆算
  const yieldPct = Number(targetYield) || 0;
  const targetTotal =
    isProspect && yieldPct > 0 ? Math.round((rentYen * 12) / (yieldPct / 100)) : 0;
  // 印紙代は物件価格に依存（印紙税法の区分）するため反復で収束させる
  const priceForStamp = (stamp: number) =>
    Math.max(0, Math.floor((targetTotal - fixedExpense - stamp) / 1000) * 1000);
  let stampDerived = 0;
  for (let i = 0; i < 3; i++) {
    const next = calcStampDuty(priceForStamp(stampDerived));
    if (next === stampDerived) break;
    stampDerived = next;
  }
  const derivedPrice = priceForStamp(stampDerived);
  const acquisitionExpense = fixedExpense + calcStampDuty(derivedPrice);

  const priceYen = isProspect ? derivedPrice : sen(purchasePrice);

  const sim = simulate({
    purchasePrice: priceYen,
    landAssessedValue: landAssessedYen,
    buildingAssessedValue: buildingAssessedYen,
    handoverDate: purchaseDate,
    monthlyRent: rentYen,
    brokerageFee: yen(brokerageFee),
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
    const type = String(fd.get("type") ?? "") as PropertyType;

    // --- バリデーション（文字列・数値・日付を明確にチェック）---
    if (!name) return setError("物件名を入力してください。");
    if (!PROPERTY_TYPES.includes(type)) return setError("物件種別を選択してください。");
    if (!isValidDate(purchaseDate))
      return setError("取得日（引き渡し予定日）を正しく入力してください。");

    const rentChk = validateNumber(monthlyRent, { label: "想定月額家賃" });
    if (typeof rentChk === "string") return setError(rentChk);

    const landChk = validateNumber(landAssessed, {
      label: "土地の評価額",
      min: 0,
      allowZero: true,
      optional: true,
    });
    if (typeof landChk === "string") return setError(landChk);
    const bldgChk = validateNumber(buildingAssessed, {
      label: "建物の評価額",
      min: 0,
      allowZero: true,
      optional: true,
    });
    if (typeof bldgChk === "string") return setError(bldgChk);
    const brokChk = validateNumber(brokerageFee, {
      label: "仲介手数料",
      min: 0,
      allowZero: true,
      optional: true,
    });
    if (typeof brokChk === "string") return setError(brokChk);

    if (isProspect) {
      const yChk = validateNumber(targetYield, { label: "目標利回り", min: 0.01, max: 100 });
      if (typeof yChk === "string") return setError(yChk);
      if (!(derivedPrice > 0))
        return setError("物件価格が算出できません。利回り・家賃・評価額を確認してください。");
    } else {
      const pChk = validateNumber(purchasePrice, { label: "物件価格" });
      if (typeof pChk === "string") return setError(pChk);
    }

    let loanInput: { principal: number; rate: number; years: number; start: string } | null =
      null;
    if (useLoan) {
      const lpChk = validateNumber(loanPrincipal, { label: "借入元本" });
      if (typeof lpChk === "string") return setError(lpChk);
      const lrChk = validateNumber(loanRate, {
        label: "当初金利",
        min: 0,
        max: 30,
        allowZero: true,
      });
      if (typeof lrChk === "string") return setError(lrChk);
      const lyChk = validateNumber(loanYears, {
        label: "返済期間",
        integer: true,
        min: 1,
        max: 50,
      });
      if (typeof lyChk === "string") return setError(lyChk);
      if (!isValidDate(loanStartDate))
        return setError("返済開始日を正しく入力してください。");
      loanInput = {
        principal: sen(loanPrincipal),
        rate: lrChk as number,
        years: lyChk as number,
        start: loanStartDate,
      };
    }

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
      stampDuty: calcStampDuty(priceYen),
      realEstateAcquisitionTax: sim.acquisitionTax.total,
      propertyTaxSettlement: sim.settlement.settlement,
      purchaseDate,
      monthlyRent: rentYen,
      emoji: iconForType(type),
    };

    const propertyId = isEdit ? initialProperty!.id : addProperty(fields).id;
    if (isEdit) updateProperty(propertyId, fields);

    if (useLoan && loanInput) {
      const tail = initialLoan ? initialLoan.ratePeriods.slice(1) : [];
      addLoan({
        propertyId,
        bankName: loanBank.trim() || undefined,
        principal: loanInput.principal,
        startDate: loanInput.start,
        termMonths: Math.round(loanInput.years * 12),
        method: loanMethod,
        ratePeriods: [
          { from: loanInput.start, annualRatePercent: loanInput.rate },
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
        <Select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PropertyStatus)}
        >
          {PROPERTY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-slate-500">
          {isProspect
            ? "「取得前」は想定家賃と目標利回りから物件価格を逆算します（ポートフォリオには含まれません）。"
            : "ポートフォリオ（回収率集計）の対象です。"}
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
          <Label htmlFor="monthlyRent">想定月額家賃（千円）</Label>
          <Input
            id="monthlyRent"
            type="text"
            placeholder="138"
            inputMode="numeric"
            value={withThousands(monthlyRent)}
            onChange={(e) => setMonthlyRent(sanitizeNumberInput(e.target.value))}
            required
          />
        </div>
        {isProspect ? (
          <div>
            <Label htmlFor="targetYield">目標利回り（投資総額ベース %）</Label>
            <Input
              id="targetYield"
              type="number"
              min={0}
              step={0.1}
              placeholder="8.0"
              inputMode="decimal"
              value={targetYield}
              onChange={(e) => setTargetYield(sanitizeNumberInput(e.target.value, { decimal: true }))}
              required
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="purchasePrice">物件価格（千円）</Label>
            <Input
              id="purchasePrice"
              type="text"
              placeholder="28000"
              inputMode="numeric"
              value={withThousands(purchasePrice)}
              onChange={(e) => setPurchasePrice(sanitizeNumberInput(e.target.value))}
              required
            />
          </div>
        )}
      </FormRow>

      {isProspect && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-sm">
          <p className="mb-1 text-xs text-slate-500">
            想定家賃と目標利回りから投資総額を算出し、経費（取得税＋精算金＋仲介手数料＋印紙代）を引いて物件価格を逆算します。
          </p>
          <div className="flex justify-between">
            <span className="text-slate-500">投資総額（家賃 ÷ 利回り）</span>
            <span className="tabular-nums text-slate-800">{formatYen(targetTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">
              − 経費（取得税＋精算金＋仲介{formatYen(brokerageYen)}＋印紙{formatYen(calcStampDuty(derivedPrice))}）
            </span>
            <span className="tabular-nums text-slate-800">− {formatYen(acquisitionExpense)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-indigo-100 pt-1">
            <span className="font-medium text-slate-700">= 逆算した物件価格</span>
            <span className="tabular-nums font-bold text-indigo-700">
              {formatYen(derivedPrice)}
            </span>
          </div>
        </div>
      )}

      {/* 取得原価（評価額・引き渡し日から自動計算） */}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">
          取得原価（諸費用の自動計算）
        </legend>

        <FormRow>
          <div>
            <Label htmlFor="landAssessed">土地の評価額（千円）</Label>
            <Input
              id="landAssessed"
              type="text"
              placeholder="8000"
              inputMode="numeric"
              value={withThousands(landAssessed)}
              onChange={(e) => setLandAssessed(sanitizeNumberInput(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="buildingAssessed">建物の評価額（千円）</Label>
            <Input
              id="buildingAssessed"
              type="text"
              placeholder="6000"
              inputMode="numeric"
              value={withThousands(buildingAssessed)}
              onChange={(e) => setBuildingAssessed(sanitizeNumberInput(e.target.value))}
            />
          </div>
        </FormRow>

        <div>
          <Label htmlFor="brokerageFee">仲介手数料（円・税込）</Label>
          <Input
            id="brokerageFee"
            type="text"
            placeholder="330000"
            inputMode="numeric"
            value={withThousands(brokerageFee)}
            onChange={(e) => setBrokerageFee(sanitizeNumberInput(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-500">
            印紙代は物件価格から印紙税法に基づき自動計算します。
          </p>
        </div>

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
            <div className="flex justify-between">
              <span className="text-slate-500">印紙代（自動・印紙税法）</span>
              <span className="tabular-nums text-slate-800">{formatYen(sim.stampDuty)}</span>
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
            <div>
              <Label htmlFor="loanBank">借入銀行</Label>
              <SearchSelect
                id="loanBank"
                value={loanBank}
                onChange={setLoanBank}
                options={BANKS}
                placeholder="銀行名で検索（一覧にない場合は直接入力）"
              />
            </div>
            <FormRow>
              <div>
                <Label htmlFor="loanPrincipal">借入元本（千円）</Label>
                <Input
                  id="loanPrincipal"
                  type="text"
                  placeholder="25000"
                  inputMode="numeric"
                  value={withThousands(loanPrincipal)}
                  onChange={(e) => setLoanPrincipal(sanitizeNumberInput(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="loanStartDate">返済開始日</Label>
                <Input
                  id="loanStartDate"
                  type="date"
                  value={loanStartDate}
                  onChange={(e) => setLoanStartDate(e.target.value)}
                  required
                />
              </div>
            </FormRow>
            <FormRow>
              <div>
                <Label htmlFor="loanRate">当初金利（年率 %）</Label>
                <Input
                  id="loanRate"
                  type="number"
                  min={0}
                  max={30}
                  step={0.01}
                  placeholder="1.80"
                  inputMode="decimal"
                  value={loanRate}
                  onChange={(e) => setLoanRate(sanitizeNumberInput(e.target.value, { decimal: true }))}
                />
              </div>
              <div>
                <Label htmlFor="loanYears">返済期間（年）</Label>
                <Input
                  id="loanYears"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  placeholder="35"
                  inputMode="numeric"
                  value={loanYears}
                  onChange={(e) => setLoanYears(sanitizeNumberInput(e.target.value))}
                />
              </div>
            </FormRow>
            <div>
              <Label htmlFor="loanMethod">返済方式</Label>
              <Select
                id="loanMethod"
                value={loanMethod}
                onChange={(e) => setLoanMethod(e.target.value as RepaymentMethod)}
              >
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
