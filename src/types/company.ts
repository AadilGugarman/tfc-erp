export interface CompanyDetails {
  companyName: string;
  legalName: string;
  gstin: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  logoUrl: string;
}

export interface FinancialSettings {
  fyStart: string; // YYYY-MM-DD
  fyEnd: string; // YYYY-MM-DD
  currency: string;
  currencySymbol: string;
  taxType: string;
  invoicePrefix: string;
  invoiceStartingNumber: string;
  decimalPrecision: number;
  enableMultiTax: boolean;
  enableRoundOff: boolean;
}

export interface CompanyFormData {
  details: CompanyDetails;
  financial: FinancialSettings;
}

export interface ValidationErrors {
  details: { [key: string]: string };
  financial: { [key: string]: string };
}

export interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
}

export interface ExistingCompany {
  id: string;
  name: string;
  gstin: string;
  fy: string;
  currencySymbol: string;
  lastAccessed: string;
  status: "Active" | "Archived" | "Syncing";
}
