// Database Schema Types for Fruit Market Commission ERP
// Simulating SQLite schema with TypeScript types

export type LedgerType = 'debit' | 'credit';
export type PaymentMode = 'cash' | 'bank' | 'upi' | 'cheque' | 'other';
export type TaxType = 'gst' | 'none';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type VehicleRegisterStatus = 'draft' | 'posted' | 'cancelled';
export type UserRole = 'admin' | 'operator' | 'viewer';

export interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  openingBalance: number;
  balanceType: LedgerType;
  createdAt: string;
  updatedAt: string;
  isSupplier: boolean;
  commissionPercent: number;
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  openingBalance: number;
  balanceType: LedgerType;
  createdAt: string;
  updatedAt: string;
  commissionPercent: number;
  notes: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  partyName: string;
  date: string;
  type: LedgerType;
  amount: number;
  description: string;
  referenceType: 'bill' | 'payment' | 'purchase' | 'manual' | 'commission' | 'vehicle_register';
  referenceId: string;
  runningBalance: number;
  createdAt: string;
}

export interface VehicleRegisterRow {
  id: string;
  lotNo: string;
  partyId?: string;
  partyName: string;
  fruitName: string;
  vakkal: string;
  boxes: number;
  carat: number;
  weight: number;
  rate: number;
  commission: number;
  hamali: number;
  total: number;
  remarks: string;
  inventoryItemId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRegister {
  id: string;
  entryNo: string;
  date: string;
  vehicleNumber: string;
  driverName: string;
  brokerName: string;
  arrivalTime: string;
  status: VehicleRegisterStatus;
  rows: VehicleRegisterRow[];
  totalRows: number;
  totalWeight: number;
  grandTotal: number;
  pendingAmount: number;
  outstandingBalance: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNo: string;
  date: string;
  partyId: string;
  partyName: string;
  items: BillItem[];
  subtotal: number;
  commission: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  previousBalance: number;
  paidAmount: number;
  netBalance: number;
  notes: string;
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id: string;
  fruitName: string;
  grade: string;
  boxCount: number;
  weightPerBox: number;
  totalWeight: number;
  rate: number;
  amount: number;
  lotNo: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  grade: string;
  category: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  status: StockStatus;
  warehouse: string;
  lastUpdated: string;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'inward' | 'outward';
  quantity: number;
  rate: number;
  referenceType: 'purchase' | 'bill' | 'manual' | 'adjustment';
  referenceId: string;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  netBalance: number;
  notes: string;
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  fruitName: string;
  grade: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  lotNo: string;
}

export interface Payment {
  id: string;
  date: string;
  partyId: string;
  partyName: string;
  amount: number;
  mode: PaymentMode;
  type: 'received' | 'paid';
  referenceNo: string;
  notes: string;
  ledgerEntryId: string;
  createdAt: string;
}

export interface Settings {
  businessName: string;
  businessAddress: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  gstin: string;
  commissionPercent: number;
  taxPercent: number;
  currency: string;
  billPrefix: string;
  purchasePrefix: string;
  vehiclePrefix: string;
  nextBillNo: number;
  nextPurchaseNo: number;
  nextVehicleEntryNo: number;
  language: 'english' | 'gujarati' | 'hindi';
  darkMode: boolean;
  lowStockAlert: boolean;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  gstin: string;
  logo?: string;
  invoicePrefix: string;
  language: 'english' | 'gujarati' | 'hindi';
  theme: 'light' | 'dark';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
