"use client";

import { useSyncExternalStore } from "react";
import { mockProperties } from "./mock/properties";
import { mockTransactions } from "./mock/transactions";
import { mockLoans } from "./mock/loans";
import type { Property } from "@/features/property/types";
import type { Transaction } from "@/features/transaction/types";
import type { Loan, RatePeriod } from "@/features/loan/types";

/**
 * クライアント側データストア（localStorage 永続化）。
 *
 * GitHub Pages は静的ホスティングのためサーバーDBを持てない。
 * そこでモックデータをシードとして localStorage に保存し、
 * 物件・収支の登録はブラウザ内に永続化する。
 *
 * 静的書き出し時（SSR相当）は SEED を返し、クライアント初回マウント後に
 * localStorage の内容へ差し替える（ハイドレーション不整合を避ける）。
 */

export interface StoreData {
  properties: Property[];
  transactions: Transaction[];
  loans: Loan[];
}

// スキーマ変更時はバージョンを上げて古い localStorage を無効化する
const KEY = "realestate-store-v2";

/** ビルド時／初回レンダリングで使う不変のシード */
const SEED: StoreData = {
  properties: mockProperties,
  transactions: mockTransactions,
  loans: mockLoans,
};

let state: StoreData = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 容量超過等は無視（デモ用途）
  }
}

/** 初回クライアントアクセス時に localStorage から読み込む */
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw) as StoreData;
    } else {
      persist();
    }
  } catch {
    // 破損時はシードのまま
  }
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // subscribe は React の effect フェーズで呼ばれるため、ここで安全に読み込める
  hydrate();
  return () => listeners.delete(cb);
}

function getSnapshot(): StoreData {
  return state;
}

function getServerSnapshot(): StoreData {
  return SEED;
}

function genId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(performance.now()).toString(36);
  return `${prefix}-${rand}`;
}

export function addProperty(input: Omit<Property, "id">): Property {
  const property: Property = { id: genId("prop"), ...input };
  state = { ...state, properties: [...state.properties, property] };
  persist();
  emit();
  return property;
}

export function addTransaction(input: Omit<Transaction, "id">): Transaction {
  const transaction: Transaction = { id: genId("txn"), ...input };
  state = { ...state, transactions: [...state.transactions, transaction] };
  persist();
  emit();
  return transaction;
}

/** 物件に紐づく融資を登録（1物件1融資。既存があれば置き換え） */
export function addLoan(loan: Loan): Loan {
  const loans = [...state.loans.filter((l) => l.propertyId !== loan.propertyId), loan];
  state = { ...state, loans };
  persist();
  emit();
  return loan;
}

/** 既存融資に金利変更（適用開始日付き）を追加する */
export function addRatePeriod(propertyId: string, period: RatePeriod): void {
  state = {
    ...state,
    loans: state.loans.map((l) =>
      l.propertyId === propertyId
        ? {
            ...l,
            ratePeriods: [...l.ratePeriods, period].sort((a, b) =>
              a.from.localeCompare(b.from),
            ),
          }
        : l,
    ),
  };
  persist();
  emit();
}

/** 全データを購読する Hook。マウント後に localStorage へ差し替わる。 */
export function useStore(): StoreData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
