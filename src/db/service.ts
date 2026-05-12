import * as db from './db';
import type {
  InventoryItem,
  LedgerEntry,
  Party,
  Payment,
  Supplier,
  VehicleRegister,
} from './schema';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unexpected database error';
}

export function runMutation<T>(mutation: () => T): MutationResult<T> {
  try {
    return { ok: true, data: mutation() };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export const dbQuery = {
  parties(): Party[] {
    return db.getParties();
  },
  suppliers(): Supplier[] {
    return db.getSuppliers();
  },
  payments(): Payment[] {
    return db.getPayments();
  },
  inventory(): InventoryItem[] {
    return db.getInventoryItems();
  },
  ledger(partyId?: string): LedgerEntry[] {
    return db.getLedgerEntries(partyId);
  },
  vehicles(): VehicleRegister[] {
    return db.getVehicleRegisters();
  },
};

export function subscribeToDataChanges(listener: () => void): () => void {
  return db.subscribeDbChanges(listener);
}
