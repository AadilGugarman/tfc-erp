import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BackupRestorePanel } from "@/components/BackupRestorePanel";
import { resetDatabase } from "@/db/db";
import type { Settings } from "@/db/schema";
import { updateBackupConfig, type BackupConfig } from "@/services/backup";
import {
  Save,
  Moon,
  Sun,
  Globe,
  Building2,
  Percent,
  Trash2,
  ChevronRight,
  Check,
} from "lucide-react";

type AppLanguage = Settings["language"];

type CompanyLanguage = AppLanguage;

const languageOptions = [
  { value: "english", label: "English" },
  { value: "gujarati", label: "ગુજરાતી" },
] as const satisfies readonly { value: AppLanguage; label: string }[];

const companyLanguageOptions = languageOptions;

const normalizeCompanyLanguage = (value: string): CompanyLanguage => {
  if (value === "gujarati") return "gujarati";
  return "english";
};

export function SettingsPage() {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) =>
    t(key, { defaultValue: fallback });
  const { settings, updateSettings, showNotification, language, setLanguage } =
    useAppStore();

  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    city: settings.city,
    state: settings.state,
    phone: settings.phone,
    email: settings.email,
    gstin: settings.gstin,
    commissionPercent: settings.commissionPercent,
    taxPercent: settings.taxPercent,
    currency: settings.currency,
    billPrefix: settings.billPrefix,
    purchasePrefix: settings.purchasePrefix,
    language: language,
    darkMode: settings.darkMode,
    lowStockAlert: settings.lowStockAlert,
  });

  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    setForm({
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      city: settings.city,
      state: settings.state,
      phone: settings.phone,
      email: settings.email,
      gstin: settings.gstin,
      commissionPercent: settings.commissionPercent,
      taxPercent: settings.taxPercent,
      currency: settings.currency,
      billPrefix: settings.billPrefix,
      purchasePrefix: settings.purchasePrefix,
      language: language,
      darkMode: settings.darkMode,
      lowStockAlert: settings.lowStockAlert,
    });
  }, [settings, language]);

  const save = () => {
    updateSettings({
      businessName: form.businessName,
      businessAddress: form.businessAddress,
      city: form.city,
      state: form.state,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      commissionPercent: form.commissionPercent,
      taxPercent: form.taxPercent,
      currency: form.currency,
      billPrefix: form.billPrefix,
      purchasePrefix: form.purchasePrefix,
      language: form.language,
      darkMode: form.darkMode,
      lowStockAlert: form.lowStockAlert,
    });

    if (form.language !== language) {
      setLanguage(form.language);
    }

    if (form.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    showNotification(t("notifications.saved"), "success");
  };

  const resetAll = () => {
    if (confirm(t("settings.backup"))) {
      resetDatabase();
      window.location.reload();
    }
  };

  const saveBackupConfig = async (config: BackupConfig) => {
    await updateBackupConfig(config);
  };

  const tabs = [
    { id: "basic", label: t("settings.basic"), icon: Building2 },
    { id: "billing", label: t("settings.billing"), icon: Percent },
    { id: "language", label: t("settings.language"), icon: Globe },
    { id: "theme", label: t("settings.theme"), icon: Sun },
    { id: "backup", label: t("settings.backup"), icon: Trash2 },
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <div className="w-56 border-r border-slate-200 dark:border-[#2a3550] bg-slate-50 dark:bg-[#0f1628] flex flex-col">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2332]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-5">
            {activeTab === "basic" && (
              <div className="max-w-2xl space-y-5">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {tx("settings.businessInformation", "Business Information")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx(
                      "settings.businessInfoDesc",
                      "Your primary business details",
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label={t("settings.businessName")}
                    value={form.businessName}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        businessName: e.target.value,
                      }))
                    }
                    placeholder={tx(
                      "placeholders.businessName",
                      "e.g., TFC Billing",
                    )}
                  />

                  <TextArea
                    label={t("settings.businessAddress")}
                    value={form.businessAddress}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        businessAddress: e.target.value,
                      }))
                    }
                    placeholder={tx(
                      "placeholders.address",
                      "Your business address",
                    )}
                    rows={2}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t("settings.city")}
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder={tx("placeholders.city", "City")}
                    />
                    <Input
                      label={t("settings.state")}
                      value={form.state}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, state: e.target.value }))
                      }
                      placeholder={tx("placeholders.state", "State")}
                    />
                  </div>

                  <Input
                    label={t("settings.phone")}
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder={tx("placeholders.phone", "+91 XXXXX XXXXX")}
                    type="tel"
                  />

                  <Input
                    label={t("settings.email")}
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder={tx(
                      "placeholders.email",
                      "business@example.com",
                    )}
                    type="email"
                  />

                  <Input
                    label={t("settings.gstin")}
                    value={form.gstin}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gstin: e.target.value }))
                    }
                    placeholder={tx(
                      "placeholders.gstin",
                      "GST Identification Number",
                    )}
                  />
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="max-w-2xl space-y-5">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t("settings.billing")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx(
                      "settings.billingDesc",
                      "Configure billing and taxation settings",
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t("settings.commissionPercent")}
                      type="number"
                      value={form.commissionPercent}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          commissionPercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      suffix="%"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <Input
                      label={t("settings.taxPercent")}
                      type="number"
                      value={form.taxPercent}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          taxPercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      suffix="%"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>

                  <Input
                    label={t("settings.currency")}
                    value={form.currency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currency: e.target.value }))
                    }
                    placeholder="₹"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t("settings.billPrefix")}
                      value={form.billPrefix}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          billPrefix: e.target.value,
                        }))
                      }
                      placeholder="INV"
                    />
                    <Input
                      label={t("settings.purchasePrefix")}
                      value={form.purchasePrefix}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          purchasePrefix: e.target.value,
                        }))
                      }
                      placeholder="PO"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "language" && (
              <div className="max-w-2xl space-y-5">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t("settings.selectLanguage")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx(
                      "settings.languageDesc",
                      "Choose your preferred language",
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() =>
                        setForm((f) => ({ ...f, language: lang.value }))
                      }
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        form.language === lang.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-slate-200 dark:border-[#2a3550] hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {lang.label}
                      </p>
                      {form.language === lang.value && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <div className="max-w-2xl space-y-5">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t("settings.theme")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx(
                      "settings.themeDesc",
                      "Choose your preferred appearance",
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: false, label: t("settings.lightMode"), icon: Sun },
                    { value: true, label: t("settings.darkMode"), icon: Moon },
                  ].map((theme) => {
                    const Icon = theme.icon;
                    return (
                      <button
                        key={String(theme.value)}
                        onClick={() =>
                          setForm((f) => ({ ...f, darkMode: theme.value }))
                        }
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          form.darkMode === theme.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            : "border-slate-200 dark:border-[#2a3550] hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {theme.label}
                        </p>
                        {form.darkMode === theme.value && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "backup" && (
              <div className="max-w-2xl space-y-5">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t("settings.backup")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx("settings.backupDesc", "Backup and restore your data")}
                  </p>
                </div>

                <BackupRestorePanel
                  onNotify={showNotification}
                  onSaveConfig={saveBackupConfig}
                />

                <div className="pt-5 border-t border-slate-200 dark:border-[#2a3550]">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {tx("settings.dangerZone", "Danger Zone")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx("settings.dangerZoneDesc", "Irreversible actions")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => setShowReset(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {tx("settings.resetAllData", "Reset All Data")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 border-t border-slate-200 dark:border-[#2a3550] bg-slate-50/50 dark:bg-slate-900/20 px-8 py-3.5 flex justify-end gap-3 backdrop-blur-sm">
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t("common.cancel")}
            </Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              {t("settings.save")}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={showReset}
        onClose={() => setShowReset(false)}
        title={tx("settings.resetAllData", "Reset All Data")}
        size="sm"
      >
        <p className="text-[12px] text-slate-600 dark:text-slate-300 mb-4">
          {tx(
            "settings.resetWarning",
            "This will permanently delete all parties, suppliers, bills, payments, inventory, and settings. This action cannot be undone.",
          )}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReset(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" size="sm" onClick={resetAll}>
            {tx("settings.confirmResetAll", "Yes, Reset Everything")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
