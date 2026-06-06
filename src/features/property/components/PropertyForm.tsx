"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  iconForType,
  PROPERTY_TYPES,
  type PropertyType,
} from "@/features/property/types";
import { lookupAddressByZip, normalizeZip } from "@/shared/lib/zipcode";
import { addProperty } from "@/data/store";
import {
  Button,
  FormRow,
  Input,
  Label,
  Select,
} from "@/shared/components/ui/Field";

export function PropertyForm() {
  const router = useRouter();

  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [zipStatus, setZipStatus] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

    const name = String(fd.get("name") ?? "").trim();
    const type = String(fd.get("type") ?? "") as PropertyType;
    const purchaseDate = String(fd.get("purchaseDate") ?? "");
    const purchasePrice = num("purchasePrice");
    const realEstateAcquisitionTax = num("realEstateAcquisitionTax");
    const propertyTaxSettlement = num("propertyTaxSettlement");
    const monthlyRent = num("monthlyRent");

    if (!name) return setError("物件名を入力してください。");
    if (!PROPERTY_TYPES.includes(type)) return setError("物件種別を選択してください。");
    if (!purchaseDate) return setError("取得日を入力してください。");
    if (!(purchasePrice > 0)) return setError("物件価格は正の数で入力してください。");
    if (!(monthlyRent > 0)) return setError("想定月額家賃は正の数で入力してください。");

    setError(null);
    setPending(true);
    addProperty({
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
    });
    router.push("/properties");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">物件名</Label>
        <Input id="name" name="name" placeholder="例: グランドメゾン新宿" required />
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
          <Select id="type" name="type" defaultValue={PROPERTY_TYPES[0]}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="purchaseDate">取得日</Label>
          <Input id="purchaseDate" name="purchaseDate" type="date" required />
        </div>
      </FormRow>

      <div>
        <Label htmlFor="purchasePrice">物件価格（円）</Label>
        <Input
          id="purchasePrice"
          name="purchasePrice"
          type="number"
          min={0}
          step={10000}
          placeholder="28000000"
          required
        />
      </div>

      <FormRow>
        <div>
          <Label htmlFor="realEstateAcquisitionTax">不動産取得税（円）</Label>
          <Input
            id="realEstateAcquisitionTax"
            name="realEstateAcquisitionTax"
            type="number"
            min={0}
            step={10000}
            placeholder="420000"
            defaultValue={0}
          />
        </div>
        <div>
          <Label htmlFor="propertyTaxSettlement">固定資産税清算金（円）</Label>
          <Input
            id="propertyTaxSettlement"
            name="propertyTaxSettlement"
            type="number"
            min={0}
            step={1000}
            placeholder="95000"
            defaultValue={0}
          />
        </div>
      </FormRow>

      <p className="-mt-2 text-xs text-slate-500">
        取得原価 = 物件価格 + 不動産取得税 + 固定資産税清算金
      </p>

      <div>
        <Label htmlFor="monthlyRent">想定月額家賃（円）</Label>
        <Input
          id="monthlyRent"
          name="monthlyRent"
          type="number"
          min={0}
          step={1000}
          placeholder="138000"
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "登録中..." : "物件を登録"}
        </Button>
        <Link href="/properties">
          <Button type="button" variant="ghost">
            キャンセル
          </Button>
        </Link>
      </div>
    </form>
  );
}
