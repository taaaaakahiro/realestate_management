"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  iconForType,
  PROPERTY_TYPES,
  type Property,
  type PropertyType,
} from "@/features/property/types";
import { lookupAddressByZip, normalizeZip } from "@/shared/lib/zipcode";
import { REPAYMENT_METHODS, type Loan, type RepaymentMethod } from "@/features/loan/types";
import { addLoan, addProperty, removeLoan, updateProperty } from "@/data/store";
import {
  Button,
  FormRow,
  Input,
  Label,
  Select,
} from "@/shared/components/ui/Field";

/** 円 → 千円（入力欄の初期値用） */
const toSen = (yen: number) => Math.round(yen / 1000);

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
    const num = (k: string) => Number(fd.get(k));
    const sen = (k: string) => Math.round((Number(fd.get(k)) || 0) * 1000);

    const name = String(fd.get("name") ?? "").trim();
    const type = String(fd.get("type") ?? "") as PropertyType;
    const purchaseDate = String(fd.get("purchaseDate") ?? "");
    const purchasePrice = sen("purchasePrice");
    const realEstateAcquisitionTax = sen("realEstateAcquisitionTax");
    const propertyTaxSettlement = num("propertyTaxSettlement"); // 円単位
    const monthlyRent = sen("monthlyRent");

    const loanPrincipal = useLoan ? sen("loanPrincipal") : 0;
    const loanRate = num("loanRate");
    const loanYears = num("loanYears");
    const loanMethod = String(fd.get("loanMethod") ?? "元利均等") as RepaymentMethod;
    const loanStartDate = String(fd.get("loanStartDate") ?? "") || purchaseDate;

    if (!name) return setError("物件名を入力してください。");
    if (!PROPERTY_TYPES.includes(type)) return setError("物件種別を選択してください。");
    if (!purchaseDate) return setError("取得日を入力してください。");
    if (!(purchasePrice > 0)) return setError("物件価格は正の数で入力してください。");
    if (!(monthlyRent > 0)) return setError("想定月額家賃は正の数で入力してください。");
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
      postalCode: normalizeZip(postalCode),
      address: address.trim(),
      type,
      purchasePrice,
      realEstateAcquisitionTax: Math.max(0, realEstateAcquisitionTax || 0),
      propertyTaxSettlement: Math.max(0, propertyTaxSettlement || 0),
      purchaseDate,
      monthlyRent,
      emoji: iconForType(type),
    };

    const propertyId = isEdit ? initialProperty!.id : addProperty(fields).id;
    if (isEdit) updateProperty(propertyId, fields);

    if (useLoan && loanPrincipal > 0) {
      // 金利変更履歴（2件目以降）は保持し、当初金利・開始日のみ更新する
      const tail = initialLoan ? initialLoan.ratePeriods.slice(1) : [];
      addLoan({
        propertyId,
        principal: loanPrincipal,
        startDate: loanStartDate,
        termMonths: Math.round(loanYears * 12),
        method: loanMethod,
        ratePeriods: [
          { from: loanStartDate, annualRatePercent: Math.max(0, loanRate || 0) },
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
          <Button
            type="button"
            variant="ghost"
            disabled={zipLoading}
            onClick={() => lookupZip(postalCode)}
          >
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
          <Select
            id="type"
            name="type"
            defaultValue={initialProperty?.type ?? PROPERTY_TYPES[0]}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="purchaseDate">取得日</Label>
          <Input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={initialProperty?.purchaseDate}
            required
          />
        </div>
      </FormRow>

      <div>
        <Label htmlFor="purchasePrice">物件価格（千円）</Label>
        <Input
          id="purchasePrice"
          name="purchasePrice"
          type="number"
          min={0}
          step={100}
          placeholder="28000"
          defaultValue={initialProperty ? toSen(initialProperty.purchasePrice) : undefined}
          required
        />
      </div>

      <FormRow>
        <div>
          <Label htmlFor="realEstateAcquisitionTax">不動産取得税（千円）</Label>
          <Input
            id="realEstateAcquisitionTax"
            name="realEstateAcquisitionTax"
            type="number"
            min={0}
            step={10}
            placeholder="420"
            defaultValue={initialProperty ? toSen(initialProperty.realEstateAcquisitionTax) : 0}
          />
        </div>
        <div>
          <Label htmlFor="propertyTaxSettlement">固定資産税清算金（円）</Label>
          <Input
            id="propertyTaxSettlement"
            name="propertyTaxSettlement"
            type="number"
            min={0}
            step={1}
            placeholder="95000"
            defaultValue={initialProperty?.propertyTaxSettlement ?? 0}
          />
        </div>
      </FormRow>

      <p className="-mt-2 text-xs text-slate-500">
        取得原価 = 物件価格 + 不動産取得税 + 固定資産税清算金
      </p>

      <div>
        <Label htmlFor="monthlyRent">想定月額家賃（千円）</Label>
        <Input
          id="monthlyRent"
          name="monthlyRent"
          type="number"
          min={0}
          step={1}
          placeholder="138"
          defaultValue={initialProperty ? toSen(initialProperty.monthlyRent) : undefined}
          required
        />
      </div>

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
              <Select
                id="loanMethod"
                name="loanMethod"
                defaultValue={initialLoan?.method ?? REPAYMENT_METHODS[0]}
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
