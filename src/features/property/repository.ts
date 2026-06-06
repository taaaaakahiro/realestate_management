import { mockProperties } from "@/data/mock/properties";
import type { Property } from "./types";

/**
 * 物件データへのアクセスを抽象化するリポジトリ。
 * UI / サービス層はこのインターフェースにのみ依存し、
 * データソース（モック / REST / DB）の差し替えに影響されない。
 */
/** 新規登録時の入力（id は採番するため受け取らない） */
export type NewProperty = Omit<Property, "id">;

export interface PropertyRepository {
  findAll(): Promise<Property[]>;
  findById(id: string): Promise<Property | null>;
  create(input: NewProperty): Promise<Property>;
}

class MockPropertyRepository implements PropertyRepository {
  async findAll(): Promise<Property[]> {
    return mockProperties;
  }

  async findById(id: string): Promise<Property | null> {
    return mockProperties.find((p) => p.id === id) ?? null;
  }

  async create(input: NewProperty): Promise<Property> {
    const property: Property = { id: `prop-${crypto.randomUUID().slice(0, 8)}`, ...input };
    mockProperties.push(property);
    return property;
  }
}

const repository: PropertyRepository = new MockPropertyRepository();

/** 実装の取得口。将来はここで環境に応じた実装を返す。 */
export function getPropertyRepository(): PropertyRepository {
  return repository;
}
