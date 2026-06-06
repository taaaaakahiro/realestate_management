"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { iconForType, PROPERTY_TYPES, type PropertyType } from "./types";
import { getPropertyRepository } from "./repository";
import { normalizeZip } from "@/shared/lib/zipcode";

export interface ActionState {
  error?: string;
}

const num = (fd: FormData, key: string) => Number(fd.get(key));

export async function createPropertyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const postalCode = normalizeZip(String(formData.get("postalCode") ?? ""));
  const address = String(formData.get("address") ?? "").trim();
  const type = String(formData.get("type") ?? "") as PropertyType;
  const purchasePrice = num(formData, "purchasePrice");
  const realEstateAcquisitionTax = num(formData, "realEstateAcquisitionTax");
  const propertyTaxSettlement = num(formData, "propertyTaxSettlement");
  const purchaseDate = String(formData.get("purchaseDate") ?? "");
  const monthlyRent = num(formData, "monthlyRent");

  if (!name) return { error: "物件名を入力してください。" };
  if (!PROPERTY_TYPES.includes(type)) return { error: "物件種別を選択してください。" };
  if (!purchaseDate) return { error: "取得日を入力してください。" };
  if (!(purchasePrice > 0)) return { error: "物件価格は正の数で入力してください。" };
  if (realEstateAcquisitionTax < 0)
    return { error: "不動産取得税は0以上で入力してください。" };
  if (propertyTaxSettlement < 0)
    return { error: "固定資産税清算金は0以上で入力してください。" };
  if (!(monthlyRent > 0)) return { error: "想定月額家賃は正の数で入力してください。" };

  await getPropertyRepository().create({
    name,
    postalCode,
    address,
    type,
    purchasePrice,
    realEstateAcquisitionTax,
    propertyTaxSettlement,
    purchaseDate,
    monthlyRent,
    emoji: iconForType(type),
  });

  revalidatePath("/");
  revalidatePath("/properties");
  redirect("/properties");
}
