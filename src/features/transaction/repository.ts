import { mockTransactions } from "@/data/mock/transactions";
import type { Transaction } from "./types";

/**
 * 取引データへのアクセスを抽象化するリポジトリ。
 */
/** 新規登録時の入力（id は採番するため受け取らない） */
export type NewTransaction = Omit<Transaction, "id">;

export interface TransactionRepository {
  findAll(): Promise<Transaction[]>;
  findByPropertyId(propertyId: string): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<Transaction>;
}

class MockTransactionRepository implements TransactionRepository {
  async findAll(): Promise<Transaction[]> {
    return mockTransactions;
  }

  async findByPropertyId(propertyId: string): Promise<Transaction[]> {
    return mockTransactions.filter((t) => t.propertyId === propertyId);
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const transaction: Transaction = { id: `txn-${crypto.randomUUID().slice(0, 8)}`, ...input };
    mockTransactions.push(transaction);
    return transaction;
  }
}

const repository: TransactionRepository = new MockTransactionRepository();

export function getTransactionRepository(): TransactionRepository {
  return repository;
}
