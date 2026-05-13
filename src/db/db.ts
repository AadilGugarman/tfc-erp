import type {
  Party,
  Supplier,
  LedgerEntry,
  Bill,
  BillItem,
  InventoryItem,
  InventoryTransaction,
  Purchase,
  PurchaseItem,
  Payment,
  Settings,
  VehicleRegister,
  VehicleRegisterRow,
  User,
  Company,
} from "./schema";

const STORAGE_KEY = "fruit_market_erp_db";

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

function readLocalDb(): Database | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return normalizeDb(JSON.parse(data));
    }
  } catch {
    return null;
  }
  return null;
}

function getOrCreateLocalDb(): Database {
  return readLocalDb() || createEmptyDb();
}

function writeLocalDb(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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
  const invoke = await getTauriInvoke();
  if (!invoke) {
    return null;
  }

  try {
    const payload = await invoke("load_app_state");
    if (!payload || typeof payload !== "string") {
      return null;
    }
    return normalizeDb(JSON.parse(payload));
  } catch {
    return null;
  }
}

async function persistToBackend(db: Database): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) {
    return;
  }

  try {
    await invoke("save_app_state", { data: JSON.stringify(db) });
  } catch {
    return;
  }
}

export async function initializeBackendStorage(): Promise<void> {
  if (!backendInitPromise) {
    backendInitPromise = (async () => {
      const localDb = getOrCreateLocalDb();
      const backendDb = await loadFromBackend();
      dbCache = backendDb || localDb;
      writeLocalDb(dbCache);

      if (!backendDb) {
        await persistToBackend(dbCache);
      }
    })();
  }

  await backendInitPromise;
}

