"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionCategory,
  type TransactionKind,
} from "./types";
import { getTransactionRepository } from "./repository";

export interface ActionState {
  error?: string;
}

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const propertyId = String(formData.get("propertyId") ?? "");
  const kind = String(formData.get("kind") ?? "") as TransactionKind;
  const category = String(formData.get("category") ?? "") as TransactionCategory;
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  const memo = String(formData.get("memo") ?? "").trim();

  if (!propertyId) return { error: "物件を選択してください。" };
  if (kind !== "income" && kind !== "expense")
    return { error: "区分を選択してください。" };

  const validCategories: TransactionCategory[] =
    kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!validCategories.includes(category))
    return { error: "科目を選択してください。" };
  if (!date) return { error: "計上日を入力してください。" };
  if (!(amount > 0)) return { error: "金額は正の数で入力してください。" };

  await getTransactionRepository().create({
    propertyId,
    kind,
    category,
    date,
    amount,
    memo: memo || undefined,
  });

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}
