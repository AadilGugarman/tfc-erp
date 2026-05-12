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

  language: "english" | "gujarati" | "hindi";
  setLanguage: (lang: "english" | "gujarati" | "hindi") => void;

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
}

const DEFAULT_COMPANY: Company = {
  id: "default-company",
  name: "TFC - Talha Fruit Co.",
  address: "123 Market Street",
  city: "Ahmedabad",
  state: "Gujarat",
  phone: "+91-9999999999",
  email: "info@tfc.com",
  gstin: "24AABCT1234H1Z0",
  language: "english",
  theme: "light",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const getStoredLanguage = (): "english" | "gujarati" | "hindi" => {
  const stored = localStorage.getItem("appLanguage");
  if (stored === "gu" || stored === "gujarati") return "gujarati";
  if (stored === "hi" || stored === "hindi") return "hindi";
  return "english";
};

const getStoredCompanies = (): Company[] => {
  try {
    const stored = localStorage.getItem("talha-fruit-companies");
    if (stored) return JSON.parse(stored);
  } catch {
    return [DEFAULT_COMPANY];
  }
  return [DEFAULT_COMPANY];
};

const saveCompanies = (companies: Company[]) => {
  localStorage.setItem("talha-fruit-companies", JSON.stringify(companies));
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

  companies: getStoredCompanies(),
  currentCompany: getStoredCompanies()[0] || DEFAULT_COMPANY,
  loadCompanies: () => {
    const companies = getStoredCompanies();
    set({ companies });
  },
  setCurrentCompany: (companyId: string) => {
    const companies = get().companies;
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      localStorage.setItem("talha-fruit-company", companyId);
      set({ currentCompany: company });
    }
  },
  createCompany: (company: Company) => {
    const companies = [...get().companies, company];
    saveCompanies(companies);
    set({ companies });
  },
  updateCompany: (company: Company) => {
    const companies = get().companies.map((c) =>
      c.id === company.id ? company : c,
    );
    saveCompanies(companies);
    set({ companies });
    if (get().currentCompany?.id === company.id) {
      set({ currentCompany: company });
    }
  },
  deleteCompany: (companyId: string) => {
    const companies = get().companies.filter((c) => c.id !== companyId);
    saveCompanies(companies);
    set({ companies });
    if (get().currentCompany?.id === companyId && companies.length > 0) {
      set({ currentCompany: companies[0] });
    }
  },

  language: getStoredLanguage(),
  setLanguage: (lang) => {
    const i18nLang =
      lang === "gujarati" ? "gu" : lang === "hindi" ? "hi" : "en";
    localStorage.setItem("appLanguage", i18nLang);
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
}));
