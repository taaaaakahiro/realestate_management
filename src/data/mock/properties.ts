import type { Property } from "@/features/property/types";

/** モック物件データ。実DB導入時はこのファイルを差し替えるだけでよい。 */
export const mockProperties: Property[] = [
  {
    id: "prop-001",
    name: "グランドメゾン新宿",
    postalCode: "1600023",
    address: "東京都新宿区西新宿7-1-1",
    type: "区分マンション",
    purchasePrice: 28_000_000,
    realEstateAcquisitionTax: 420_000,
    propertyTaxSettlement: 95_000,
    purchaseDate: "2023-01-15",
    monthlyRent: 138_000,
    emoji: "🏙️",
  },
  {
    id: "prop-002",
    name: "サンライズ横浜アパート",
    postalCode: "2220037",
    address: "神奈川県横浜市港北区大倉山3-2-5",
    type: "一棟アパート",
    purchasePrice: 62_000_000,
    realEstateAcquisitionTax: 1_240_000,
    propertyTaxSettlement: 180_000,
    purchaseDate: "2022-06-01",
    monthlyRent: 520_000,
    emoji: "🏘️",
  },
  {
    id: "prop-003",
    name: "緑が丘戸建て",
    postalCode: "2770084",
    address: "千葉県柏市緑が丘12-4",
    type: "戸建て",
    purchasePrice: 18_500_000,
    realEstateAcquisitionTax: 280_000,
    propertyTaxSettlement: 62_000,
    purchaseDate: "2024-03-20",
    monthlyRent: 105_000,
    emoji: "🏡",
  },
];