function getDb(): Database {
  if (dbCache) {
    return dbCache;
  }

  const localDb = readLocalDb();
  if (localDb) {
    dbCache = localDb;
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
  writeLocalDb(dbCache);
  void persistToBackend(dbCache);
  notifyDbChangeListeners();
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getParties(): Party[] {
  return getDb().parties;
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

export function getSuppliers(): Supplier[] {
  return getDb().suppliers;
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

export function getVehicleRegisters(): VehicleRegister[] {
  return getDb().vehicleRegisters;
}

export function getVehicleRegister(id: string): VehicleRegister | undefined {
  return getDb().vehicleRegisters.find((register) => register.id === id);
}

export function getNextVehicleEntryNo(): string {
  const db = getDb();
  return `${db.settings.vehiclePrefix}-${db.settings.nextVehicleEntryNo}`;
}

export function createVehicleRegister(
  data: Omit<
    VehicleRegister,
    | "id"
    | "entryNo"
    | "totalRows"
    | "totalWeight"
    | "grandTotal"
    | "createdAt"
    | "updatedAt"
  > & {
    rows: Array<
      Omit<VehicleRegisterRow, "id" | "createdAt" | "updatedAt" | "total">
    >;
  },
): VehicleRegister {
  const db = getDb();
  const entryNo = `${db.settings.vehiclePrefix}-${db.settings.nextVehicleEntryNo}`;
  db.settings.nextVehicleEntryNo += 1;

  const rows: VehicleRegisterRow[] = data.rows.map((row) => {
    const baseAmount =
      Math.max(0, row.carat || 0) *
      Math.max(0, row.weight || 0) *
      Math.max(0, row.rate || 0);
    const total = Number(
      (
        baseAmount +
        Math.max(0, row.commission || 0) +
        Math.max(0, row.hamali || 0)
      ).toFixed(2),
    );
    return {
      ...row,
      id: genId(),
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const totalRows = rows.length;
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  const register: VehicleRegister = {
    ...data,
    id: genId(),
    entryNo,
    rows,
    totalRows,
    totalWeight,
    grandTotal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.vehicleRegisters.unshift(register);

  rows.forEach((row) => {
    if (row.partyId && row.total > 0) {
      db.ledgerEntries.push({
        id: genId(),
        partyId: row.partyId,
        partyName: row.partyName,
        date: register.date,
        type: "debit",
        amount: row.total,
        description: `Vehicle Arrival Register ${register.entryNo}`,
        referenceType: "vehicle_register",
        referenceId: register.id,
        runningBalance: 0,
        createdAt: new Date().toISOString(),
      });
    }

    const inventoryItem = row.inventoryItemId
      ? db.inventoryItems.find((item) => item.id === row.inventoryItemId)
      : db.inventoryItems.find(
          (item) =>
            item.name.trim().toLowerCase() ===
            row.fruitName.trim().toLowerCase(),
        );

    if (inventoryItem && row.weight > 0) {
      inventoryItem.currentStock += row.weight;
      inventoryItem.lastUpdated = new Date().toISOString();
      if (inventoryItem.currentStock <= 0)
        inventoryItem.status = "out_of_stock";
      else if (inventoryItem.currentStock <= inventoryItem.lowStockThreshold)
        inventoryItem.status = "low_stock";
      else inventoryItem.status = "in_stock";

      db.inventoryTransactions.push({
        id: genId(),
        itemId: inventoryItem.id,
        itemName: inventoryItem.name,
        type: "inward",
        quantity: row.weight,
        rate: row.rate,
        referenceType: "vehicle_register",
        referenceId: register.id,
        date: register.date,
        notes: `Vehicle Arrival Register ${register.entryNo}`,
        createdAt: new Date().toISOString(),
      });
    }

    if (!inventoryItem && row.weight > 0 && row.fruitName.trim()) {
      const newItem: InventoryItem = {
        id: genId(),
        name: row.fruitName,
        grade: "A",
        category: "Fruits",
        currentStock: row.weight,
        unit: "kg",
        lowStockThreshold: 50,
        status: "in_stock",
        warehouse: "Main",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.inventoryItems.push(newItem);
      db.inventoryTransactions.push({
        id: genId(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: "inward",
        quantity: row.weight,
        rate: row.rate,
        referenceType: "vehicle_register",
        referenceId: register.id,
        date: register.date,
        notes: `Vehicle Arrival Register ${register.entryNo}`,
        createdAt: new Date().toISOString(),
      });
    }
  });

  recalculateBalances(db);
  saveDb(db);
  return register;
}

export function updateVehicleRegister(
  id: string,
  data: Partial<VehicleRegister>,
): VehicleRegister | null {
  const db = getDb();
  const idx = db.vehicleRegisters.findIndex((register) => register.id === id);
  if (idx === -1) return null;
  db.vehicleRegisters[idx] = {
    ...db.vehicleRegisters[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.vehicleRegisters[idx];
}

export function deleteVehicleRegister(id: string): boolean {
  const db = getDb();
  const transactions = db.inventoryTransactions.filter(
    (transaction) =>
      transaction.referenceId === id &&
      transaction.referenceType === "vehicle_register",
  );

  for (const transaction of transactions) {
    const item = db.inventoryItems.find(
      (inventoryItem) => inventoryItem.id === transaction.itemId,
    );
    if (!item) continue;
    if (transaction.type === "inward") {
      item.currentStock = Math.max(0, item.currentStock - transaction.quantity);
    } else {
      item.currentStock += transaction.quantity;
    }
    item.lastUpdated = new Date().toISOString();
    if (item.currentStock <= 0) item.status = "out_of_stock";
    else if (item.currentStock <= item.lowStockThreshold)
      item.status = "low_stock";
    else item.status = "in_stock";
  }

  db.vehicleRegisters = db.vehicleRegisters.filter(
    (register) => register.id !== id,
  );
  db.ledgerEntries = db.ledgerEntries.filter(
    (entry) =>
      !(entry.referenceId === id && entry.referenceType === "vehicle_register"),
  );
  db.inventoryTransactions = db.inventoryTransactions.filter(
    (transaction) =>
      !(
        transaction.referenceId === id &&
        transaction.referenceType === "vehicle_register"
      ),
  );
  recalculateBalances(db);
  saveDb(db);
  return true;
}

export function getLedgerEntries(partyId?: string): LedgerEntry[] {
  const db = getDb();
  if (partyId) {
    return db.ledgerEntries.filter((e) => e.partyId === partyId);
  }
  return db.ledgerEntries;
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

export function getPartyBalance(partyId: string): {
  balance: number;
  type: "receivable" | "payable";
} {
  const entries = getLedgerEntries(partyId);
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

export function getBills(): Bill[] {
  return getDb().bills;
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

  const previousBal = getPartyBalance(data.partyId);
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

export function getInventoryItems(): InventoryItem[] {
  return getDb().inventoryItems;
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

export function getPurchases(): Purchase[] {
  return getDb().purchases;
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

export function getPayments(): Payment[] {
  return getDb().payments;
}

export function getPaymentsByParty(partyId: string): Payment[] {
  return getDb().payments.filter((p) => p.partyId === partyId);
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

// ============ Company Management ============

export function getCompanies(): Company[] {
  return getDb().companies;
}

export function getCompany(id: string): Company | undefined {
  return getDb().companies.find((c) => c.id === id);
}

export function createCompany(
  data: Omit<Company, "id" | "createdAt" | "updatedAt">,
): Company {
  const db = getDb();
  const company: Company = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.companies.push(company);
  saveDb(db);
  return company;
}

export function updateCompany(
  id: string,
  data: Partial<Company>,
): Company | null {
  const db = getDb();
  const idx = db.companies.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  db.companies[idx] = {
    ...db.companies[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.companies[idx];
}

export function deleteCompany(id: string): boolean {
  const db = getDb();
  db.companies = db.companies.filter((c) => c.id !== id);
  saveDb(db);
  return true;
}

export function getSettings(): Settings {
  return getDb().settings;
}

export function updateSettings(data: Partial<Settings>): Settings {
  const db = getDb();
  db.settings = { ...db.settings, ...data };
  saveDb(db);
  return db.settings;
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
      const bal = getPartyBalance(p.id);
      return bal.type === "receivable" ? sum + bal.balance : sum;
    }, 0),
    outstandingPayable: db.suppliers.reduce((sum, s) => {
      const bal = getPartyBalance(s.id);
      return bal.type === "payable" ? sum + bal.balance : sum;
    }, 0),
    vehicleRegisters: db.vehicleRegisters.length,
  };
}

export function seedDemoData() {
  /**
   * Seeds demo data for development and testing purposes.
   *
   * WARNING: This function populates the database with sample data and should ONLY be used:
   * - During development and testing
   * - For demonstration purposes
   * - With explicit user consent
   *
   * In production, this should NOT be called automatically.
   * All data created by this function is stored in SQLite and persisted locally.
   * Use the "Reset All Data" button in Settings to clear demo data if needed.
   *
   * This function:
   * 1. Creates sample parties (customers/commission agents)
   * 2. Creates sample suppliers
   * 3. Creates sample inventory items (fruits, vegetables)
   * 4. Creates sample vehicle register entries
   * 5. Creates opening balance ledger entries
   *
   * Data includes realistic examples for a fruit market commission business in Gujarat (ગુજરાત).
   */
  const db = getDb();
  if (db.parties.length > 0) return;

  // Demo parties
  const parties: Party[] = [
    {
      id: genId(),
      name: "રાજેશ પટેલ",
      phone: "9876543210",
      email: "rajesh@email.com",
      gstin: "24AAACP1234F1Z5",
      address: "12, માર્કેટ યાર્ડ",
      city: "અમદાવાદ",
      state: "ગુજરાત",
      openingBalance: 15000,
      balanceType: "debit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSupplier: false,
      commissionPercent: 3,
      notes: "Regular buyer",
    },
    {
      id: genId(),
      name: "સુરેશ શાહ",
      phone: "9876543211",
      email: "suresh@email.com",
      gstin: "",
      address: "45, ફળ માર્કેટ",
      city: "સુરત",
      state: "ગુજરાત",
      openingBalance: 8000,
      balanceType: "debit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSupplier: false,
      commissionPercent: 3,
      notes: "",
    },
    {
      id: genId(),
      name: "મહેશ કુમાર",
      phone: "9876543212",
      email: "",
      gstin: "24BBBCK5678G2Z3",
      address: "78, APMC યાર્ડ",
      city: "વડોદરા",
      state: "ગુજરાત",
      openingBalance: 0,
      balanceType: "debit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSupplier: false,
      commissionPercent: 2.5,
      notes: "New customer",
    },
  ];

  // Demo suppliers
  const suppliers: Supplier[] = [
    {
      id: genId(),
      name: "ગોપાલ ફાર્મ",
      phone: "9876543213",
      email: "gopal@farm.com",
      address: "નાસિક, મહારાષ્ટ્ર",
      city: "નાસિક",
      state: "મહારાષ્ટ્ર",
      openingBalance: 5000,
      balanceType: "credit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commissionPercent: 3,
      notes: "Grape supplier",
    },
    {
      id: genId(),
      name: "કેરલ ફ્રુટ્સ",
      phone: "9876543214",
      email: "",
      address: "કોચિન, કેરલ",
      city: "કોચિન",
      state: "કેરલ",
      openingBalance: 0,
      balanceType: "credit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commissionPercent: 3,
      notes: "Banana & coconut",
    },
  ];

  // Demo inventory
  const invItems: InventoryItem[] = [
    {
      id: genId(),
      name: "કેળા",
      grade: "A",
      category: "Fruits",
      currentStock: 500,
      unit: "kg",
      lowStockThreshold: 100,
      status: "in_stock",
      warehouse: "Main",
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: genId(),
      name: "સફરજન",
      grade: "Premium",
      category: "Fruits",
      currentStock: 200,
      unit: "kg",
      lowStockThreshold: 50,
      status: "in_stock",
      warehouse: "Main",
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: genId(),
      name: "દ્રાક્ષ",
      grade: "A+",
      category: "Fruits",
      currentStock: 150,
      unit: "kg",
      lowStockThreshold: 30,
      status: "in_stock",
      warehouse: "Main",
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: genId(),
      name: "નારંગી",
      grade: "A",
      category: "Fruits",
      currentStock: 80,
      unit: "kg",
      lowStockThreshold: 100,
      status: "low_stock",
      warehouse: "Main",
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: genId(),
      name: "નારીયેળ",
      grade: "Standard",
      category: "Fruits",
      currentStock: 0,
      unit: "pcs",
      lowStockThreshold: 20,
      status: "out_of_stock",
      warehouse: "Main",
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  db.parties = parties;
  db.suppliers = suppliers;
  db.inventoryItems = invItems;

  db.vehicleRegisters = [
    {
      id: genId(),
      entryNo: `${db.settings.vehiclePrefix}-${db.settings.nextVehicleEntryNo}`,
      date: new Date().toISOString().split("T")[0],
      vehicleNumber: "GJ-01-Z-4821",
      driverName: "ભરતભાઈ",
      brokerName: "મહેશભાઈ",
      arrivalTime: "09:15",
      status: "posted",
      rows: [
        {
          id: genId(),
          lotNo: "L-01",
          partyName: parties[0].name,
          partyId: parties[0].id,
          fruitName: invItems[0].name,
          vakkal: "Fresh Banana",
          boxes: 12,
          carat: 2,
          weight: 48,
          rate: 18,
          commission: 0,
          hamali: 0,
          total: 1728,
          remarks: "Morning lot",
          inventoryItemId: invItems[0].id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      totalRows: 1,
      totalWeight: 48,
      grandTotal: 1728,
      pendingAmount: 0,
      outstandingBalance: 1728,
      notes: "Demo vehicle register",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Seed ledger entries for parties
  for (const p of parties) {
    if (p.openingBalance > 0) {
      db.ledgerEntries.push({
        id: genId(),
        partyId: p.id,
        partyName: p.name,
        date: new Date().toISOString().split("T")[0],
        type: p.balanceType,
        amount: p.openingBalance,
        description: "Opening Balance",
        referenceType: "manual",
        referenceId: "",
        runningBalance: p.openingBalance,
        createdAt: new Date().toISOString(),
      });
    }
  }

  saveDb(db);
}

/**
 * ============================================
 * Company-Filtered Query Methods
 * ============================================
 * These methods filter data by companyId for multi-company support
 */

export function getPartiesByCompany(companyId: string): Party[] {
  return getDb().parties.filter((p) => p.companyId === companyId);
}

export function getSuppliersByCompany(companyId: string): Supplier[] {
  return getDb().suppliers.filter((s) => s.companyId === companyId);
}

export function getBillsByCompany(companyId: string): Bill[] {
  return getDb().bills.filter((b) => b.companyId === companyId);
}

export function getPurchasesByCompany(companyId: string): Purchase[] {
  return getDb().purchases.filter((p) => p.companyId === companyId);
}

export function getPaymentsByCompany(companyId: string): Payment[] {
  return getDb().payments.filter((p) => p.companyId === companyId);
}

export function getInventoryByCompany(companyId: string): InventoryItem[] {
  return getDb().inventoryItems.filter((i) => i.companyId === companyId);
}

export function getLedgerEntriesByCompany(companyId: string): LedgerEntry[] {
  return getDb().ledgerEntries.filter((l) => l.companyId === companyId);
}

export function getVehicleRegistersByCompany(
  companyId: string,
): VehicleRegister[] {
  return getDb().vehicleRegisters.filter((v) => v.companyId === companyId);
}

export function seedRealisticTestData() {
  /**
   * Seeds comprehensive realistic test data (20+ records per module).
   * Designed for production-like testing, search/filter verification, and report testing.
   *
   * Data includes:
   * - 20 parties (customers/commission agents) with varied profiles
   * - 20 suppliers (fruit vendors) with realistic details
   * - 20+ inventory items (fruits/vegetables with multiple grades)
   * - 20 bills (sales invoices with various statuses)
   * - 20 purchases (purchase orders with varied suppliers)
   * - 20 payments (received and paid)
   * - 20 vehicle registers (fruit arrivals)
   * - 2 companies for multi-entity testing
   *
   * All relationships, foreign keys, and ledger entries are properly linked.
   * Use this to test UI display, calculations, searches, filters, and reports.
   */
  const db = getDb();

  // Check if already seeded
  if (db.parties.length >= 10) return;

  // ============ PARTIES (20 records) ============
  const partyNames = [
    "રાજેશ પટેલ",
    "સુરેશ શાહ",
    "મહેશ કુમાર",
    "અમીતભાઈ મેહતા",
    "વિનોદ ખાનોલકર",
    "આર.કે. સિંહ",
    "જગદીશ ચૌધરી",
    "નવીન દેશપાંડે",
    "અમરીશ પરમાર",
    "હર્ષદ મહાલીપ",
    "રોશન ગુપ્તા",
    "આબીર રાજપુત",
    "ચેતન શર્મા",
    "દિપક પાટીલ",
    "ધીરેશ ત્રિવેદી",
    "ફરહાન શેખ",
    "ગોપાલ ધલવાલ",
    "હેમંત જાધવ",
    "ઇશ્વર પ્રસાદ",
    "જયશ્રી કલમટે",
  ];

  const phones = [
    "9876543210",
    "9123456789",
    "8765432109",
    "9988776655",
    "8844556677",
    "9555443322",
    "9111222333",
    "8799887766",
    "9322114455",
    "8866554433",
    "9477665544",
    "8955443322",
    "9688774455",
    "8844663355",
    "9522113344",
    "8877665544",
    "9433221100",
    "8899776655",
    "9611223344",
    "8822993344",
  ];

  const cities = [
    "અમદાવાદ",
    "વલસાડ",
    "સુરત",
    "રાજકોટ",
    "ભાવનગર",
    "જુનાગઢ",
    "ગાંધીનગર",
    "પાટણ",
  ];

  const parties: Party[] = partyNames.map((name, idx) => ({
    id: genId(),
    name,
    phone: phones[idx],
    email: `${name.replace(/\s+/g, "").toLowerCase()}@gmail.com`,
    gstin: `24AABCU${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    address: `${Math.floor(Math.random() * 500) + 1}, માર્કેટ યાર્ડ`,
    city: cities[Math.floor(Math.random() * cities.length)],
    state: "ગુજરાત",
    openingBalance: Math.floor(Math.random() * 50000) + 10000,
    balanceType: Math.random() > 0.5 ? "debit" : "credit",
    commissionPercent: 2.5,
    notes: "Commission agent",
    createdAt: new Date(
      2025,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    ).toISOString(),
    updatedAt: new Date().toISOString(),
    isSupplier: false,
  }));

  // ============ SUPPLIERS (20 records) ============
  const supplierNames = [
    "ગોપાલ ફાર્મ",
    "કેરલ ફ્રુટ્સ",
    "તાજા સોતર",
    "ગુણવત્તા આયાત",
    "ફ્રેશ ફર્વાણો",
    "દક્ષિણ બાગ",
    "ઓર્ગેનિક ખેતર",
    "કૃષક ગલ્પો",
    "રાજ ખેતર",
    "સુનહરી ફળ",
    "ઝાડ ઉત્પાદક",
    "બીજ ટોપ",
    "હરિતવર્ણ બીજ",
    "પ્રાકૃતિક સોતો",
    "વન ફળ",
    "શીર્ષ ઉત્પાદક",
    "પીક ફર્માર",
    "સુસ્વાદુ ફળ",
    "ધરતી ચુંબન",
    "પ્રથમ પિક",
  ];

  const suppliers: Supplier[] = supplierNames.map((name, idx) => ({
    id: genId(),
    name,
    phone: phones[(idx + 5) % phones.length],
    email: `${name.replace(/\s+/g, "").toLowerCase()}@gmail.com`,
    gstin: `24AABCS${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    address: `${Math.floor(Math.random() * 500) + 1}, ખેતર રોડ`,
    city: cities[Math.floor(Math.random() * cities.length)],
    state: "ગુજરાત",
    openingBalance: Math.floor(Math.random() * 75000) + 20000,
    balanceType: Math.random() > 0.5 ? "debit" : "credit",
    commissionPercent: 0,
    notes: "Fruit supplier",
    createdAt: new Date(
      2025,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    ).toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // ============ INVENTORY ITEMS (25+ records) ============
  const fruits = [
    "કેળા",
    "સફરજન",
    "દ્રાક્ષ",
    "નારંગી",
    "નર્યેળ",
    "કીવી",
    "અમરૂદ",
    "ખરબૂજો",
    "તરબૂચ",
    "આમ",
    "લીંબુ",
    "સ્ટ્રોબેરી",
    "પપૈયો",
    "દરમેણો",
    "પેશન ફ્રુટ",
  ];

  const grades = ["A", "B", "C"];
  const inventoryItems: InventoryItem[] = [];

  for (const fruit of fruits) {
    for (const grade of grades) {
      inventoryItems.push({
        id: genId(),
        name: fruit,
        grade,
        category: "Fruits",
        currentStock: Math.floor(Math.random() * 500) + 50,
        unit: "kg",
        lowStockThreshold: 100,
        status: "in_stock",
        warehouse: "Main",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.parties = parties;
  db.suppliers = suppliers;
  db.inventoryItems = inventoryItems;

  // ============ COMPANIES (2 records) ============
  const companies: Company[] = [
    {
      id: genId(),
      name: "TFC Billing મુખ્ય",
      address: "123, આર્જે પ્લાજા",
      city: "અમદાવાદ",
      state: "ગુજરાત",
      phone: "9876543210",
      email: "main@tfcbilling.com",
      gstin: "24AABCT1234F1Z5",
      invoicePrefix: "INV",
      language: "gujarati",
      theme: "light",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: genId(),
      name: "TFC બ્રાંચ - સુરત",
      address: "456, કમર્શિયલ પ્લાજા",
      city: "સુરત",
      state: "ગુજરાત",
      phone: "9988776655",
      email: "surat@tfcbilling.com",
      gstin: "24AABCT5678F1Z5",
      invoicePrefix: "SR",
      language: "gujarati",
      theme: "light",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  db.companies = companies;

  // ============ BILLS (20 records) ============
  for (let i = 0; i < 20; i++) {
    const party = parties[Math.floor(Math.random() * parties.length)];
    const date = new Date(2026, 3, Math.floor(Math.random() * 13) + 1);
    const dateStr = date.toISOString().split("T")[0];

    const items: Omit<BillItem, "id">[] = [];
    const itemCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < itemCount; j++) {
      const item =
        inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
      const boxCount = Math.floor(Math.random() * 10) + 1;
      const weightPerBox = Math.floor(Math.random() * 30) + 20;
      const totalWeight = boxCount * weightPerBox;
      const rate = Math.floor(Math.random() * 50) + 20;

      items.push({
        fruitName: item.name,
        grade: item.grade,
        boxCount,
        weightPerBox,
        totalWeight,
        rate,
        amount: totalWeight * rate,
        lotNo: `L-${i}-${j}`,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const commission = Math.floor(
      (subtotal * db.settings.commissionPercent) / 100,
    );
    const taxPercent = db.settings.taxPercent;
    const taxAmount = Math.floor((subtotal * taxPercent) / 100);
    const total = subtotal + commission + taxAmount;
    const paidAmount =
      Math.random() > 0.4 ? Math.floor(total * (Math.random() * 0.8 + 0.2)) : 0;

    createBill({
      date: dateStr,
      partyId: party.id,
      partyName: party.name,
      items: items.map((item) => ({ ...item, id: genId() })),
      subtotal,
      commission,
      taxAmount,
      taxPercent,
      total,
      paidAmount,
      previousBalance: party.openingBalance,
      netBalance: total - paidAmount,
      status:
        paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
      notes: "Sale transaction",
    });
  }

  // ============ PURCHASES (20 records) ============
  for (let i = 0; i < 20; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const date = new Date(2026, 3, Math.floor(Math.random() * 13) + 1);
    const dateStr = date.toISOString().split("T")[0];

    const items: Omit<PurchaseItem, "id">[] = [];
    const itemCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < itemCount; j++) {
      const item =
        inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
      const quantity = Math.floor(Math.random() * 300) + 100;
      const rate = Math.floor(Math.random() * 30) + 10;

      items.push({
        fruitName: item.name,
        grade: item.grade,
        quantity,
        rate,
        unit: "kg",
        amount: quantity * rate,
        lotNo: `L-${i}-${j}`,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = Math.floor((subtotal * 5) / 100);
    const total = subtotal + taxAmount;
    const paidAmount =
      Math.random() > 0.4 ? Math.floor(total * (Math.random() * 0.7 + 0.2)) : 0;

    createPurchase({
      date: dateStr,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: items.map((item) => ({ ...item, id: genId() })),
      subtotal,
      taxAmount,
      total,
      paidAmount,
      netBalance: total - paidAmount,
      status:
        paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
      notes: "Purchase transaction",
    });
  }

  // ============ PAYMENTS (20 records) ============
  const paymentParties = [...parties.slice(0, 10), ...suppliers.slice(0, 10)];
  for (let i = 0; i < 20; i++) {
    const party = paymentParties[i % paymentParties.length];
    const type = i % 2 === 0 ? "received" : "paid";
    const date = new Date(2026, 3, Math.floor(Math.random() * 13) + 1);
    const dateStr = date.toISOString().split("T")[0];
    const amount = Math.floor(Math.random() * 50000) + 5000;

    createPayment({
      partyId: party.id,
      partyName: party.name,
      type,
      amount,
      mode: ["cash", "bank", "cheque", "upi"][
        Math.floor(Math.random() * 4)
      ] as any,
      date: dateStr,
      referenceNo: `REF-${Math.floor(Math.random() * 100000)}`,
      notes: `Payment on ${dateStr}`,
    });
  }

  // ============ VEHICLE REGISTERS (20 records) ============
  for (let i = 0; i < 20; i++) {
    const date = new Date(2026, 3, Math.floor(Math.random() * 13) + 1);
    const dateStr = date.toISOString().split("T")[0];
    const party = parties[Math.floor(Math.random() * parties.length)];
    const item =
      inventoryItems[Math.floor(Math.random() * inventoryItems.length)];

    const rows: Array<
      Omit<VehicleRegisterRow, "id" | "createdAt" | "updatedAt" | "total">
    > = [];
    const rowCount = Math.floor(Math.random() * 2) + 1;

    for (let j = 0; j < rowCount; j++) {
      const weight = Math.floor(Math.random() * 100) + 50;
      rows.push({
        lotNo: `L-${i}-${j}`,
        partyName: party.name,
        partyId: party.id,
        fruitName: item.name,
        vakkal: "Fresh Stock",
        boxes: Math.floor(Math.random() * 15) + 1,
        carat: 2,
        weight,
        rate: Math.floor(Math.random() * 40) + 15,
        commission: Math.floor(Math.random() * 100) + 10,
        hamali: Math.floor(Math.random() * 50) + 5,
        remarks: "Good quality",
        inventoryItemId: item.id,
      });
    }

    createVehicleRegister({
      date: dateStr,
      vehicleNumber: `GJ-${Math.floor(Math.random() * 99) + 1}-${["A", "B", "C", "Z"][Math.floor(Math.random() * 4)]}-${Math.floor(Math.random() * 9000) + 1000}`,
      driverName: partyNames[Math.floor(Math.random() * 5)],
      brokerName: supplierNames[Math.floor(Math.random() * 5)],
      arrivalTime: `${Math.floor(Math.random() * 12) + 6}:${Math.floor(
        Math.random() * 60,
      )
        .toString()
        .padStart(2, "0")}`,
      status: "posted",
      rows: rows as any,
      pendingAmount: 0,
      outstandingBalance: 0,
      notes: "Regular arrival",
    });
  }

  // ============ UPDATE SETTINGS ============
  updateSettings({
    businessName: "TFC Billing Software",
    businessAddress: "123, આર્જે પ્લાજા, અમદાવાદ",
    city: "અમદાવાદ",
    state: "ગુજરાત",
    phone: "9876543210",
    email: "info@tfcbilling.com",
    gstin: "24AABCT1234F1Z5",
    commissionPercent: 2.5,
    taxPercent: 5,
  });

  saveDb(db);
}
