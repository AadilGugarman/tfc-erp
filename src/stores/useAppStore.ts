import { create } from "zustand";
import type {
  Settings,
  Party,
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
  companiesLoaded: boolean;
  currentCompany?: Company | null; // Make optional
  currentCompanyId: string | null;
  loadCompanies: () => void;
  setCurrentCompany: (companyId: string) => void;
  setCurrentCompanyId: (companyId: string) => void;
  createCompany: (
    company: Omit<Company, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Company>;
  updateCompany: (company: Company) => Company | null;
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
  return settings.appearance?.language || "english";
};

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),

  authenticated: authService.isAuthenticatedSync(),
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

  companies: db.getCompaniesSync(),
  companiesLoaded: false,
  currentCompanyId: authService.getCurrentCompany(),
  currentCompany: (() => {
    const storedCompanyId = authService.getCurrentCompany();
    if (!storedCompanyId) return undefined;
    return (
      db.getCompaniesSync().find((c) => c.id === storedCompanyId) ?? undefined
    );
  })(),
  loadCompanies: async () => {
    const companies = await db.getCompanies();
    let storedCompanyId = authService.getCurrentCompany(); // Get remembered company from localStorage

    // Auto-select first company if none is stored but companies exist
    if (!storedCompanyId && companies.length > 0) {
      storedCompanyId = companies[0].id;
      authService.setCurrentCompany(storedCompanyId);
    }

    const currentCompany = storedCompanyId
      ? companies.find((c) => c.id === storedCompanyId)
      : undefined; // Set if remembered and valid, otherwise undefined

    set({
      companies,
      currentCompany,
      currentCompanyId: currentCompany?.id || null,
      companiesLoaded: true,
    });
  },
  setCurrentCompany: (companyId: string) => {
    const companies = get().companies;
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      authService.setCurrentCompany(companyId);
      set({ currentCompany: company, currentCompanyId: companyId });
      // Refresh all data for the new company
      get().refreshDataFromDb();
    }
  },
  setCurrentCompanyId: (companyId: string) => {
    const { companies } = get();
    const company = companies.find((c) => c.id === companyId);

    // Always update authService/localStorage even if company object isn't in store yet
    authService.setCurrentCompany(companyId);

    if (company) {
      set({ currentCompanyId: companyId, currentCompany: company });
      get().refreshDataFromDb();
    } else {
      // If company object isn't in store, just set the ID
      set({ currentCompanyId: companyId, currentCompany: null });
    }
  },
  createCompany: async (
    company: Omit<Company, "id" | "createdAt" | "updatedAt">,
  ) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("User is not logged in.");
    }

    const ownerId = currentUser.id;
    const newCompany = await db.createCompany({
      ...company,
      ownerId,
      financialYearStart: company.financialYearStart || 4,
      financialYearEnd: company.financialYearEnd || 3,
    });

    const accessibleCompanyIds = authService.getAccessibleCompanies();
    const updatedCompanyIds = [
      ...new Set([...accessibleCompanyIds, newCompany.id]),
    ];
    await authService.updateUserCompanies(
      currentUser.id,
      updatedCompanyIds,
      newCompany.id,
    );

    authService.addAccessibleCompany(newCompany.id);

    // Refresh the company list
    const companies = await db.getCompanies();
    set({
      companies,
      currentCompany: newCompany,
      currentCompanyId: newCompany.id,
    });

    get().refreshDataFromDb();
    return newCompany;
  },
  updateCompany: async (company: Company) => {
    const updatedCompany = await db.updateCompany(company);
    if (!updatedCompany) return null;

    const companies = await db.getCompanies();
    set({ companies });

    if (get().currentCompany?.id === company.id) {
      set({ currentCompany: updatedCompany });
    }

    return updatedCompany;
  },
  deleteCompany: async (companyId: string) => {
    await db.deleteCompany(companyId);
    authService.removeAccessibleCompany(companyId);

    const companies = await db.getCompanies();
    const { currentCompanyId } = get();

    if (currentCompanyId === companyId) {
      if (companies.length > 0) {
        const nextCompany = companies[0];
        authService.setCurrentCompany(nextCompany.id);
        set({
          companies,
          currentCompany: nextCompany,
          currentCompanyId: nextCompany.id,
        });
        get().refreshDataFromDb();
      } else {
        set({
          companies,
          currentCompany: null,
          currentCompanyId: null,
        });
        authService.clearCurrentCompany();
      }
    } else {
      set({ companies });
    }
  },

  language: getStoredLanguage(),
  setLanguage: (lang) => {
    const i18nLang = lang === "gujarati" ? "gu" : "en";
    localStorage.setItem("appLanguage", i18nLang);
    const currentSettings = get().settings;
    db.updateSettings({
      appearance: { ...currentSettings.appearance, language: lang },
    });
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
    const currentSettings = get().settings;
    const theme = dark ? "dark" : "light";
    db.updateSettings({
      appearance: { ...currentSettings.appearance, theme },
    });
    set({
      settings: {
        ...currentSettings,
        appearance: { ...currentSettings.appearance, theme },
      },
    });
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  parties: [],
  loadParties: () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ parties: [] });
      return;
    }
    const parties = db.getPartiesByCompany(currentCompanyId);
    set({ parties });
  },
  searchParties: (query) => {
    const { currentCompanyId, parties } = get();
    if (!currentCompanyId) return [];
    const q = query.toLowerCase();
    return parties.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q),
    );
  },

  inventoryItems: [],
  loadInventory: () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ inventoryItems: [] });
      return;
    }
    const inventoryItems = db.getInventoryItemsByCompany(currentCompanyId);
    set({ inventoryItems });
  },

  payments: [],
  loadPayments: () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ payments: [] });
      return;
    }
    const payments = db.getPaymentsByCompany(currentCompanyId);
    set({ payments });
  },

  bills: [],
  loadBills: () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ bills: [] });
      return;
    }
    const bills = db.getBillsByCompany(currentCompanyId);
    set({ bills });
  },

  purchases: [],
  loadPurchases: () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ purchases: [] });
      return;
    }
    const purchases = db.getPurchasesByCompany(currentCompanyId);
    set({ purchases });
  },

  ledgerEntries: [],
  loadLedgerEntries: () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ ledgerEntries: [] });
      return;
    }
    const ledgerEntries = db.getLedgerEntriesByCompany(currentCompanyId);
    set({ ledgerEntries });
  },

  vehicleRegisters: [],
  loadVehicleRegisters: async () => {
    const { currentCompanyId } = get();
    if (!currentCompanyId) {
      set({ vehicleRegisters: [] });
      return;
    }
    const vehicleRegisters =
      await db.getVehicleRegistersByCompany(currentCompanyId);
    set({ vehicleRegisters });
  },

  refreshDataFromDb: async () => {
    const { currentCompanyId } = get();

    // ENFORCE: No data loading without a company context
    if (!currentCompanyId) {
      console.debug("[Store] No company selected - skipping data load");
      set({
        parties: [],
        inventoryItems: [],
        payments: [],
        bills: [],
        purchases: [],
        ledgerEntries: [],
        vehicleRegisters: [],
      });
      return;
    }

    // ENFORCE: No backend data loads without a valid access token
    if (!authService.isAuthenticatedSync()) {
      console.debug("[Store] Skipping DB refresh: auth token not available.");
      set({
        parties: [],
        inventoryItems: [],
        payments: [],
        bills: [],
        purchases: [],
        ledgerEntries: [],
        vehicleRegisters: [],
      });
      return;
    }

    // Load ONLY company-specific data
    const parties = db.getPartiesByCompany(currentCompanyId);
    const inventoryItems = db.getInventoryItemsByCompany(currentCompanyId);
    const payments = db.getPaymentsByCompany(currentCompanyId);
    const bills = db.getBillsByCompany(currentCompanyId);
    const purchases = db.getPurchasesByCompany(currentCompanyId);
    const ledgerEntries = db.getLedgerEntriesByCompany(currentCompanyId);
    const vehicleRegisters =
      await db.getVehicleRegistersByCompany(currentCompanyId);

    set({
      settings: db.getSettings(),
      parties,
      inventoryItems,
      payments,
      bills,
      purchases,
      ledgerEntries,
      vehicleRegisters,
    });
  },

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
