import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enApp from "../locales/en/app.json";
import enButtons from "../locales/en/buttons.json";
import enCommon from "../locales/en/common.json";
import enDashboard from "../locales/en/dashboard.json";
import enDialogs from "../locales/en/dialogs.json";
import enEmptyStates from "../locales/en/emptyStates.json";
import enForms from "../locales/en/forms.json";
import enHeader from "../locales/en/header.json";
import enInventory from "../locales/en/inventory.json";
import enKeyboard from "../locales/en/keyboard.json";
import enLedger from "../locales/en/ledger.json";
import enLogin from "../locales/en/login.json";
import enMessages from "../locales/en/messages.json";
import enNavigation from "../locales/en/navigation.json";
import enNotifications from "../locales/en/notifications.json";
import enParties from "../locales/en/parties.json";
import enPayments from "../locales/en/payments.json";
import enPlaceholders from "../locales/en/placeholders.json";
import enReports from "../locales/en/reports.json";
import enSettings from "../locales/en/settings.json";
import enSidebar from "../locales/en/sidebar.json";
import enStatuses from "../locales/en/statuses.json";
import enSuppliers from "../locales/en/suppliers.json";
import enTableHeaders from "../locales/en/tableHeaders.json";
import enValidation from "../locales/en/validation.json";
import enVehicle from "../locales/en/vehicle.json";
import enVehicleRegister from "../locales/en/vehicleRegister.json";

import guApp from "../locales/gu/app.json";
import guButtons from "../locales/gu/buttons.json";
import guCommon from "../locales/gu/common.json";
import guDashboard from "../locales/gu/dashboard.json";
import guDialogs from "../locales/gu/dialogs.json";
import guEmptyStates from "../locales/gu/emptyStates.json";
import guForms from "../locales/gu/forms.json";
import guHeader from "../locales/gu/header.json";
import guInventory from "../locales/gu/inventory.json";
import guKeyboard from "../locales/gu/keyboard.json";
import guLedger from "../locales/gu/ledger.json";
import guLogin from "../locales/gu/login.json";
import guMessages from "../locales/gu/messages.json";
import guNavigation from "../locales/gu/navigation.json";
import guNotifications from "../locales/gu/notifications.json";
import guParties from "../locales/gu/parties.json";
import guPayments from "../locales/gu/payments.json";
import guPlaceholders from "../locales/gu/placeholders.json";
import guReports from "../locales/gu/reports.json";
import guSettings from "../locales/gu/settings.json";
import guSidebar from "../locales/gu/sidebar.json";
import guStatuses from "../locales/gu/statuses.json";
import guSuppliers from "../locales/gu/suppliers.json";
import guTableHeaders from "../locales/gu/tableHeaders.json";
import guValidation from "../locales/gu/validation.json";
import guVehicle from "../locales/gu/vehicle.json";
import guVehicleRegister from "../locales/gu/vehicleRegister.json";

type LocaleNamespaceBundle = Record<string, unknown>;
type LocaleResources = Record<string, LocaleNamespaceBundle>;

declare global {
  interface Window {
    __i18n?: {
      changeLanguage: (lng: string) => Promise<unknown>;
    };
  }
}

const namespaces = [
  "app",
  "common",
  "dashboard",
  "inventory",
  "ledger",
  "settings",
  "vehicle",
  "vehicleRegister",
  "reports",
  "parties",
  "payments",
  "suppliers",
  "navigation",
  "header",
  "buttons",
  "placeholders",
  "dialogs",
  "messages",
  "validation",
  "statuses",
  "tableHeaders",
  "notifications",
  "forms",
  "emptyStates",
  "sidebar",
  "keyboard",
  "login",
] as const;

const enTranslations = {
  app: enApp,
  buttons: enButtons,
  common: enCommon,
  dashboard: enDashboard,
  dialogs: enDialogs,
  emptyStates: enEmptyStates,
  forms: enForms,
  header: enHeader,
  inventory: enInventory,
  keyboard: enKeyboard,
  ledger: enLedger,
  login: enLogin,
  messages: enMessages,
  navigation: enNavigation,
  notifications: enNotifications,
  parties: enParties,
  payments: enPayments,
  placeholders: enPlaceholders,
  reports: enReports,
  settings: enSettings,
  sidebar: enSidebar,
  statuses: enStatuses,
  suppliers: enSuppliers,
  tableHeaders: enTableHeaders,
  validation: enValidation,
  vehicle: enVehicle,
  vehicleRegister: enVehicleRegister,
};

const guTranslations = {
  app: guApp,
  buttons: guButtons,
  common: guCommon,
  dashboard: guDashboard,
  dialogs: guDialogs,
  emptyStates: guEmptyStates,
  forms: guForms,
  header: guHeader,
  inventory: guInventory,
  keyboard: guKeyboard,
  ledger: guLedger,
  login: guLogin,
  messages: guMessages,
  navigation: guNavigation,
  notifications: guNotifications,
  parties: guParties,
  payments: guPayments,
  placeholders: guPlaceholders,
  reports: guReports,
  settings: guSettings,
  sidebar: guSidebar,
  statuses: guStatuses,
  suppliers: guSuppliers,
  tableHeaders: guTableHeaders,
  validation: guValidation,
  vehicle: guVehicle,
  vehicleRegister: guVehicleRegister,
};

function buildResources(translations: LocaleResources) {
  const scoped = Object.fromEntries(
    namespaces.map((ns) => [ns, translations[ns] || {}]),
  ) as LocaleResources;

  return {
    translation: translations,
    ...scoped,
  };
}

function humanizeMissingKey(key: string): string {
  const source = key.includes(".") ? key.split(".").pop() || key : key;
  return source
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

const savedLanguage = localStorage.getItem("appLanguage") || "en";
const currentLng = savedLanguage === "gu" ? "gu" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: buildResources(enTranslations),
    gu: buildResources(guTranslations),
  },
  lng: currentLng,
  fallbackLng: "en",
  ns: ["translation", ...namespaces],
  defaultNS: "translation",
  returnNull: false,
  returnEmptyString: false,
  parseMissingKeyHandler: (key) => humanizeMissingKey(key),
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("appLanguage", lng);
  document.documentElement.lang = lng;
});

window.__i18n = i18n;

export default i18n;
