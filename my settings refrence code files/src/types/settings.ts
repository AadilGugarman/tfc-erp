// ====================
// Settings Types
// ====================

export type SettingsCategory = 
  | 'company'
  | 'financial'
  | 'invoice'
  | 'backup'
  | 'appearance'
  | 'security';

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
}

export interface FinancialSettings {
  financialYearStart: string;
  financialYearEnd: string;
  currency: string;
  currencySymbol: string;
  taxSystem: 'GST' | 'VAT' | 'Sales Tax' | 'None';
  invoicePrefix: string;
  invoiceStartingNumber: number;
  decimalPrecision: number;
  roundOffRule: 'up' | 'down' | 'nearest' | 'bankers';
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
}

export interface InvoiceSettings {
  template: 'modern' | 'classic' | 'minimal' | 'professional';
  termsAndConditions: string;
  footerNotes: string;
  signature: string | null;
  defaultTax: number;
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
  type: 'auto' | 'manual' | 'export';
  encrypted: boolean;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupLocation: string;
  lastBackupDate: string | null;
  backupRetentionDays: number;
  encryptBackups: boolean;
  cloudBackupEnabled: boolean;
  backupHistory: BackupInfo[];
}

export interface InvoiceItem {
  id: string;
  item: string;
  lot: string;
  caret: number;
  weight: number;
  rate: number;
  amount: number;
}

export interface InvoiceDetails {
  billNumber: string;
  date: string;
  customerName: string;
  customerMobile: string;
  items: InvoiceItem[];
  previousBalance: number;
  todayAmount: number;
  paidAmount: number;
  remainingBalance: number;
  notes: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
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

export interface Settings {
  company: CompanySettings;
  financial: FinancialSettings;
  invoice: InvoiceSettings;
  backup: BackupSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
}

export interface SettingsCategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: string;
  description: string;
}

export const SETTINGS_CATEGORIES: SettingsCategoryConfig[] = [
  {
    id: 'company',
    label: 'Company',
    icon: 'building',
    description: 'Company information and branding',
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: 'wallet',
    description: 'Fiscal year, currency, and tax settings',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: 'file-text',
    description: 'Invoice templates and defaults',
  },
  {
    id: 'backup',
    label: 'Backup & Data',
    icon: 'database',
    description: 'Backup, restore, and database management',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'palette',
    description: 'Theme, colors, and display preferences',
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'shield',
    description: 'Password, encryption, and access controls',
  },
];

export const DEFAULT_SETTINGS: Settings = {
  company: {
    companyName: '',
    legalName: '',
    gstin: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    logo: null,
  },
  financial: {
    financialYearStart: '2024-04-01',
    financialYearEnd: '2025-03-31',
    currency: 'INR',
    currencySymbol: '₹',
    taxSystem: 'GST',
    invoicePrefix: 'INV',
    invoiceStartingNumber: 1000,
    decimalPrecision: 2,
    roundOffRule: 'nearest',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Asia/Kolkata',
  },
  invoice: {
    template: 'modern',
    termsAndConditions: 'Payment is due within 30 days of invoice date. Late payments may incur additional charges.',
    footerNotes: 'Thank you for your business!',
    signature: null,
    defaultTax: 18,
    enableQRCode: true,
    autoInvoiceNumber: true,
    invoiceColorTheme: '#3b82f6',
    showPaymentDetails: true,
    showCompanyDetails: true,
    dueDateDays: 30,
  },
  backup: {
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupLocation: '',
    lastBackupDate: null,
    backupRetentionDays: 30,
    encryptBackups: true,
    cloudBackupEnabled: false,
    backupHistory: [],
  },
  appearance: {
    theme: 'light',
    accentColor: '#3b82f6',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
  },
  security: {
    requirePassword: true,
    passwordTimeoutMinutes: 15,
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 60,
    allowExport: true,
    auditLogEnabled: true,
    dataEncryptionEnabled: true,
  },
};

// Validation schemas
export interface ValidationErrors {
  [key: string]: string;
}

export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};
