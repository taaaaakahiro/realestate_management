import type { Transaction } from "@/features/transaction/types";
import { TODAY } from "@/shared/lib/clock";
import { mockProperties } from "./properties";

/** 決定論的な擬似乱数 (mulberry32) — 再レンダリングでもチャートがブレないようにする */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * 各物件について、取得月から現在までの月次取引を生成する。
 * - 家賃収入（空室月はスキップ）
 * - 管理費（毎月）
 * - 固定資産税・火災保険（毎年）
 * - 広告料（空室明けの再客付け時）
 * - 修繕費（不定期）
 *
 * ローンの元本・利息は融資モデル(features/loan)から別途算出するため、ここでは生成しない。
 */
function generateTransactions(): Transaction[] {
  const txns: Transaction[] = [];

  mockProperties.forEach((p, pi) => {
    const rand = seeded(pi * 9973 + 7);
    const start = new Date(p.purchaseDate);
    const total = monthsBetween(start, TODAY);

    const mgmtFee = Math.round((p.monthlyRent * 0.08) / 1000) * 1000;
    let prevVacant = false;

    for (let m = 0; m <= total; m++) {
      const d = new Date(start.getFullYear(), start.getMonth() + m, 25);
      const ym = d.toISOString().slice(0, 10);
      const id = `${p.id}-${m}`;

      // 家賃収入: 約7%の確率で空室（最初の月は必ず入居）
      const vacant = m > 0 && rand() < 0.07;
      if (!vacant) {
        txns.push({
          id: `${id}-rent`,
          propertyId: p.id,
          date: ym,
          kind: "income",
          category: "家賃",
          amount: p.monthlyRent,
          memo: undefined,
        });
      }

      // 広告料: 空室明け（再客付け）の月に家賃1ヶ月分を計上
      if (!vacant && prevVacant) {
        txns.push({
          id: `${id}-ad`,
          propertyId: p.id,
          date: ym,
          kind: "expense",
          category: "広告料",
          amount: p.monthlyRent,
          memo: "客付け広告料",
        });
      }
      prevVacant = vacant;

      // 管理費
      txns.push({
        id: `${id}-mgmt`,
        propertyId: p.id,
        date: ym,
        kind: "expense",
        category: "管理費",
        amount: mgmtFee,
      });

      // 固定資産税: 毎年6月に計上
      if (d.getMonth() === 5) {
        txns.push({
          id: `${id}-tax`,
          propertyId: p.id,
          date: ym,
          kind: "expense",
          category: "固定資産税",
          amount: Math.round((p.purchasePrice * 0.011) / 1000) * 1000,
        });
      }

      // 火災保険: 取得月と同月に毎年計上
      if (m > 0 && d.getMonth() === start.getMonth()) {
        txns.push({
          id: `${id}-ins`,
          propertyId: p.id,
          date: ym,
          kind: "expense",
          category: "火災保険",
          amount: p.type === "一棟アパート" ? 48_000 : 22_000,
        });
      }

      // 修繕費: 約6%の確率で発生
      if (m > 0 && rand() < 0.06) {
        txns.push({
          id: `${id}-repair`,
          propertyId: p.id,
          date: ym,
          kind: "expense",
          category: "修繕費",
          amount: Math.round((20_000 + rand() * 180_000) / 1000) * 1000,
          memo: "設備修繕",
        });
      }

      // 礼金: 入居更新の演出として約3%
      if (m > 0 && rand() < 0.03) {
        txns.push({
          id: `${id}-renewal`,
          propertyId: p.id,
          date: ym,
          kind: "income",
          category: "更新料",
          amount: p.monthlyRent,
          memo: "契約更新",
        });
      }
    }
  });

  return txns;
}

export const mockTransactions: Transaction[] = generateTransactions();
