// Database Schema Types for Fruit Market Commission ERP
// Simulating SQLite schema with TypeScript types

export type LedgerType = "debit" | "credit";
export type PartyType = "customer" | "supplier" | "both";
export type PaymentMode = "cash" | "bank" | "upi" | "cheque" | "other";
export type TaxType = "gst" | "none";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type VehicleRegisterStatus = "draft" | "posted" | "cancelled";
export type UserRole = "admin" | "operator" | "viewer";

export interface Party {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  shippingAddress: string;
  city: string;
  state: string;
  openingBalance: number;
  balanceType: LedgerType;
  createdAt: string;
  updatedAt: string;
  partyType: PartyType;
  commissionPercent: number;
  creditLimit: number;
  notes: string;
}

export interface LedgerEntry {
  id: string;
  companyId: string;
  partyId: string;
  partyName: string;
  date: string;
  type: LedgerType;
  amount: number;
  description: string;
  referenceType:
    | "bill"
    | "payment"
    | "purchase"
    | "manual"
    | "commission"
    | "vehicle_register";
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
  companyId: string;
  entryNo: string;
  date: string;
  dayOfWeek?: string;
  vehicleNumber: string;
  driverName: string;
  brokerName: string;
  arrivalTime: string;
  vehicleDescription?: string;
  scaleWeight?: number;
  fruitTypeCategory?: string;
  status: VehicleRegisterStatus;
  rows: VehicleRegisterRow[];
  totalRows: number;
  totalWeight: number;
  totalBoxes?: number;
  totalCarats?: number;
  grandTotal: number;
  pendingAmount: number;
  outstandingBalance: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  companyId: string;
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
  status: "paid" | "partial" | "unpaid";
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
  companyId: string;
  name: string;
  grade: string;
  category: string;
  currentStock: number;
  unit: string;
  status: StockStatus;
  warehouse: string;
  lowStockThreshold: number;
  lastUpdated: string;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: "inward" | "outward";
  quantity: number;
  rate: number;
  referenceType:
    | "purchase"
    | "bill"
    | "manual"
    | "adjustment"
    | "vehicle_register";
  referenceId: string;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  companyId: string;
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
  status: "paid" | "partial" | "unpaid";
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
  companyId: string;
  date: string;
  partyId: string;
  partyName: string;
  amount: number;
  mode: PaymentMode;
  type: "received" | "paid";
  referenceNo: string;
  notes: string;
  ledgerEntryId: string;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  legalName: string;
  gstin: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null;
  signature: string | null;
  whatsappPhone: string;
}

export interface FinancialSettings {
  financialYearStart: string;
  financialYearEnd: string;
  currency: string;
  currencySymbol: string;
  taxSystem: "GST" | "VAT" | "Sales Tax" | "None";
  invoicePrefix: string;
  invoiceStartingNumber: number;
  purchasePrefix: string;
  purchaseStartingNumber: number;
  vehiclePrefix: string;
  vehicleStartingNumber: number;
  decimalPrecision: number;
  roundOffRule: "up" | "down" | "nearest" | "bankers";
  dateFormat: string;
  timeFormat: "12h" | "24h";
  timezone: string;
}

export interface InvoiceSettings {
  template: "modern" | "classic" | "minimal" | "professional";
  termsAndConditions: string;
  footerNotes: string;
  defaultTax: number;
  commissionPercent: number;
  enableQRCode: boolean;
  autoInvoiceNumber: boolean;
  invoiceColorTheme: string;
  showPaymentDetails: boolean;
  showCompanyDetails: boolean;
  dueDateDays: number;
}

export interface BackupInfo {
  id: string;
  name: string;
  path: string;
  size: string;
  date: string;
  type: "auto" | "manual" | "export";
  encrypted: boolean;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  backupLocation: string;
  lastBackupDate: string | null;
  backupRetentionDays: number;
  encryptBackups: boolean;
  cloudBackupEnabled: boolean;
  backupHistory: BackupInfo[];
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
  animations: boolean;
  language: "english" | "gujarati";
  lowStockAlert: boolean;
}

export interface SecuritySettings {
  requirePassword: boolean;
  passwordTimeoutMinutes: number;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  allowExport: boolean;
  auditLogEnabled: boolean;
  dataEncryptionEnabled: boolean;
}

export type SettingsCategory =
  | "companies"
  | "financial"
  | "invoice"
  | "backup"
  | "appearance"
  | "security";

export interface Settings {
  company: CompanySettings;
  financial: FinancialSettings;
  invoice: InvoiceSettings;
  backup: BackupSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
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
  invoicePrefix: string;
  language: "english" | "gujarati";
  theme: "light" | "dark";
  financialYearStart: number; // Month: 1-12
  financialYearEnd: number; // Month: 1-12
  ownerId: string; // User who created it
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  companyIds: string[]; // List of company IDs user has access to
  defaultCompanyId?: string; // Last selected company
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
