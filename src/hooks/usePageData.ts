import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Utility hook for page-level data fetching
 * Loads data only when component mounts
 * Prevents redundant loads if component already subscribed
 *
 * @param loaders - Array of store loader functions to call
 * @param dependencies - Optional additional dependencies for re-fetching
 *
 * Usage:
 * usePageData([
 *   useAppStore.getState().loadParties,
 *   useAppStore.getState().loadPayments
 * ])
 */
export function usePageData(
  loaders: (() => void | Promise<void>)[],
  dependencies: unknown[] = [],
) {
  useEffect(() => {
    // Load data immediately on mount
    const loadAll = async () => {
      await Promise.all(loaders.map((loader) => loader()));
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(loaders), ...dependencies]);
}

/**
 * Optimized selector for store to avoid re-renders on unrelated changes
 * Use in pages instead of subscribing to entire store
 *
 * @param selector - Function that selects slice of state needed
 * @returns Selected state properties
 *
 * Usage:
 * const { parties, searchParties } = useAppStore(
 *   (state) => ({ parties: state.parties, searchParties: state.searchParties })
 * )
 */
// This is native to Zustand, just a reminder to use it properly

/**
 * Batch load multiple data types, useful for dashboard/reports
 * Only fetches if data is empty (prevents redundant loads)
 *
 * @param requiredData - Keys of data that must be loaded
 */
export function useBatchPageData(
  requiredData: (
    | "parties"
    | "bills"
    | "purchases"
    | "payments"
    | "inventory"
    | "ledger"
    | "vehicles"
  )[] = [],
) {
  const currentCompanyId = useAppStore((state) => state.currentCompanyId);

  useEffect(() => {
    const state = useAppStore.getState();
    const loaders = [];

    // Only load if data is empty - prevents redundant fetches
    if (requiredData.includes("parties") && state.parties.length === 0) {
      loaders.push(() => state.loadParties());
    }
    if (requiredData.includes("bills") && state.bills.length === 0) {
      loaders.push(() => state.loadBills());
    }
    if (requiredData.includes("purchases") && state.purchases.length === 0) {
      loaders.push(() => state.loadPurchases());
    }
    if (requiredData.includes("payments") && state.payments.length === 0) {
      loaders.push(() => state.loadPayments());
    }
    if (
      requiredData.includes("inventory") &&
      state.inventoryItems.length === 0
    ) {
      loaders.push(() => state.loadInventory());
    }
    if (requiredData.includes("ledger") && state.ledgerEntries.length === 0) {
      loaders.push(() => state.loadLedgerEntries());
    }
    if (
      requiredData.includes("vehicles") &&
      state.vehicleRegisters.length === 0
    ) {
      loaders.push(() => state.loadVehicleRegisters());
    }

    // Load all required data in parallel
    Promise.all(loaders.map((loader) => loader()));
  }, [JSON.stringify(requiredData), currentCompanyId]);
}
