import type {
  Party,
  Supplier,
  LedgerEntry,
  Bill,
  InventoryItem,
  InventoryTransaction,
  Purchase,
  Payment,
  Settings,
  VehicleRegister,
  VehicleRegisterRow,
  User,
  Company,
} from "./schema";
import { secureInvoke } from "@/services/auth";

let dbCache: Database | null = null;
let backendInitPromise: Promise<void> | null = null;
let tauriInvokePromise: Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> | null = null;

interface Database {
  parties: Party[];
  suppliers: Supplier[];
  ledgerEntries: LedgerEntry[];
  bills: Bill[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  purchases: Purchase[];
  payments: Payment[];
  vehicleRegisters: VehicleRegister[];
  users: User[];
  companies: Company[];
  settings: Settings;
}

// No frontend-only seeding here. Backend (Tauri) is responsible for persistent demo data.

type DbChangeListener = () => void;
const dbChangeListeners = new Set<DbChangeListener>();

function notifyDbChangeListeners(): void {
  for (const listener of dbChangeListeners) {
    try {
      listener();
    } catch {
      // Ignore listener failures so persistence is never blocked.
    }
  }
}

export function subscribeDbChanges(listener: DbChangeListener): () => void {
  dbChangeListeners.add(listener);
  return () => {
    dbChangeListeners.delete(listener);
  };
}

function createDefaultSettings(): Settings {
  return {
    businessName: "",
    businessAddress: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    gstin: "",
    commissionPercent: 0,
    taxPercent: 0,
    currency: "₹",
    billPrefix: "INV",
    purchasePrefix: "PO",
    vehiclePrefix: "VR",
    nextBillNo: 1001,
    nextPurchaseNo: 5001,
    nextVehicleEntryNo: 2001,
    language: "english",
    darkMode: false,
    lowStockAlert: true,
  };
}

function createEmptyDb(): Database {
  return {
    parties: [],
    suppliers: [],
    ledgerEntries: [],
    bills: [],
    inventoryItems: [],
    inventoryTransactions: [],
    purchases: [],
    payments: [],
    vehicleRegisters: [],
    users: [],
    companies: [],
    settings: createDefaultSettings(),
  };
}

function normalizeDb(data: Partial<Database>): Database {
  const base = createEmptyDb();
  return {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings || {}) },
  };
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function getTauriInvoke(): Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> {
  if (!isTauriRuntime()) {
    return null;
  }

  if (!tauriInvokePromise) {
    tauriInvokePromise = import("@tauri-apps/api/core")
      .then((mod) => mod.invoke)
      .catch(() => null);
  }

  return tauriInvokePromise;
}

async function loadFromBackend(): Promise<Database | null> {
  // We no longer load the entire database as a JSON blob.
  // Each module will load its own data relationaly.
  return null;
}

async function ensureBackendDatabase(): Promise<void> {
  // Database is initialized automatically by Rust main() on startup.
  // No need to call init_database from frontend anymore.
}

async function persistToBackend(db: Database): Promise<void> {
  // We no longer persist the entire database as a JSON blob.
}

export async function initializeBackendStorage(): Promise<void> {
  if (!backendInitPromise) {
    backendInitPromise = (async () => {
      // Initialize with empty cache, data will be loaded on demand
      dbCache = createEmptyDb();
    })();
  }

  await backendInitPromise;
}

function getDb(): Database {
  if (dbCache) {
    return dbCache;
  }

  return initializeDb();
}

function initializeDb(): Database {
  const db = createEmptyDb();
  saveDb(db);
  return db;
}

