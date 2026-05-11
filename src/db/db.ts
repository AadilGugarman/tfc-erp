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
} from './schema';

const STORAGE_KEY = 'fruit_market_erp_db';

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
  settings: Settings;
}

const defaultSettings: Settings = {
  businessName: 'ફળ માર્કેટ કમિશન એજન્ટ',
  businessAddress: 'મુખ્ય બજાર યાર્ડ',
  city: 'અમદાવાદ',
  state: 'ગુજરાત',
  phone: '+91 98765 43210',
  email: 'info@fruitmarket.com',
  gstin: '24ABCDE1234F1Z5',
  commissionPercent: 3,
  taxPercent: 5,
  currency: '₹',
  billPrefix: 'FM',
  purchasePrefix: 'PO',
  vehiclePrefix: 'VR',
  nextBillNo: 1001,
  nextPurchaseNo: 5001,
  nextVehicleEntryNo: 2001,
  language: 'gujarati',
  darkMode: false,
  lowStockAlert: true,
};

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
    settings: { ...defaultSettings },
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

function getDb(): Database {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return normalizeDb(JSON.parse(data));
    }
  } catch (e) {
    console.error('Failed to load database:', e);
  }
  return initializeDb();
}

function initializeDb(): Database {
  const db = createEmptyDb();
  saveDb(db);
  return db;
}

function saveDb(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===== PARTY OPERATIONS =====
export function getParties(): Party[] {
  return getDb().parties;
}

export function getParty(id: string): Party | undefined {
  return getDb().parties.find(p => p.id === id);
}

export function createParty(data: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>): Party {
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
      date: new Date().toISOString().split('T')[0],
      type: data.balanceType,
      amount: data.openingBalance,
      description: 'Opening Balance',
      referenceType: 'manual',
      referenceId: '',
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
  const idx = db.parties.findIndex(p => p.id === id);
  if (idx === -1) return null;
  db.parties[idx] = { ...db.parties[idx], ...data, updatedAt: new Date().toISOString() };
  saveDb(db);
  return db.parties[idx];
}

export function deleteParty(id: string): boolean {
  const db = getDb();
  db.parties = db.parties.filter(p => p.id !== id);
  db.ledgerEntries = db.ledgerEntries.filter(e => e.partyId !== id);
  db.payments = db.payments.filter(p => p.partyId !== id);
  saveDb(db);
  return true;
}

// ===== SUPPLIER OPERATIONS =====
export function getSuppliers(): Supplier[] {
  return getDb().suppliers;
}

export function getSupplier(id: string): Supplier | undefined {
  return getDb().suppliers.find(s => s.id === id);
}

export function createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
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
      date: new Date().toISOString().split('T')[0],
      type: data.balanceType,
      amount: data.openingBalance,
      description: 'Opening Balance',
      referenceType: 'manual',
      referenceId: '',
      runningBalance: data.openingBalance,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(entry);
  }

  saveDb(db);
  return supplier;
}

export function updateSupplier(id: string, data: Partial<Supplier>): Supplier | null {
  const db = getDb();
  const idx = db.suppliers.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.suppliers[idx] = { ...db.suppliers[idx], ...data, updatedAt: new Date().toISOString() };
  saveDb(db);
  return db.suppliers[idx];
}

export function deleteSupplier(id: string): boolean {
  const db = getDb();
  db.suppliers = db.suppliers.filter(s => s.id !== id);
  saveDb(db);
  return true;
}

// ===== VEHICLE REGISTER OPERATIONS =====
export function getVehicleRegisters(): VehicleRegister[] {
  return getDb().vehicleRegisters;
}

export function getVehicleRegister(id: string): VehicleRegister | undefined {
  return getDb().vehicleRegisters.find(register => register.id === id);
}

export function getNextVehicleEntryNo(): string {
  const db = getDb();
  return `${db.settings.vehiclePrefix}-${db.settings.nextVehicleEntryNo}`;
}

