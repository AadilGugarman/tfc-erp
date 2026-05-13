import { create } from "zustand";
import type {
  Settings,
  Party,
  Supplier,
  Bill,
  Purchase,
  Payment,
  InventoryItem,
  Company,
  LedgerEntry,
  VehicleRegister,
} from "@/db/schema";
import * as db from "@/db/db";
import { authService } from "@/services/auth";

export type PageId =
  | "dashboard"
  | "vehicle-register"
  | "parties"
  | "suppliers"
  | "ledger"
  | "transactions"
  | "inventory"
  | "payments"
  | "reports"
  | "search"
  | "settings";

interface AppState {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;

  authenticated: boolean;
  userId: string;
  login: (userId: string) => void;
  logout: () => void;

  companies: Company[];
  currentCompany: Company | null;
  loadCompanies: () => void;
  setCurrentCompany: (companyId: string) => void;
  createCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (companyId: string) => void;

  language: "english" | "gujarati";
  setLanguage: (lang: "english" | "gujarati") => void;

  settings: Settings;
  loadSettings: () => void;
  updateSettings: (data: Partial<Settings>) => void;
  setDarkMode: (dark: boolean) => void;

  parties: Party[];
  loadParties: () => void;
  searchParties: (query: string) => Party[];

  suppliers: Supplier[];
  loadSuppliers: () => void;
  searchSuppliers: (query: string) => Supplier[];

  inventoryItems: InventoryItem[];
  loadInventory: () => void;

  payments: Payment[];
  loadPayments: () => void;

  bills: Bill[];
  loadBills: () => void;

  purchases: Purchase[];
  loadPurchases: () => void;

  ledgerEntries: LedgerEntry[];
  loadLedgerEntries: () => void;

  vehicleRegisters: VehicleRegister[];
  loadVehicleRegisters: () => void;

  refreshDataFromDb: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  modalOpen: boolean;
  modalContent: string;
  modalData: Record<string, unknown>;
  openModal: (content: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  notification: { message: string; type: "success" | "error" | "info" } | null;
  showNotification: (
    message: string,
    type: "success" | "error" | "info",
  ) => void;
  clearNotification: () => void;

  shortcutsEnabled: boolean;
  toggleShortcuts: () => void;

  invoiceCreationMode: "sales" | "purchase" | null;
  setInvoiceCreationMode: (mode: "sales" | "purchase" | null) => void;
}

const getStoredLanguage = (): "english" | "gujarati" => {
  const settings = db.getSettings();
  return settings.language || "english";
};

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),

  authenticated: authService.isAuthenticated(),
  userId: authService.getCurrentUser()?.id || "guest",
  login: (userId: string) => {
    // This is kept for backward compatibility
    // Real login should use authService.login() from Login component
    set({ authenticated: true, userId });
  },
  logout: () => {
    authService.logout();
    set({ authenticated: false, currentPage: "dashboard", userId: "guest" });
  },

  companies: db.getCompanies(),
  currentCompany: db.getCompanies()[0] || null,
  loadCompanies: () => {
    const companies = db.getCompanies();
    set({ companies });
  },
  setCurrentCompany: (companyId: string) => {
    const companies = db.getCompanies();
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      localStorage.setItem("talha-fruit-company", companyId);
      set({ currentCompany: company });
    }
  },
  createCompany: (company: Company) => {
    const newCompany = db.createCompany({
      name: company.name,
      address: company.address,
      city: company.city,
      state: company.state,
      phone: company.phone,
      email: company.email,
      gstin: company.gstin,
      invoicePrefix: company.invoicePrefix,
      language: company.language,
      theme: company.theme,
      isActive: company.isActive,
    });
    const companies = db.getCompanies();
    set({ companies });
  },
  updateCompany: (company: Company) => {
    db.updateCompany(company.id, company);
    const companies = db.getCompanies();
    set({ companies });
    if (get().currentCompany?.id === company.id) {
      set({ currentCompany: company });
    }
  },
  deleteCompany: (companyId: string) => {
    db.deleteCompany(companyId);
    const companies = db.getCompanies();
    set({ companies });
    if (get().currentCompany?.id === companyId && companies.length > 0) {
      set({ currentCompany: companies[0] });
    }
  },

  language: getStoredLanguage(),
  setLanguage: (lang) => {
    const i18nLang = lang === "gujarati" ? "gu" : "en";
    localStorage.setItem("appLanguage", i18nLang);
    db.updateSettings({ language: lang });
    set({ language: lang });
    const i18n = window.__i18n;
    if (i18n) {
      i18n.changeLanguage(i18nLang);
    }
  },

  settings: db.getSettings(),
  loadSettings: () => set({ settings: db.getSettings() }),
  updateSettings: (data) => {
    const settings = db.updateSettings(data);
    set({ settings });
  },
  setDarkMode: (dark) => {
    db.updateSettings({ darkMode: dark });
    set({ settings: { ...get().settings, darkMode: dark } });
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  parties: db.getParties(),
  loadParties: () => set({ parties: db.getParties() }),
  searchParties: (query) => {
    const parties = db.getParties();
    const q = query.toLowerCase();
    return parties.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q),
    );
  },

  suppliers: db.getSuppliers(),
  loadSuppliers: () => set({ suppliers: db.getSuppliers() }),
  searchSuppliers: (query) => {
    const suppliers = db.getSuppliers();
    const q = query.toLowerCase();
    return suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q),
    );
  },

  inventoryItems: db.getInventoryItems(),
  loadInventory: () => set({ inventoryItems: db.getInventoryItems() }),

  payments: db.getPayments(),
  loadPayments: () => set({ payments: db.getPayments() }),

  bills: db.getBills(),
  loadBills: () => set({ bills: db.getBills() }),

  purchases: db.getPurchases(),
  loadPurchases: () => set({ purchases: db.getPurchases() }),

  ledgerEntries: db.getLedgerEntries(),
  loadLedgerEntries: () => set({ ledgerEntries: db.getLedgerEntries() }),

  vehicleRegisters: db.getVehicleRegisters(),
  loadVehicleRegisters: () =>
    set({ vehicleRegisters: db.getVehicleRegisters() }),

  refreshDataFromDb: () =>
    set({
      settings: db.getSettings(),
      parties: db.getParties(),
      suppliers: db.getSuppliers(),
      inventoryItems: db.getInventoryItems(),
      payments: db.getPayments(),
      bills: db.getBills(),
      purchases: db.getPurchases(),
      ledgerEntries: db.getLedgerEntries(),
      vehicleRegisters: db.getVehicleRegisters(),
    }),

  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  modalOpen: false,
  modalContent: "",
  modalData: {},
  openModal: (content, data) =>
    set({ modalOpen: true, modalContent: content, modalData: data || {} }),
  closeModal: () => set({ modalOpen: false, modalContent: "", modalData: {} }),

  notification: null,
  showNotification: (message, type) => set({ notification: { message, type } }),
  clearNotification: () => set({ notification: null }),

  shortcutsEnabled: true,
  toggleShortcuts: () => set({ shortcutsEnabled: !get().shortcutsEnabled }),

  invoiceCreationMode: null,
  setInvoiceCreationMode: (mode) => set({ invoiceCreationMode: mode }),
}));