function saveDb(db: Database): void {
  dbCache = normalizeDb(db);
  void persistToBackend(dbCache);
  notifyDbChangeListeners();
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getPartiesByCompany(companyId: string): Party[] {
  return getDb().parties.filter((p) => p.companyId === companyId);
}

export function getParty(id: string): Party | undefined {
  return getDb().parties.find((p) => p.id === id);
}

export function createParty(
  data: Omit<Party, "id" | "createdAt" | "updatedAt">,
): Party {
  const db = getDb();
  const party: Party = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.parties.push(party);

  if (data.openingBalance !== 0) {
    const entry: LedgerEntry = {
      id: genId(),
      companyId: data.companyId,
      partyId: party.id,
      partyName: party.name,
      date: new Date().toISOString().split("T")[0],
      type: data.balanceType,
      amount: data.openingBalance,
      description: "Opening Balance",
      referenceType: "manual",
      referenceId: "",
      runningBalance: data.openingBalance,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(entry);
  }

  saveDb(db);
  return party;
}

export function updateParty(id: string, data: Partial<Party>): Party | null {
  const db = getDb();
  const idx = db.parties.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.parties[idx] = {
    ...db.parties[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.parties[idx];
}

export function deleteParty(id: string): boolean {
  const db = getDb();
  db.parties = db.parties.filter((p) => p.id !== id);
  db.ledgerEntries = db.ledgerEntries.filter((e) => e.partyId !== id);
  db.payments = db.payments.filter((p) => p.partyId !== id);
  saveDb(db);
  return true;
}

export function getSuppliersByCompany(companyId: string): Supplier[] {
  return getDb().suppliers.filter((s) => s.companyId === companyId);
}

export function getSupplier(id: string): Supplier | undefined {
  return getDb().suppliers.find((s) => s.id === id);
}

export function createSupplier(
  data: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
): Supplier {
  const db = getDb();
  const supplier: Supplier = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.suppliers.push(supplier);

  if (data.openingBalance !== 0) {
    const entry: LedgerEntry = {
      id: genId(),
      companyId: data.companyId,
      partyId: supplier.id,
      partyName: supplier.name,
      date: new Date().toISOString().split("T")[0],
      type: data.balanceType,
      amount: data.openingBalance,
      description: "Opening Balance",
      referenceType: "manual",
      referenceId: "",
      runningBalance: data.openingBalance,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(entry);
  }

  saveDb(db);
  return supplier;
}

export function updateSupplier(
  id: string,
  data: Partial<Supplier>,
): Supplier | null {
  const db = getDb();
  const idx = db.suppliers.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  db.suppliers[idx] = {
    ...db.suppliers[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.suppliers[idx];
}

export function deleteSupplier(id: string): boolean {
  const db = getDb();
  db.suppliers = db.suppliers.filter((s) => s.id !== id);
  saveDb(db);
  return true;
}

export function getLedgerEntriesByCompany(
  companyId: string,
  partyId?: string,
): LedgerEntry[] {
  const db = getDb();
  let entries = db.ledgerEntries.filter((e) => e.companyId === companyId);
  if (partyId) {
    entries = entries.filter((e) => e.partyId === partyId);
  }
  return entries;
}

export function addLedgerEntry(
  entry: Omit<LedgerEntry, "id" | "createdAt">,
): LedgerEntry {
  const db = getDb();
  const le: LedgerEntry = {
    ...entry,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  db.ledgerEntries.push(le);

  // Update running balance for all entries of this party
  const partyEntries = db.ledgerEntries
    .filter((e) => e.partyId === entry.partyId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  for (const e of partyEntries) {
    if (e.type === "debit") {
      balance += e.amount;
    } else {
      balance -= e.amount;
    }
    e.runningBalance = balance;
  }

  saveDb(db);
  return le;
}

export function getPartyBalance(
  companyId: string,
  partyId: string,
): {
  balance: number;
  type: "receivable" | "payable";
} {
  const entries = getLedgerEntriesByCompany(companyId, partyId);
  let balance = 0;
  for (const e of entries) {
    if (e.type === "debit") {
      balance += e.amount;
    } else {
      balance -= e.amount;
    }
  }
  return {
    balance: Math.abs(balance),
    type: balance >= 0 ? "receivable" : "payable",
  };
}

export function getBillsByCompany(companyId: string): Bill[] {
  return getDb().bills.filter((b) => b.companyId === companyId);
}

export function getBill(id: string): Bill | undefined {
  return getDb().bills.find((b) => b.id === id);
}

export function getNextBillNo(): string {
  const db = getDb();
  const no = db.settings.nextBillNo;
  return `${db.settings.billPrefix}-${no}`;
}

export function createBill(
  data: Omit<Bill, "id" | "billNo" | "createdAt" | "updatedAt">,
): { bill: Bill; ledgerEntry: LedgerEntry } {
  const db = getDb();
  const billNo = `${db.settings.billPrefix}-${db.settings.nextBillNo}`;
  db.settings.nextBillNo += 1;

  const previousBal = getPartyBalance(data.companyId, data.partyId);
  const prevAmount =
    previousBal.type === "receivable"
      ? previousBal.balance
      : -previousBal.balance;

  const bill: Bill = {
    ...data,
    id: genId(),
    billNo,
    previousBalance: prevAmount,
    netBalance: data.total - data.paidAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Determine status
  if (bill.paidAmount >= bill.total) {
    bill.status = "paid";
  } else if (bill.paidAmount > 0) {
    bill.status = "partial";
  } else {
    bill.status = "unpaid";
  }

  db.bills.push(bill);

  // Add ledger entry
  const ledgerEntry: LedgerEntry = {
    id: genId(),
    companyId: data.companyId,
    partyId: bill.partyId,
    partyName: bill.partyName,
    date: bill.date,
    type: "debit",
    amount: bill.total,
    description: `Sale Bill ${billNo}`,
    referenceType: "bill",
    referenceId: bill.id,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  };
  db.ledgerEntries.push(ledgerEntry);

  // If paid amount > 0, add credit entry
  if (bill.paidAmount > 0) {
    const payEntry: LedgerEntry = {
      id: genId(),
      companyId: data.companyId,
      partyId: bill.partyId,
      partyName: bill.partyName,
      date: bill.date,
      type: "credit",
      amount: bill.paidAmount,
      description: `Advance Payment for Bill ${billNo}`,
      referenceType: "payment",
      referenceId: bill.id,
      runningBalance: 0,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(payEntry);
  }

  // Update inventory (deduct stock)
  for (const item of bill.items) {
    const invItem = db.inventoryItems.find(
      (i) => i.name === item.fruitName && i.grade === item.grade,
    );
    if (invItem) {
      invItem.currentStock = Math.max(
        0,
        invItem.currentStock - item.totalWeight,
      );
      invItem.lastUpdated = new Date().toISOString();
      if (invItem.currentStock <= 0) invItem.status = "out_of_stock";
      else if (invItem.currentStock <= invItem.lowStockThreshold)
        invItem.status = "low_stock";
      else invItem.status = "in_stock";

      const txn: InventoryTransaction = {
        id: genId(),
        itemId: invItem.id,
        itemName: invItem.name,
        type: "outward",
        quantity: item.totalWeight,
        rate: item.rate,
        referenceType: "bill",
        referenceId: bill.id,
        date: bill.date,
        notes: `Sold via bill ${billNo}`,
        createdAt: new Date().toISOString(),
      };
      db.inventoryTransactions.push(txn);
    }
  }

  // Recalculate running balances
  recalculateBalances(db);
  saveDb(db);
  return { bill, ledgerEntry };
}

export function deleteBill(id: string): boolean {
  const db = getDb();
  db.bills = db.bills.filter((b) => b.id !== id);
  db.ledgerEntries = db.ledgerEntries.filter((e) => e.referenceId !== id);
  saveDb(db);
  return true;
}

export function getInventoryItemsByCompany(companyId: string): InventoryItem[] {
  return getDb().inventoryItems.filter((i) => i.companyId === companyId);
}

export function getInventoryItem(id: string): InventoryItem | undefined {
  return getDb().inventoryItems.find((i) => i.id === id);
}

export function createInventoryItem(
  data: Omit<
    InventoryItem,
    "id" | "currentStock" | "status" | "lastUpdated" | "createdAt"
  > & { currentStock: number },
): InventoryItem {
  const db = getDb();
  const status: InventoryItem["status"] =
    data.currentStock <= 0
      ? "out_of_stock"
      : data.currentStock <= data.lowStockThreshold
        ? "low_stock"
        : "in_stock";

  const item: InventoryItem = {
    ...data,
    id: genId(),
    status,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.inventoryItems.push(item);
  saveDb(db);
  return item;
}

export function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>,
): InventoryItem | null {
  const db = getDb();
  const idx = db.inventoryItems.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const updated = {
    ...db.inventoryItems[idx],
    ...data,
    lastUpdated: new Date().toISOString(),
  };
  if (updated.currentStock <= 0) updated.status = "out_of_stock";
  else if (updated.currentStock <= updated.lowStockThreshold)
    updated.status = "low_stock";
  else updated.status = "in_stock";
  db.inventoryItems[idx] = updated;
  saveDb(db);
  return updated;
}

export function addInventoryTransaction(
  data: Omit<InventoryTransaction, "id" | "createdAt">,
): InventoryTransaction {
  const db = getDb();
  const txn: InventoryTransaction = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  db.inventoryTransactions.push(txn);

  const item = db.inventoryItems.find((i) => i.id === data.itemId);
  if (item) {
    if (data.type === "inward") {
      item.currentStock += data.quantity;
    } else {
      item.currentStock = Math.max(0, item.currentStock - data.quantity);
    }
    item.lastUpdated = new Date().toISOString();
    if (item.currentStock <= 0) item.status = "out_of_stock";
    else if (item.currentStock <= item.lowStockThreshold)
      item.status = "low_stock";
    else item.status = "in_stock";
  }

  saveDb(db);
  return txn;
}

export function getInventoryTransactions(
  itemId?: string,
): InventoryTransaction[] {
  const db = getDb();
  if (itemId)
    return db.inventoryTransactions.filter((t) => t.itemId === itemId);
  return db.inventoryTransactions;
}

export function getPurchasesByCompany(companyId: string): Purchase[] {
  return getDb().purchases.filter((p) => p.companyId === companyId);
}

export function getPurchase(id: string): Purchase | undefined {
  return getDb().purchases.find((p) => p.id === id);
}

export function getNextPurchaseNo(): string {
  const db = getDb();
  const no = db.settings.nextPurchaseNo;
  return `${db.settings.purchasePrefix}-${no}`;
}

export function createPurchase(
  data: Omit<Purchase, "id" | "purchaseNo" | "createdAt" | "updatedAt">,
): { purchase: Purchase } {
  const db = getDb();
  const purchaseNo = `${db.settings.purchasePrefix}-${db.settings.nextPurchaseNo}`;
  db.settings.nextPurchaseNo += 1;

  const purchase: Purchase = {
    ...data,
    id: genId(),
    purchaseNo,
    netBalance: data.total - data.paidAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (purchase.paidAmount >= purchase.total) {
    purchase.status = "paid";
  } else if (purchase.paidAmount > 0) {
    purchase.status = "partial";
  } else {
    purchase.status = "unpaid";
  }

  db.purchases.push(purchase);

  // Ledger entry
  const ledgerEntry: LedgerEntry = {
    id: genId(),
    companyId: data.companyId,
    partyId: purchase.supplierId,
    partyName: purchase.supplierName,
    date: purchase.date,
    type: "credit",
    amount: purchase.total,
    description: `Purchase ${purchaseNo}`,
    referenceType: "purchase",
    referenceId: purchase.id,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  };
  db.ledgerEntries.push(ledgerEntry);

  if (purchase.paidAmount > 0) {
    const payEntry: LedgerEntry = {
      id: genId(),
      companyId: data.companyId,
      partyId: purchase.supplierId,
      partyName: purchase.supplierName,
      date: purchase.date,
      type: "debit",
      amount: purchase.paidAmount,
      description: `Advance Payment for Purchase ${purchaseNo}`,
      referenceType: "payment",
      referenceId: purchase.id,
      runningBalance: 0,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(payEntry);
  }

  // Increase inventory
  for (const item of purchase.items) {
    const invItem = db.inventoryItems.find(
      (i) => i.name === item.fruitName && i.grade === item.grade,
    );
    if (invItem) {
      invItem.currentStock += item.quantity;
      invItem.lastUpdated = new Date().toISOString();
      if (invItem.currentStock <= 0) invItem.status = "out_of_stock";
      else if (invItem.currentStock <= invItem.lowStockThreshold)
        invItem.status = "low_stock";
      else invItem.status = "in_stock";

      const txn: InventoryTransaction = {
        id: genId(),
        itemId: invItem.id,
        itemName: invItem.name,
        type: "inward",
        quantity: item.quantity,
        rate: item.rate,
        referenceType: "purchase",
        referenceId: purchase.id,
        date: purchase.date,
        notes: `Purchased via ${purchaseNo}`,
        createdAt: new Date().toISOString(),
      };
      db.inventoryTransactions.push(txn);
    } else {
      // Create new inventory item
      const status: InventoryItem["status"] =
        item.quantity <= 0 ? "out_of_stock" : "in_stock";
      const newItem: InventoryItem = {
        id: genId(),
        companyId: data.companyId,
        name: item.fruitName,
        grade: item.grade,
        category: "Fruits",
        currentStock: item.quantity,
        unit: item.unit || "kg",
        lowStockThreshold: 50,
        status,
        warehouse: "Main",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.inventoryItems.push(newItem);

      const txn: InventoryTransaction = {
        id: genId(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: "inward",
        quantity: item.quantity,
        rate: item.rate,
        referenceType: "purchase",
        referenceId: purchase.id,
        date: purchase.date,
        notes: `New stock via ${purchaseNo}`,
        createdAt: new Date().toISOString(),
      };
      db.inventoryTransactions.push(txn);
    }
  }

  recalculateBalances(db);
  saveDb(db);
  return { purchase };
}

export function getPaymentsByCompany(companyId: string): Payment[] {
  return getDb().payments.filter((p) => p.companyId === companyId);
}

export function getPaymentsByParty(
  companyId: string,
  partyId: string,
): Payment[] {
  return getDb().payments.filter(
    (p) => p.companyId === companyId && p.partyId === partyId,
  );
}

export function createPayment(
  data: Omit<Payment, "id" | "createdAt" | "ledgerEntryId">,
): { payment: Payment; ledgerEntry: LedgerEntry } {
  const db = getDb();
  const payment: Payment = {
    ...data,
    id: genId(),
    ledgerEntryId: "",
    createdAt: new Date().toISOString(),
  };

  const ledgerEntry: LedgerEntry = {
    id: genId(),
    companyId: data.companyId,
    partyId: payment.partyId,
    partyName: payment.partyName,
    date: payment.date,
    type: payment.type === "received" ? "credit" : "debit",
    amount: payment.amount,
    description: `${payment.type === "received" ? "Payment Received" : "Payment Made"} via ${payment.mode}`,
    referenceType: "payment",
    referenceId: payment.id,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  };

  payment.ledgerEntryId = ledgerEntry.id;
  db.payments.push(payment);
  db.ledgerEntries.push(ledgerEntry);

  if (payment.type === "received") {
    let remaining = payment.amount;
    const openBills = db.bills
      .filter((bill) => bill.partyId === payment.partyId && bill.netBalance > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const bill of openBills) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, bill.netBalance);
      bill.paidAmount += applied;
      bill.netBalance -= applied;
      bill.status = bill.netBalance <= 0 ? "paid" : "partial";
      bill.updatedAt = new Date().toISOString();
      remaining -= applied;
    }
  }

  if (payment.type === "paid") {
    let remaining = payment.amount;
    const openPurchases = db.purchases
      .filter(
        (purchase) =>
          purchase.supplierId === payment.partyId && purchase.netBalance > 0,
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const purchase of openPurchases) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, purchase.netBalance);
      purchase.paidAmount += applied;
      purchase.netBalance -= applied;
      purchase.status = purchase.netBalance <= 0 ? "paid" : "partial";
      purchase.updatedAt = new Date().toISOString();
      remaining -= applied;
    }
  }

  recalculateBalances(db);
  saveDb(db);
  return { payment, ledgerEntry };
}

export function deletePayment(id: string): boolean {
  const db = getDb();
  const payment = db.payments.find((p) => p.id === id);
  if (payment) {
    db.payments = db.payments.filter((p) => p.id !== id);
    db.ledgerEntries = db.ledgerEntries.filter(
      (e) => e.id !== payment.ledgerEntryId,
    );
    recalculateBalances(db);
    saveDb(db);
  }
  return true;
}

// Relational API for Companies
export async function getCompanies(): Promise<Company[]> {
  try {
    const companies = await secureInvoke<Company[]>("get_companies");
    if (dbCache) dbCache.companies = companies;
    return companies;
  } catch (error) {
    console.error("Failed to load companies:", error);
    return dbCache?.companies || [];
  }
}

export async function createCompany(
  data: Omit<Company, "id" | "createdAt" | "updatedAt">,
): Promise<Company> {
  try {
    const company = await secureInvoke<Company>("create_company", { data });
    if (dbCache) {
      dbCache.companies.push(company);
    }
    return company;
  } catch (error) {
    console.error("Failed to create company:", error);
    throw error;
  }
}

export async function updateCompany(data: Company): Promise<Company | null> {
  try {
    const updated = await secureInvoke<Company>("update_company", { data });
    if (dbCache) {
      const idx = dbCache.companies.findIndex((c) => c.id === updated.id);
      if (idx !== -1) dbCache.companies[idx] = updated;
    }
    return updated;
  } catch (error) {
    console.error("Failed to update company:", error);
    return null;
  }
}

export async function deleteCompany(id: string): Promise<boolean> {
  try {
    await secureInvoke("delete_company", { id });
    if (dbCache) {
      dbCache.companies = dbCache.companies.filter((c) => c.id !== id);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete company:", error);
    return false;
  }
}

// Vehicle Register API
export async function getVehicleRegistersByCompany(
  company_id: string,
): Promise<VehicleRegister[]> {
  try {
    // Note: Rust command is get_vehicle_registers and currently returns all
    // We should probably add filtering in Rust later.
    const all = await secureInvoke<VehicleRegister[]>("get_vehicle_registers");
    return all.filter((v) => v.companyId === company_id);
  } catch (error) {
    console.error("Failed to load vehicle registers:", error);
    return [];
  }
}

export async function createVehicleRegister(
  data: Omit<
    VehicleRegister,
    "id" | "entryNo" | "createdAt" | "updatedAt" | "rows"
  > & {
    rows: Omit<VehicleRegisterRow, "id" | "createdAt" | "updatedAt">[];
  },
): Promise<VehicleRegister> {
  return await secureInvoke<VehicleRegister>("create_vehicle_register", {
    input: data,
  });
}

// Legacy synchronous access for initial state (will be empty until loaded)
export function getCompaniesSync(): Company[] {
  return dbCache?.companies || [];
}

export function getSettings(): Settings {
  return dbCache?.settings || createDefaultSettings();
}

export async function loadSettings(): Promise<Settings> {
  const invoke = await getTauriInvoke();
  if (!invoke) return getSettings();
  try {
    const settings = await invoke<Settings>("get_settings");
    if (dbCache) dbCache.settings = settings;
    return settings;
  } catch {
    return getSettings();
  }
}

export function updateSettings(data: Partial<Settings>): Settings {
  if (dbCache) {
    dbCache.settings = { ...dbCache.settings, ...data };
    // In a real relational DB, we'd also save this to a settings table
    // For now, we'll keep it in cache until we implement the settings table commands
  }
  return getSettings();
}

export function exportDatabase(): string {
  return JSON.stringify(getDb(), null, 2);
}

export function importDatabase(raw: string): void {
  const parsed = normalizeDb(JSON.parse(raw) as Partial<Database>);
  saveDb(parsed);
}

export function resetDatabase(): void {
  const empty = createEmptyDb();
  saveDb(empty);
}

function recalculateBalances(db: Database): void {
  const partyIds = [...new Set(db.ledgerEntries.map((e) => e.partyId))];
  for (const partyId of partyIds) {
    const entries = db.ledgerEntries
      .filter((e) => e.partyId === partyId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    for (const e of entries) {
      if (e.type === "debit") {
        balance += e.amount;
      } else {
        balance -= e.amount;
      }
      e.runningBalance = balance;
    }
  }
}

export function getDaybook(date: string): {
  bills: Bill[];
  purchases: Purchase[];
  payments: Payment[];
  ledgerEntries: LedgerEntry[];
} {
  const db = getDb();
  return {
    bills: db.bills.filter((b) => b.date === date),
    purchases: db.purchases.filter((p) => p.date === date),
    payments: db.payments.filter((p) => p.date === date),
    ledgerEntries: db.ledgerEntries.filter((e) => e.date === date),
  };
}

export function getReportData(startDate: string, endDate: string) {
  const db = getDb();
  const bills = db.bills.filter(
    (b) => b.date >= startDate && b.date <= endDate,
  );
  const purchases = db.purchases.filter(
    (p) => p.date >= startDate && p.date <= endDate,
  );
  const payments = db.payments.filter(
    (p) => p.date >= startDate && p.date <= endDate,
  );

  const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalReceived = payments
    .filter((p) => p.type === "received")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments
    .filter((p) => p.type === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCommission = bills.reduce((sum, b) => sum + b.commission, 0);
  const totalTax = bills.reduce((sum, b) => sum + b.taxAmount, 0);

  return {
    totalSales,
    totalPurchases,
    totalReceived,
    totalPaid,
    totalCommission,
    totalTax,
    profit: totalSales - totalPurchases,
    outstandingReceivable: db.parties.reduce((sum, p) => {
      const bal = getPartyBalance(p.companyId, p.id);
      return bal.type === "receivable" ? sum + bal.balance : sum;
    }, 0),
    outstandingPayable: db.suppliers.reduce((sum, s) => {
      const bal = getPartyBalance(s.companyId, s.id);
      return bal.type === "payable" ? sum + bal.balance : sum;
    }, 0),
    vehicleRegisters: db.vehicleRegisters.length,
  };
}
