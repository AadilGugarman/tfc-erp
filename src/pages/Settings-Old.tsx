import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BackupRestorePanel } from "@/components/BackupRestorePanel";
import type { Company, Settings } from "@/db/schema";
import { updateBackupConfig, type BackupConfig } from "@/services/backup";
import {
  Save,
  X,
  Moon,
  Sun,
  Globe,
  Building2,
  Percent,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Check,
} from "lucide-react";

type AppLanguage = Settings["language"];
type CompanyLanguage = Company["language"];

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
  const {
    settings,
    updateSettings,
    showNotification,
    language,
    setLanguage,
    companies,
    currentCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    setCurrentCompany,
  } = useAppStore();

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
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<
    Omit<Company, "createdAt" | "updatedAt">
  >({
    id: "",
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    gstin: "",
    invoicePrefix: "",
    language: "english",
    theme: "light",
    isActive: true,
  });

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
      localStorage.removeItem("fruit_market_erp_db");
      window.location.reload();
    }
  };

  const saveBackupConfig = async (config: BackupConfig) => {
    await updateBackupConfig(config);
  };

  const handleSaveCompany = () => {
    if (!companyForm.name) {
      showNotification(
        tx("validation.required", "Company name is required"),
        "error",
      );
      return;
    }

    if (editingCompany) {
      updateCompany({
        ...companyForm,
        id: editingCompany.id,
        createdAt: editingCompany.createdAt,
        updatedAt: new Date().toISOString(),
      });
      showNotification(t("notifications.updated"), "success");
    } else {
      createCompany({
        ...companyForm,
        id: `company-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showNotification(t("notifications.created"), "success");
    }

    setShowCompanyModal(false);
    setEditingCompany(null);
    setCompanyForm({
      id: "",
      name: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      gstin: "",
      invoicePrefix: "",
      language: "english",
      theme: "light",
      isActive: true,
    });
  };

  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({
        id: company.id,
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
    } else {
      setEditingCompany(null);
      setCompanyForm({
        id: "",
        name: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
        gstin: "",
        invoicePrefix: "",
        language: "english",
        theme: "light",
        isActive: true,
      });
    }
    setShowCompanyModal(true);
  };

  const tabs = [
    { id: "basic", label: t("settings.basic"), icon: Building2 },
    { id: "billing", label: t("settings.billing"), icon: Percent },
    { id: "language", label: t("settings.language"), icon: Globe },
    { id: "theme", label: t("settings.theme"), icon: Sun },
    { id: "company", label: t("settings.company"), icon: Building2 },
    { id: "backup", label: t("settings.backup"), icon: Trash2 },
  ];

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#0f1628]">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {tx("settings.title", "Settings")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tx("settings.subtitle", "Manage your business settings and preferences")}
          </p>
        </div>
      </div>

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
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {activeTab === "basic" && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {t("settings.businessName")}
            </span>
          </div>
          <Input
            label={t("settings.businessName")}
            value={form.businessName}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessName: e.target.value }))
            }
          />
          <TextArea
            label={t("settings.businessAddress")}
            value={form.businessAddress}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessAddress: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("settings.city")}
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label={t("settings.state")}
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value }))
              }
            />
          </div>
          <Input
            label={t("settings.phone")}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label={t("settings.email")}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t("settings.gstin")}
            value={form.gstin}
            onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
          />
        </div>
      )}

      {activeTab === "company" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {t("settings.manageCompanies")}
            </span>
            <Button size="sm" onClick={() => openCompanyModal()}>
              <Plus className="h-3.5 w-3.5" />
              {t("settings.createCompany")}
            </Button>
          </div>

          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`${card} flex items-center justify-between ${currentCompany?.id === company.id ? "border-blue-500 dark:border-blue-600" : ""}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {company.name}
                    </span>
                    {currentCompany?.id === company.id && (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-semibold uppercase tracking-[0.06em]">
                        {tx("settings.active", "Active")}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {company.address}
                  </p>
                  <p className="text-[11px] text-slate-400">{company.email}</p>
                </div>
                <div className="flex gap-2">
                  {currentCompany?.id !== company.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentCompany(company.id)}
                    >
                      {tx("buttons.switchCompany", "Switch")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCompanyModal(company)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  {companies.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            tx(
                              "dialogs.deleteConfirmation",
                              "Delete this company?",
                            ),
                          )
                        ) {
                          deleteCompany(company.id);
                          showNotification(
                            t("notifications.deleted"),
                            "success",
                          );
                        }
                      }}
                    >
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {t("settings.billing")}
            </span>
          </div>
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
          />
          <Input
            label={t("settings.currency")}
            value={form.currency}
            onChange={(e) =>
              setForm((f) => ({ ...f, currency: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("settings.billPrefix")}
              value={form.billPrefix}
              onChange={(e) =>
                setForm((f) => ({ ...f, billPrefix: e.target.value }))
              }
            />
            <Input
              label={t("settings.purchasePrefix")}
              value={form.purchasePrefix}
              onChange={(e) =>
                setForm((f) => ({ ...f, purchasePrefix: e.target.value }))
              }
            />
          </div>
        </div>
      )}

      {activeTab === "language" && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {t("settings.selectLanguage")}
            </span>
          </div>
          <div className="space-y-3">
            {languageOptions.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setForm((f) => ({ ...f, language: lang.value }))}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  form.language === lang.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-[#2a3550] hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <p className="text-[13px] font-medium flex-1 text-slate-800 dark:text-slate-200">
                  {lang.label}
                </p>
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    form.language === lang.value
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300"
                  }`}
                >
                  {form.language === lang.value && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "theme" && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Sun className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
              {t("settings.theme")}
            </span>
          </div>
          <div className="space-y-3">
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
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    form.darkMode === theme.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-slate-200 dark:border-[#2a3550] hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <Icon className="h-5 w-5 text-slate-500" />
                  <p className="text-[13px] font-medium flex-1 text-slate-800 dark:text-slate-200">
                    {theme.label}
                  </p>
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      form.darkMode === theme.value
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {form.darkMode === theme.value && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "backup" && (
        <div className="space-y-4">
          <BackupRestorePanel
            onNotify={showNotification}
            onSaveConfig={saveBackupConfig}
          />

          <div className={`${card} space-y-3 max-w-xl`}>
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 block">
              {tx("settings.dangerZone", "Danger Zone")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => setShowReset(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {tx("settings.resetAllData", "Reset All Data")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#22304a]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={save}>
          <Save className="h-3.5 w-3.5" />
          {t("settings.save")}
        </Button>
      </div>

      <Modal
        open={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false);
          setEditingCompany(null);
        }}
        title={
          editingCompany
            ? t("settings.editCompany")
            : t("settings.createCompany")
        }
      >
        <div className="space-y-4">
          <Input
            label={t("settings.companyName")}
            value={companyForm.name}
            onChange={(e) =>
              setCompanyForm((f) => ({ ...f, name: e.target.value }))
            }
          />
          <Input
            label={t("settings.businessAddress")}
            value={companyForm.address}
            onChange={(e) =>
              setCompanyForm((f) => ({ ...f, address: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("settings.city")}
              value={companyForm.city}
              onChange={(e) =>
                setCompanyForm((f) => ({ ...f, city: e.target.value }))
              }
            />
            <Input
              label={t("settings.state")}
              value={companyForm.state}
              onChange={(e) =>
                setCompanyForm((f) => ({ ...f, state: e.target.value }))
              }
            />
          </div>
          <Input
            label={t("settings.phone")}
            value={companyForm.phone}
            onChange={(e) =>
              setCompanyForm((f) => ({ ...f, phone: e.target.value }))
            }
          />
          <Input
            label={t("settings.email")}
            type="email"
            value={companyForm.email}
            onChange={(e) =>
              setCompanyForm((f) => ({ ...f, email: e.target.value }))
            }
          />
          <Input
            label={t("settings.gstin")}
            value={companyForm.gstin}
            onChange={(e) =>
              setCompanyForm((f) => ({ ...f, gstin: e.target.value }))
            }
          />
          <Input
            label={t("settings.invoicePrefix")}
            value={companyForm.invoicePrefix}
            onChange={(e) =>
              setCompanyForm((f) => ({ ...f, invoicePrefix: e.target.value }))
            }
          />
          <Select
            label={t("settings.language")}
            value={companyForm.language}
            onChange={(e) =>
              setCompanyForm((f) => ({
                ...f,
                language: normalizeCompanyLanguage(e.target.value),
              }))
            }
            options={companyLanguageOptions.map((lang) => ({
              value: lang.value,
              label: t(`settings.${lang.value}`, lang.label),
            }))}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCompanyModal(false);
                setEditingCompany(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={handleSaveCompany}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

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
