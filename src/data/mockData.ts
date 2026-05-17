import { CompanyFormData, ExistingCompany } from "../types/company";

export const LANGUAGES = [
  { id: "en", name: "English (US)" },
  { id: "gu", name: "Gujarati (ભારતીય)" },
 
];

export const THEME_OPTIONS = [
  { id: "light", name: "Light Mode" },
  { id: "dark", name: "Dark Mode" },
  { id: "system", name: "System Default" },
];

export const CURRENCIES = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
];

export const TAX_TYPES = [
  { id: "gst", name: "GST (India)" },
  { id: "vat", name: "VAT (Standard)" },
  { id: "sales_tax", name: "Sales Tax" },
  { id: "none", name: "None / Tax Exempt" },
];

export const DATE_FORMATS = [
  { id: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2026)" },
  { id: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2026)" },
  { id: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-12-31)" },
];

export const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
];