export function createVehicleRegister(data: Omit<VehicleRegister, 'id' | 'entryNo' | 'totalRows' | 'totalWeight' | 'grandTotal' | 'createdAt' | 'updatedAt'> & { rows: Array<Omit<VehicleRegisterRow, 'id' | 'createdAt' | 'updatedAt' | 'total'>> }): VehicleRegister {
  const db = getDb();
  const entryNo = `${db.settings.vehiclePrefix}-${db.settings.nextVehicleEntryNo}`;
  db.settings.nextVehicleEntryNo += 1;

  const rows: VehicleRegisterRow[] = data.rows.map((row) => {
    const baseAmount = Math.max(0, row.carat || 0) * Math.max(0, row.weight || 0) * Math.max(0, row.rate || 0);
    const total = Number((baseAmount + Math.max(0, row.commission || 0) + Math.max(0, row.hamali || 0)).toFixed(2));
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
        type: 'debit',
        amount: row.total,
        description: `Vehicle Arrival Register ${register.entryNo}`,
        referenceType: 'vehicle_register',
        referenceId: register.id,
        runningBalance: 0,
        createdAt: new Date().toISOString(),
      });
    }

    const inventoryItem = row.inventoryItemId
      ? db.inventoryItems.find(item => item.id === row.inventoryItemId)
      : db.inventoryItems.find(item => item.name.trim().toLowerCase() === row.fruitName.trim().toLowerCase());

    if (inventoryItem && row.weight > 0) {
      if (inventoryItem) {
        inventoryItem.currentStock = Math.max(0, inventoryItem.currentStock - row.weight);
        inventoryItem.lastUpdated = new Date().toISOString();
        if (inventoryItem.currentStock <= 0) inventoryItem.status = 'out_of_stock';
        else if (inventoryItem.currentStock <= inventoryItem.lowStockThreshold) inventoryItem.status = 'low_stock';
        else inventoryItem.status = 'in_stock';

        db.inventoryTransactions.push({
          id: genId(),
          itemId: inventoryItem.id,
          itemName: inventoryItem.name,
          type: 'outward',
          quantity: row.weight,
          rate: row.rate,
          referenceType: 'vehicle_register',
          referenceId: register.id,
          date: register.date,
          notes: `Vehicle Arrival Register ${register.entryNo}`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  recalculateBalances(db);
  saveDb(db);
  return register;
}

export function updateVehicleRegister(id: string, data: Partial<VehicleRegister>): VehicleRegister | null {
  const db = getDb();
  const idx = db.vehicleRegisters.findIndex(register => register.id === id);
  if (idx === -1) return null;
  db.vehicleRegisters[idx] = { ...db.vehicleRegisters[idx], ...data, updatedAt: new Date().toISOString() };
  saveDb(db);
  return db.vehicleRegisters[idx];
}

export function deleteVehicleRegister(id: string): boolean {
  const db = getDb();
  db.vehicleRegisters = db.vehicleRegisters.filter(register => register.id !== id);
  db.ledgerEntries = db.ledgerEntries.filter(entry => !(entry.referenceId === id && entry.referenceType === 'vehicle_register'));
  db.inventoryTransactions = db.inventoryTransactions.filter(transaction => !(transaction.referenceId === id && transaction.referenceType === 'vehicle_register'));
  recalculateBalances(db);
  saveDb(db);
  return true;
}

// ===== LEDGER OPERATIONS =====
export function getLedgerEntries(partyId?: string): LedgerEntry[] {
  const db = getDb();
  if (partyId) {
    return db.ledgerEntries.filter(e => e.partyId === partyId);
  }
  return db.ledgerEntries;
}

export function addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): LedgerEntry {
  const db = getDb();
  const le: LedgerEntry = {
    ...entry,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  db.ledgerEntries.push(le);

  // Update running balance for all entries of this party
  const partyEntries = db.ledgerEntries
    .filter(e => e.partyId === entry.partyId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  for (const e of partyEntries) {
    if (e.type === 'debit') {
      balance += e.amount;
    } else {
      balance -= e.amount;
    }
    e.runningBalance = balance;
  }

  saveDb(db);
  return le;
}

export function getPartyBalance(partyId: string): { balance: number; type: 'receivable' | 'payable' } {
  const entries = getLedgerEntries(partyId);
  let balance = 0;
  for (const e of entries) {
    if (e.type === 'debit') {
      balance += e.amount;
    } else {
      balance -= e.amount;
    }
  }
  return {
    balance: Math.abs(balance),
    type: balance >= 0 ? 'receivable' : 'payable',
  };
}

// ===== BILL OPERATIONS =====
export function getBills(): Bill[] {
  return getDb().bills;
}

export function getBill(id: string): Bill | undefined {
  return getDb().bills.find(b => b.id === id);
}

export function getNextBillNo(): string {
  const db = getDb();
  const no = db.settings.nextBillNo;
  return `${db.settings.billPrefix}-${no}`;
}

export function createBill(data: Omit<Bill, 'id' | 'billNo' | 'createdAt' | 'updatedAt'>): { bill: Bill; ledgerEntry: LedgerEntry } {
  const db = getDb();
  const billNo = `${db.settings.billPrefix}-${db.settings.nextBillNo}`;
  db.settings.nextBillNo += 1;

  const previousBal = getPartyBalance(data.partyId);
  const prevAmount = previousBal.type === 'receivable' ? previousBal.balance : -previousBal.balance;

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
    bill.status = 'paid';
  } else if (bill.paidAmount > 0) {
    bill.status = 'partial';
  } else {
    bill.status = 'unpaid';
  }

  db.bills.push(bill);

  // Add ledger entry
  const ledgerEntry: LedgerEntry = {
    id: genId(),
    partyId: bill.partyId,
    partyName: bill.partyName,
    date: bill.date,
    type: 'debit',
    amount: bill.total,
    description: `Sale Bill ${billNo}`,
    referenceType: 'bill',
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
      type: 'credit',
      amount: bill.paidAmount,
      description: `Advance Payment for Bill ${billNo}`,
      referenceType: 'payment',
      referenceId: bill.id,
      runningBalance: 0,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(payEntry);
  }

  // Update inventory (deduct stock)
  for (const item of bill.items) {
    const invItem = db.inventoryItems.find(i => i.name === item.fruitName && i.grade === item.grade);
    if (invItem) {
      invItem.currentStock = Math.max(0, invItem.currentStock - item.totalWeight);
      invItem.lastUpdated = new Date().toISOString();
      if (invItem.currentStock <= 0) invItem.status = 'out_of_stock';
      else if (invItem.currentStock <= invItem.lowStockThreshold) invItem.status = 'low_stock';
      else invItem.status = 'in_stock';

      const txn: InventoryTransaction = {
        id: genId(),
        itemId: invItem.id,
        itemName: invItem.name,
        type: 'outward',
        quantity: item.totalWeight,
        rate: item.rate,
        referenceType: 'bill',
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
  db.bills = db.bills.filter(b => b.id !== id);
  db.ledgerEntries = db.ledgerEntries.filter(e => e.referenceId !== id);
  saveDb(db);
  return true;
}

// ===== INVENTORY OPERATIONS =====
export function getInventoryItems(): InventoryItem[] {
  return getDb().inventoryItems;
}

export function getInventoryItem(id: string): InventoryItem | undefined {
  return getDb().inventoryItems.find(i => i.id === id);
}

export function createInventoryItem(data: Omit<InventoryItem, 'id' | 'currentStock' | 'status' | 'lastUpdated' | 'createdAt'> & { currentStock: number }): InventoryItem {
  const db = getDb();
  const status: InventoryItem['status'] =
    data.currentStock <= 0 ? 'out_of_stock' :
    data.currentStock <= data.lowStockThreshold ? 'low_stock' : 'in_stock';

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

export function updateInventoryItem(id: string, data: Partial<InventoryItem>): InventoryItem | null {
  const db = getDb();
  const idx = db.inventoryItems.findIndex(i => i.id === id);
  if (idx === -1) return null;
  const updated = { ...db.inventoryItems[idx], ...data, lastUpdated: new Date().toISOString() };
  if (updated.currentStock <= 0) updated.status = 'out_of_stock';
  else if (updated.currentStock <= updated.lowStockThreshold) updated.status = 'low_stock';
  else updated.status = 'in_stock';
  db.inventoryItems[idx] = updated;
  saveDb(db);
  return updated;
}

export function addInventoryTransaction(data: Omit<InventoryTransaction, 'id' | 'createdAt'>): InventoryTransaction {
  const db = getDb();
  const txn: InventoryTransaction = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  db.inventoryTransactions.push(txn);

  const item = db.inventoryItems.find(i => i.id === data.itemId);
  if (item) {
    if (data.type === 'inward') {
      item.currentStock += data.quantity;
    } else {
      item.currentStock = Math.max(0, item.currentStock - data.quantity);
    }
    item.lastUpdated = new Date().toISOString();
    if (item.currentStock <= 0) item.status = 'out_of_stock';
    else if (item.currentStock <= item.lowStockThreshold) item.status = 'low_stock';
    else item.status = 'in_stock';
  }

  saveDb(db);
  return txn;
}

export function getInventoryTransactions(itemId?: string): InventoryTransaction[] {
  const db = getDb();
  if (itemId) return db.inventoryTransactions.filter(t => t.itemId === itemId);
  return db.inventoryTransactions;
}

// ===== PURCHASE OPERATIONS =====
export function getPurchases(): Purchase[] {
  return getDb().purchases;
}

export function getPurchase(id: string): Purchase | undefined {
  return getDb().purchases.find(p => p.id === id);
}

export function getNextPurchaseNo(): string {
  const db = getDb();
  const no = db.settings.nextPurchaseNo;
  return `${db.settings.purchasePrefix}-${no}`;
}

export function createPurchase(data: Omit<Purchase, 'id' | 'purchaseNo' | 'createdAt' | 'updatedAt'>): { purchase: Purchase } {
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
    purchase.status = 'paid';
  } else if (purchase.paidAmount > 0) {
    purchase.status = 'partial';
  } else {
    purchase.status = 'unpaid';
  }

  db.purchases.push(purchase);

  // Ledger entry
  const ledgerEntry: LedgerEntry = {
    id: genId(),
    partyId: purchase.supplierId,
    partyName: purchase.supplierName,
    date: purchase.date,
    type: 'credit',
    amount: purchase.total,
    description: `Purchase ${purchaseNo}`,
    referenceType: 'purchase',
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
      type: 'debit',
      amount: purchase.paidAmount,
      description: `Advance Payment for Purchase ${purchaseNo}`,
      referenceType: 'payment',
      referenceId: purchase.id,
      runningBalance: 0,
      createdAt: new Date().toISOString(),
    };
    db.ledgerEntries.push(payEntry);
  }

  // Increase inventory
  for (const item of purchase.items) {
    const invItem = db.inventoryItems.find(i => i.name === item.fruitName && i.grade === item.grade);
    if (invItem) {
      invItem.currentStock += item.quantity;
      invItem.lastUpdated = new Date().toISOString();
      if (invItem.currentStock <= 0) invItem.status = 'out_of_stock';
      else if (invItem.currentStock <= invItem.lowStockThreshold) invItem.status = 'low_stock';
      else invItem.status = 'in_stock';

      const txn: InventoryTransaction = {
        id: genId(),
        itemId: invItem.id,
        itemName: invItem.name,
        type: 'inward',
        quantity: item.quantity,
        rate: item.rate,
        referenceType: 'purchase',
        referenceId: purchase.id,
        date: purchase.date,
        notes: `Purchased via ${purchaseNo}`,
        createdAt: new Date().toISOString(),
      };
      db.inventoryTransactions.push(txn);
    } else {
      // Create new inventory item
      const status: InventoryItem['status'] =
        item.quantity <= 0 ? 'out_of_stock' : 'in_stock';
      const newItem: InventoryItem = {
        id: genId(),
        name: item.fruitName,
        grade: item.grade,
        category: 'Fruits',
        currentStock: item.quantity,
        unit: item.unit || 'kg',
        lowStockThreshold: 50,
        status,
        warehouse: 'Main',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.inventoryItems.push(newItem);

      const txn: InventoryTransaction = {
        id: genId(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'inward',
        quantity: item.quantity,
        rate: item.rate,
        referenceType: 'purchase',
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

// ===== PAYMENT OPERATIONS =====
export function getPayments(): Payment[] {
  return getDb().payments;
}

export function getPaymentsByParty(partyId: string): Payment[] {
  return getDb().payments.filter(p => p.partyId === partyId);
}

export function createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'ledgerEntryId'>): { payment: Payment; ledgerEntry: LedgerEntry } {
  const db = getDb();
  const payment: Payment = {
    ...data,
    id: genId(),
    ledgerEntryId: '',
    createdAt: new Date().toISOString(),
  };

  const ledgerEntry: LedgerEntry = {
    id: genId(),
    partyId: payment.partyId,
    partyName: payment.partyName,
    date: payment.date,
    type: payment.type === 'received' ? 'credit' : 'debit',
    amount: payment.amount,
    description: `${payment.type === 'received' ? 'Payment Received' : 'Payment Made'} via ${payment.mode}`,
    referenceType: 'payment',
    referenceId: payment.id,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  };

  payment.ledgerEntryId = ledgerEntry.id;
  db.payments.push(payment);
  db.ledgerEntries.push(ledgerEntry);

  recalculateBalances(db);
  saveDb(db);
  return { payment, ledgerEntry };
}

export function deletePayment(id: string): boolean {
  const db = getDb();
  const payment = db.payments.find(p => p.id === id);
  if (payment) {
    db.payments = db.payments.filter(p => p.id !== id);
    db.ledgerEntries = db.ledgerEntries.filter(e => e.id !== payment.ledgerEntryId);
    recalculateBalances(db);
    saveDb(db);
  }
  return true;
}

// ===== SETTINGS =====
export function getSettings(): Settings {
  return getDb().settings;
}

export function updateSettings(data: Partial<Settings>): Settings {
  const db = getDb();
  db.settings = { ...db.settings, ...data };
  saveDb(db);
  return db.settings;
}

// ===== UTILITY =====
function recalculateBalances(db: Database): void {
  const partyIds = [...new Set(db.ledgerEntries.map(e => e.partyId))];
  for (const partyId of partyIds) {
    const entries = db.ledgerEntries
      .filter(e => e.partyId === partyId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    for (const e of entries) {
      if (e.type === 'debit') {
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
    bills: db.bills.filter(b => b.date === date),
    purchases: db.purchases.filter(p => p.date === date),
    payments: db.payments.filter(p => p.date === date),
    ledgerEntries: db.ledgerEntries.filter(e => e.date === date),
  };
}

export function getReportData(startDate: string, endDate: string) {
  const db = getDb();
  const bills = db.bills.filter(b => b.date >= startDate && b.date <= endDate);
  const purchases = db.purchases.filter(p => p.date >= startDate && p.date <= endDate);
  const payments = db.payments.filter(p => p.date >= startDate && p.date <= endDate);
  
  const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalReceived = payments.filter(p => p.type === 'received').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.type === 'paid').reduce((sum, p) => sum + p.amount, 0);
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
      return bal.type === 'receivable' ? sum + bal.balance : sum;
    }, 0),
    outstandingPayable: db.suppliers.reduce((sum, s) => {
      const bal = getPartyBalance(s.id);
      return bal.type === 'payable' ? sum + bal.balance : sum;
    }, 0),
    vehicleRegisters: db.vehicleRegisters.length,
  };
}

// ===== SEED DATA =====
export function seedDemoData() {
  const db = getDb();
  if (db.parties.length > 0) return;

  // Demo parties
  const parties: Party[] = [
    {
      id: genId(), name: 'રાજેશ પટેલ', phone: '9876543210', email: 'rajesh@email.com',
      gstin: '24AAACP1234F1Z5', address: '12, માર્કેટ યાર્ડ', city: 'અમદાવાદ',
      state: 'ગુજરાત', openingBalance: 15000, balanceType: 'debit',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      isSupplier: false, commissionPercent: 3, notes: 'Regular buyer'
    },
    {
      id: genId(), name: 'સુરેશ શાહ', phone: '9876543211', email: 'suresh@email.com',
      gstin: '', address: '45, ફળ માર્કેટ', city: 'સુરત',
      state: 'ગુજરાત', openingBalance: 8000, balanceType: 'debit',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      isSupplier: false, commissionPercent: 3, notes: ''
    },
    {
      id: genId(), name: 'મહેશ કુમાર', phone: '9876543212', email: '',
      gstin: '24BBBCK5678G2Z3', address: '78, APMC યાર્ડ', city: 'વડોદરા',
      state: 'ગુજરાત', openingBalance: 0, balanceType: 'debit',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      isSupplier: false, commissionPercent: 2.5, notes: 'New customer'
    },
  ];

  // Demo suppliers
  const suppliers: Supplier[] = [
    {
      id: genId(), name: 'ગોપાલ ફાર્મ', phone: '9876543213', email: 'gopal@farm.com',
      address: 'નાસિક, મહારાષ્ટ્ર', city: 'નાસિક', state: 'મહારાષ્ટ્ર',
      openingBalance: 5000, balanceType: 'credit', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), commissionPercent: 3, notes: 'Grape supplier'
    },
    {
      id: genId(), name: 'કેરલ ફ્રુટ્સ', phone: '9876543214', email: '',
      address: 'કોચિન, કેરલ', city: 'કોચિન', state: 'કેરલ',
      openingBalance: 0, balanceType: 'credit', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), commissionPercent: 3, notes: 'Banana & coconut'
    },
  ];

  // Demo inventory
  const invItems: InventoryItem[] = [
    { id: genId(), name: 'કેળા', grade: 'A', category: 'Fruits', currentStock: 500, unit: 'kg', lowStockThreshold: 100, status: 'in_stock', warehouse: 'Main', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: genId(), name: 'સફરજન', grade: 'Premium', category: 'Fruits', currentStock: 200, unit: 'kg', lowStockThreshold: 50, status: 'in_stock', warehouse: 'Main', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: genId(), name: 'દ્રાક્ષ', grade: 'A+', category: 'Fruits', currentStock: 150, unit: 'kg', lowStockThreshold: 30, status: 'in_stock', warehouse: 'Main', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: genId(), name: 'નારંગી', grade: 'A', category: 'Fruits', currentStock: 80, unit: 'kg', lowStockThreshold: 100, status: 'low_stock', warehouse: 'Main', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: genId(), name: 'નારીયેળ', grade: 'Standard', category: 'Fruits', currentStock: 0, unit: 'pcs', lowStockThreshold: 20, status: 'out_of_stock', warehouse: 'Main', lastUpdated: new Date().toISOString(), createdAt: new Date().toISOString() },
  ];

  db.parties = parties;
  db.suppliers = suppliers;
  db.inventoryItems = invItems;

  db.vehicleRegisters = [
    {
      id: genId(),
      entryNo: `${db.settings.vehiclePrefix}-${db.settings.nextVehicleEntryNo}`,
      date: new Date().toISOString().split('T')[0],
      vehicleNumber: 'GJ-01-Z-4821',
      driverName: 'ભરતભાઈ',
      brokerName: 'મહેશભાઈ',
      arrivalTime: '09:15',
      status: 'posted',
      rows: [
        {
          id: genId(),
          lotNo: 'L-01',
          partyName: parties[0].name,
          partyId: parties[0].id,
          fruitName: invItems[0].name,
          vakkal: 'Fresh Banana',
          boxes: 12,
          carat: 2,
          weight: 48,
          rate: 18,
          commission: 0,
          hamali: 0,
          total: 1728,
          remarks: 'Morning lot',
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
      notes: 'Demo vehicle register',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Seed ledger entries for parties
  for (const p of parties) {
    if (p.openingBalance > 0) {
      db.ledgerEntries.push({
        id: genId(), partyId: p.id, partyName: p.name,
        date: new Date().toISOString().split('T')[0],
        type: p.balanceType, amount: p.openingBalance,
        description: 'Opening Balance', referenceType: 'manual',
        referenceId: '', runningBalance: p.openingBalance,
        createdAt: new Date().toISOString(),
      });
    }
  }

  saveDb(db);
}
