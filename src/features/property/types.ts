/** 物件ドメインの型定義 */

export type PropertyType = "区分マンション" | "一棟アパート" | "戸建て";

export const PROPERTY_TYPES: PropertyType[] = ["区分マンション", "一棟アパート", "戸建て"];

/** 物件のライフサイクル状態 */
export type PropertyStatus = "prospect" | "owned" | "sold";

export const PROPERTY_STATUSES: PropertyStatus[] = ["prospect", "owned", "sold"];

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  prospect: "取得前",
  owned: "保有中",
  sold: "売却済み",
};

/** ポートフォリオ（回収率集計）の対象は「保有中」のみ */
export function isInPortfolio(p: Pick<Property, "status">): boolean {
  return p.status === "owned";
}

export interface Property {
  id: string;
  name: string;
  /** ライフサイクル状態（取得前 / 保有中 / 売却済み） */
  status: PropertyStatus;
  /** 郵便番号（ハイフンなし7桁） */
  postalCode: string;
  address: string;
  type: PropertyType;
  /** 物件価格 */
  purchasePrice: number;
  /** 不動産取得税（取得時の原価に含む） */
  realEstateAcquisitionTax: number;
  /** 固定資産税清算金（取得時の原価に含む） */
  propertyTaxSettlement: number;
  /** 取得日 (ISO 8601) */
  purchaseDate: string;
  /** 想定月額家賃 */
  monthlyRent: number;
  /** カード表示用の絵文字アイコン（種別から自動採番） */
  emoji: string;
}

/** 物件種別に対応する表示アイコンを返す */
export function iconForType(type: PropertyType): string {
  switch (type) {
    case "区分マンション":
      return "🏙️";
    case "一棟アパート":
      return "🏘️";
    case "戸建て":
      return "🏡";
  }
}

/** 郵便番号を 123-4567 形式に整形する */
export function formatPostalCode(code: string): string {
  const digits = code.replace(/[^0-9]/g, "");
  return digits.length === 7 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : code;
}

/** 取得原価 = 物件価格 + 不動産取得税 + 固定資産税清算金 */
export function acquisitionCost(p: Property): number {
  return p.purchasePrice + p.realEstateAcquisitionTax + p.propertyTaxSettlement;
}
