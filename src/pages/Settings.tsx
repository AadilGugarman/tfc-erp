import { useEffect, useState, useMemo, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import {
  Section,
  PremiumInput,
  PremiumTextarea,
  PremiumModal,
  PageTransition,
  useToast,
  PremiumSelect,
} from "@/components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { BackupRestorePanel } from "@/components/BackupRestorePanel";
import { resetDatabase } from "@/db/db";
import type { Settings, Bill } from "@/db/schema";
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
  RefreshCw,
  Settings as SettingsIcon,
  Search,
  Wallet,
  FileText,
  Database,
  Palette,
  Shield,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  Printer,
  Download,
  Calendar,
  DollarSign,
  AlertTriangle,
  Type,
  Sparkles,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock,
  History,
  Cloud,
  FileCode,
} from "lucide-react";
import { cn } from "@/utils/cn";

// --- Types ---
type SettingsCategory =
  | "company"
  | "financial"
  | "invoice"
  | "backup"
  | "appearance"
  | "security";

interface SettingsCategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: any;
  description: string;
}

// --- Components ---

const SectionDivider = ({ label }: { label?: string }) => (
  <div className="relative py-4">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
    </div>
    {label && (
      <div className="relative flex justify-center">
        <span className="px-3 bg-white dark:bg-[#111827] text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
    )}
  </div>
);

const Toggle = ({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {label}
      </span>
      {description && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </span>
      )}
    </div>
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  </div>
);

const ColorPicker = ({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
      {label}
    </label>
    <div className="flex items-center gap-4">
      <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer p-0 border-none scale-150"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-mono font-bold uppercase text-slate-500">
          {value}
        </span>
        {description && (
          <span className="text-[10px] text-slate-400">{description}</span>
        )}
      </div>
    </div>
  </div>
);

const FileUpload = ({
  label,
  value,
  onChange,
  description,
  icon: Icon = ImageIcon,
}: {
  label: string;
  value?: string;
  onChange: (val: string | undefined) => void;
  description?: string;
  icon?: any;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
        {label}
      </label>
      <div className="flex items-start gap-4">
        <div className="relative group">
          <div
            className={cn(
              "w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
              value
                ? "border-blue-500 bg-blue-50/10"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
            )}
          >
            {value ? (
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <Icon className="w-8 h-8 text-slate-400" />
            )}
          </div>
          {value && (
            <button
              onClick={() => onChange(undefined)}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description ||
              "Upload an image. Recommended size 300x100px. PNG or JPG format."}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-2" />
              Upload Image
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function SettingsPage() {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) =>
    t(key, { defaultValue: fallback });
  const { settings, updateSettings, language, setLanguage } = useAppStore();
  const { success, error, warning } = useToast();

  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("company");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  const [form, setForm] = useState<Settings>({ ...settings });

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const categories: SettingsCategoryConfig[] = [
    {
      id: "company",
      label: t("settings.company") || "Company",
      icon: Building2,
      description: "Business information and branding",
    },
    {
      id: "financial",
      label: t("settings.financial") || "Financial",
      icon: Wallet,
      description: "Fiscal year, currency, and tax settings",
    },
    {
      id: "invoice",
      label: t("settings.invoice") || "Invoice",
      icon: FileText,
      description: "Templates and print preferences",
    },
    {
      id: "backup",
      label: t("settings.backup") || "Backup & Data",
      icon: Database,
      description: "Database management and security",
    },
    {
      id: "appearance",
      label: t("settings.appearance") || "Appearance",
      icon: Palette,
      description: "Theme and display preferences",
    },
    {
      id: "security",
      label: t("settings.security") || "Security",
      icon: Shield,
      description: "Data encryption and access controls",
    },
  ];

  const filteredCategories = categories.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCategoryConfig = categories.find((c) => c.id === activeCategory);

  const handleSave = () => {
    try {
      updateSettings(form);
      if (form.language !== language) {
        setLanguage(form.language);
      }
      if (form.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      success(t("notifications.saved"), "Settings updated successfully");
    } catch (err) {
      error("Error", "Failed to save settings");
    }
  };

  const resetAll = () => {
    try {
      resetDatabase();
      success("Reset Successful", "Database has been reset");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      error("Error", "Failed to reset database");
    }
  };

  const saveBackupConfig = async (config: BackupConfig) => {
    await updateBackupConfig(config);
  };

  // Mock Invoice for Preview
  const mockInvoice: Partial<Bill> = {
    billNo: `${form.billPrefix}-1001`,
    date: new Date().toISOString(),
    partyName: "Sample Customer",
    items: [
      {
        id: "1",
        fruitName: "Apple",
        grade: "A",
        boxCount: 10,
        weightPerBox: 20,
        totalWeight: 200,
        rate: 80,
        amount: 16000,
        lotNo: "L001",
      },
      {
        id: "2",
        fruitName: "Mango",
        grade: "B",
        boxCount: 5,
        weightPerBox: 15,
        totalWeight: 75,
        rate: 120,
        amount: 9000,
        lotNo: "L002",
      },
    ],
    subtotal: 25000,
    commission: 750,
    taxAmount: 4500,
    total: 30250,
    previousBalance: 5000,
    paidAmount: 10000,
    netBalance: 25250,
    notes: form.termsAndConditions || "Thank you for your business!",
  };

  const renderContent = () => {
    switch (activeCategory) {
      case "company":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Primary details for your invoices and documents.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="Business Name"
                    value={form.businessName}
                    onChange={(e) =>
                      setForm({ ...form, businessName: e.target.value })
                    }
                    placeholder="e.g., Talha Fruit Company"
                  />
                  <PremiumInput
                    label="Legal Name"
                    value={form.legalName}
                    onChange={(e) =>
                      setForm({ ...form, legalName: e.target.value })
                    }
                    placeholder="Legal Business Name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="GSTIN"
                    value={form.gstin}
                    onChange={(e) =>
                      setForm({ ...form, gstin: e.target.value.toUpperCase() })
                    }
                    placeholder="15-digit GST ID"
                  />
                  <PremiumInput
                    label="PAN Number"
                    value={form.panNumber}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        panNumber: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="PAN Card Number"
                  />
                </div>
                <PremiumTextarea
                  label="Business Address"
                  value={form.businessAddress}
                  onChange={(e) =>
                    setForm({ ...form, businessAddress: e.target.value })
                  }
                  placeholder="Enter full address"
                  rows={3}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <PremiumInput
                    label="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                  />
                  <PremiumInput
                    label="State"
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                    placeholder="State"
                  />
                  <PremiumInput
                    label="Pincode"
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                      })
                    }
                    placeholder="6-digit Pincode"
                  />
                </div>
                <PremiumInput
                  label="Country"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="Country"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Contact Details</CardTitle>
                  <CardDescription>
                    How customers can reach you.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="Phone Number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    placeholder="10-digit mobile number"
                    type="tel"
                  />
                  <PremiumInput
                    label="Email Address"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="business@example.com"
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="WhatsApp Number"
                    value={form.whatsappPhone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        whatsappPhone: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      })
                    }
                    placeholder="For sending digital invoices"
                  />
                  <PremiumInput
                    label="Website"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Upload your logo and signature.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <FileUpload
                  label="Company Logo"
                  value={form.logoUrl}
                  onChange={(url) => setForm({ ...form, logoUrl: url })}
                  description="This logo will appear at the top of your invoices."
                />
                <SectionDivider />
                <FileUpload
                  label="Authorized Signature"
                  value={form.signatureUrl}
                  onChange={(url) => setForm({ ...form, signatureUrl: url })}
                  description="This signature will appear at the bottom of your invoices."
                  icon={FileText}
                />
              </CardContent>
            </Card>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Financial Year</CardTitle>
                    <CardDescription>
                      Define your financial year for accounting and reporting
                      purposes.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const startYear = now.getFullYear();
                      setForm({
                        ...form,
                        financialYearStart: `${startYear}-04-01`,
                        financialYearEnd: `${startYear + 1}-03-31`,
                      });
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Auto-generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="Financial Year Start"
                    type="date"
                    value={form.financialYearStart}
                    onChange={(e) =>
                      setForm({ ...form, financialYearStart: e.target.value })
                    }
                  />
                  <PremiumInput
                    label="Financial Year End"
                    type="date"
                    value={form.financialYearEnd}
                    onChange={(e) =>
                      setForm({ ...form, financialYearEnd: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Currency & Tax</CardTitle>
                  <CardDescription>
                    Configure your base currency and default tax rates.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumSelect
                    label="Currency"
                    value={form.currency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        currency: e.target.value,
                        currencySymbol:
                          {
                            INR: "₹",
                            USD: "$",
                            EUR: "€",
                            GBP: "£",
                          }[e.target.value] || "₹",
                      })
                    }
                    options={[
                      { value: "INR", label: "₹ Indian Rupee (INR)" },
                      { value: "USD", label: "$ US Dollar (USD)" },
                      { value: "EUR", label: "€ Euro (EUR)" },
                      { value: "GBP", label: "£ British Pound (GBP)" },
                    ]}
                  />
                  <PremiumInput
                    label="Currency Symbol"
                    value={form.currencySymbol}
                    onChange={(e) =>
                      setForm({ ...form, currencySymbol: e.target.value })
                    }
                    placeholder="₹"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumSelect
                    label="Tax System"
                    value={form.taxSystem}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        taxSystem: e.target.value as "gst" | "none",
                      })
                    }
                    options={[
                      { value: "gst", label: "GST (Goods and Services Tax)" },
                      { value: "none", label: "No Tax" },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <PremiumInput
                      label="Comm. %"
                      type="number"
                      value={form.commissionPercent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          commissionPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      suffix="%"
                    />
                    <PremiumInput
                      label="Tax %"
                      type="number"
                      value={form.taxPercent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          taxPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      suffix="%"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Rounding & Precision</CardTitle>
                  <CardDescription>
                    How amounts are calculated and displayed.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumSelect
                    label="Decimal Precision"
                    value={form.decimalPrecision.toString()}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        decimalPrecision: parseInt(e.target.value) || 2,
                      })
                    }
                    options={[
                      { value: "0", label: "0 (e.g. ₹100)" },
                      { value: "1", label: "1 (e.g. ₹100.5)" },
                      { value: "2", label: "2 (e.g. ₹100.50)" },
                      { value: "3", label: "3 (e.g. ₹100.500)" },
                    ]}
                  />
                  <PremiumSelect
                    label="Round Off Rule"
                    value={form.roundOffRule}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        roundOffRule: e.target.value as any,
                      })
                    }
                    options={[
                      { value: "nearest", label: "Round to nearest" },
                      { value: "up", label: "Round up" },
                      { value: "down", label: "Round down" },
                      { value: "bankers", label: "Banker's rounding" },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Sequential Numbering</CardTitle>
                  <CardDescription>
                    Set prefixes and starting points for your documents.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <PremiumInput
                      label="Bill Prefix"
                      value={form.billPrefix}
                      onChange={(e) =>
                        setForm({ ...form, billPrefix: e.target.value })
                      }
                    />
                    <PremiumInput
                      label="Next Bill #"
                      type="number"
                      value={form.nextBillNo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nextBillNo: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <PremiumInput
                      label="Purchase Prefix"
                      value={form.purchasePrefix}
                      onChange={(e) =>
                        setForm({ ...form, purchasePrefix: e.target.value })
                      }
                    />
                    <PremiumInput
                      label="Next Purchase #"
                      type="number"
                      value={form.nextPurchaseNo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nextPurchaseNo: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-4">
                    <PremiumInput
                      label="Vehicle Prefix"
                      value={form.vehiclePrefix}
                      onChange={(e) =>
                        setForm({ ...form, vehiclePrefix: e.target.value })
                      }
                    />
                    <PremiumInput
                      label="Next Vehicle #"
                      type="number"
                      value={form.nextVehicleEntryNo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nextVehicleEntryNo: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Date & Time Format</CardTitle>
                  <CardDescription>
                    Configure how dates and times are displayed.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumSelect
                    label="Date Format"
                    value={form.dateFormat}
                    onChange={(e) =>
                      setForm({ ...form, dateFormat: e.target.value })
                    }
                    options={[
                      {
                        value: "DD/MM/YYYY",
                        label: "DD/MM/YYYY (e.g. 25/12/2024)",
                      },
                      {
                        value: "MM/DD/YYYY",
                        label: "MM/DD/YYYY (e.g. 12/25/2024)",
                      },
                      {
                        value: "YYYY-MM-DD",
                        label: "YYYY-MM-DD (e.g. 2024-12-25)",
                      },
                    ]}
                  />
                  <PremiumSelect
                    label="Time Format"
                    value={form.timeFormat}
                    onChange={(e) =>
                      setForm({ ...form, timeFormat: e.target.value as any })
                    }
                    options={[
                      { value: "12h", label: "12-hour (e.g. 2:30 PM)" },
                      { value: "24h", label: "24-hour (e.g. 14:30)" },
                    ]}
                  />
                </div>
                <PremiumSelect
                  label="Timezone"
                  value={form.timezone}
                  onChange={(e) =>
                    setForm({ ...form, timezone: e.target.value })
                  }
                  options={[
                    { value: "Asia/Kolkata", label: "India Standard Time" },
                    { value: "UTC", label: "Coordinated Universal Time" },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        );

      case "invoice":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Invoice Template</CardTitle>
                  <CardDescription>
                    Choose and customize your invoice style.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <PremiumSelect
                  label="Template Style"
                  value={form.invoiceTemplate}
                  onChange={(e) =>
                    setForm({ ...form, invoiceTemplate: e.target.value as any })
                  }
                  options={[
                    { value: "modern", label: "Modern" },
                    { value: "classic", label: "Classic" },
                    { value: "minimal", label: "Minimal" },
                    { value: "professional", label: "Professional" },
                  ]}
                />
                <ColorPicker
                  label="Brand Color"
                  value={form.invoiceColorTheme}
                  onChange={(color) =>
                    setForm({ ...form, invoiceColorTheme: color })
                  }
                  description="Primary color used in invoice design"
                />
                <SectionDivider label="Invoice Options" />
                <Toggle
                  checked={form.enableQRCode}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, enableQRCode: checked })
                  }
                  label="Enable QR Code"
                  description="Add QR code for payment verification"
                />
                <Toggle
                  checked={form.autoInvoiceNumber}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, autoInvoiceNumber: checked })
                  }
                  label="Auto Invoice Number"
                  description="Automatically generate sequential numbers"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="Payment Due Days"
                    type="number"
                    value={form.dueDateDays}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dueDateDays: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Invoice Content</CardTitle>
                  <CardDescription>
                    Customize text appearing on invoices.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <PremiumTextarea
                  label="Terms & Conditions"
                  value={form.termsAndConditions}
                  onChange={(e) =>
                    setForm({ ...form, termsAndConditions: e.target.value })
                  }
                  rows={4}
                />
                <PremiumTextarea
                  label="Footer Notes"
                  value={form.footerNotes}
                  onChange={(e) =>
                    setForm({ ...form, footerNotes: e.target.value })
                  }
                  rows={2}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Toggle
                    checked={form.showCompanyDetails}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, showCompanyDetails: checked })
                    }
                    label="Show Company Details"
                  />
                  <Toggle
                    checked={form.showPaymentDetails}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, showPaymentDetails: checked })
                    }
                    label="Show Payment Details"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle>Live A4 Preview</CardTitle>
                    <CardDescription>
                      View your professional A4 invoice.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowInvoicePreview(true)}
                >
                  Launch Preview
                </Button>
              </CardHeader>
            </Card>
          </div>
        );

      case "backup":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Automatic Backups</CardTitle>
                  <CardDescription>
                    Configure scheduled data backups.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Toggle
                  checked={form.autoBackupEnabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, autoBackupEnabled: checked })
                  }
                  label="Enable Auto Backup"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumSelect
                    label="Frequency"
                    value={form.backupFrequency}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        backupFrequency: e.target.value as any,
                      })
                    }
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "monthly", label: "Monthly" },
                    ]}
                  />
                  <PremiumInput
                    label="Retention (Days)"
                    type="number"
                    value={form.backupRetentionDays}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        backupRetentionDays: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
                <PremiumInput
                  label="Backup Location"
                  value={form.backupLocation}
                  onChange={(e) =>
                    setForm({ ...form, backupLocation: e.target.value })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Toggle
                    checked={form.encryptBackups}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, encryptBackups: checked })
                    }
                    label="Encrypt Backups"
                  />
                  <Toggle
                    checked={form.cloudBackupEnabled}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, cloudBackupEnabled: checked })
                    }
                    label="Cloud Backup"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Manual Backup & Restore</CardTitle>
                  <CardDescription>Manage your data snapshots.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <BackupRestorePanel
                  onNotify={success}
                  onSaveConfig={saveBackupConfig}
                />
              </CardContent>
            </Card>

            <Card className="border-red-100 dark:border-red-900/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-red-600 dark:text-red-400">
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible actions.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Reset System Database
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      This will delete all company data.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowReset(true)}
                  >
                    Reset All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Theme & Style</CardTitle>
                  <CardDescription>
                    Choose your interface preferences.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: false, label: "Light Mode", icon: Sun },
                    { id: true, label: "Dark Mode", icon: Moon },
                  ].map((mode) => (
                    <button
                      key={String(mode.id)}
                      onClick={() => setForm({ ...form, darkMode: mode.id })}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                        form.darkMode === mode.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                      )}
                    >
                      <mode.icon
                        className={cn(
                          "w-8 h-8",
                          form.darkMode === mode.id
                            ? "text-blue-600"
                            : "text-slate-400",
                        )}
                      />
                      <span
                        className={cn(
                          "font-bold",
                          form.darkMode === mode.id
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500",
                        )}
                      >
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>
                <ColorPicker
                  label="Accent Color"
                  value={form.accentColor}
                  onChange={(color) => setForm({ ...form, accentColor: color })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription>Adjust text and layout.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <PremiumSelect
                  label="Font Size"
                  value={form.fontSize}
                  onChange={(e) =>
                    setForm({ ...form, fontSize: e.target.value as any })
                  }
                  options={[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                  ]}
                />
                <Toggle
                  checked={form.compactMode}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, compactMode: checked })
                  }
                  label="Compact Mode"
                  description="Denser layout with less spacing"
                />
                <Toggle
                  checked={form.animations}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, animations: checked })
                  }
                  label="Enable Animations"
                />
                <Toggle
                  checked={form.lowStockAlert}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, lowStockAlert: checked })
                  }
                  label="Low Stock Alerts"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Localization</CardTitle>
                  <CardDescription>Set your primary language.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "english", label: "English", sub: "Global" },
                    { id: "gujarati", label: "ગુજરાતી", sub: "Local" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() =>
                        setForm({ ...form, language: lang.id as any })
                      }
                      className={cn(
                        "flex flex-col items-start gap-1 p-6 rounded-2xl border-2 transition-all",
                        form.language === lang.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xl font-bold",
                          form.language === lang.id
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500",
                        )}
                      >
                        {lang.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400">
                        {lang.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Access Control</CardTitle>
                  <CardDescription>Secure your workspace data.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Toggle
                  checked={form.requirePassword}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, requirePassword: checked })
                  }
                  label="Require Password"
                  description="Ask for password on startup"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumInput
                    label="Auto-lock Timeout (Min)"
                    type="number"
                    value={form.passwordTimeoutMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        passwordTimeoutMinutes: parseInt(e.target.value) || 15,
                      })
                    }
                  />
                  <PremiumInput
                    label="Session Timeout (Min)"
                    type="number"
                    value={form.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sessionTimeoutMinutes: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
                <Toggle
                  checked={form.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, twoFactorEnabled: checked })
                  }
                  label="Two-Factor Authentication"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Data Security</CardTitle>
                  <CardDescription>
                    Manage privacy and auditing.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Toggle
                  checked={form.allowExport}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, allowExport: checked })
                  }
                  label="Allow Data Export"
                />
                <Toggle
                  checked={form.auditLogEnabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, auditLogEnabled: checked })
                  }
                  label="Enable Audit Log"
                  description="Track all database changes"
                />
                <Toggle
                  checked={form.dataEncryptionEnabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, dataEncryptionEnabled: checked })
                  }
                  label="Database Encryption"
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col h-full gap-6 pb-20">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  System Settings
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Configure and manage your ERP workspace
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-1 gap-8 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 shrink-0 flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              />
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full flex flex-col items-start gap-1 px-5 py-4 rounded-2xl transition-all group",
                      isActive
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/50",
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      <span className="font-bold text-sm flex-1 text-left">
                        {cat.label}
                      </span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                    {!isActive && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 text-left pl-8">
                        {cat.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black">
                  T
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    TFC ERP
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Version 2.4.1 (Stable)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            <div className="max-w-4xl space-y-8 animate-fade-in">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeCategoryConfig?.label}
                </h2>
                <p className="text-sm text-slate-500">
                  {activeCategoryConfig?.description}
                </p>
              </div>

              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <PremiumModal
        isOpen={showInvoicePreview}
        onClose={() => setShowInvoicePreview(false)}
        title="Standard A4 Invoice Preview"
        size="xl"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => setShowInvoicePreview(false)}
            >
              Close
            </Button>
            <Button
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-100"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        }
      >
        <div className="bg-slate-100 dark:bg-slate-950 p-8 min-h-[1000px] flex justify-center overflow-auto custom-scrollbar">
          <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-[50px] shadow-2xl flex flex-col gap-8 font-sans">
            {/* Header */}
            <div
              className="flex justify-between items-start border-b-2 pb-8"
              style={{ borderColor: form.invoiceColorTheme }}
            >
              <div className="flex flex-col gap-4">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="h-20 object-contain self-start"
                  />
                ) : (
                  <div
                    className="w-16 h-16 text-white flex items-center justify-center text-3xl font-black rounded-2xl"
                    style={{ backgroundColor: form.invoiceColorTheme }}
                  >
                    {form.businessName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-2xl font-black uppercase tracking-tighter">
                    {form.businessName}
                  </h1>
                  <p className="text-xs font-bold text-slate-500">
                    {form.businessAddress}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {form.city}, {form.state} - {form.pincode}
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-2">
                    GSTIN: {form.gstin}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <h2
                  className="text-6xl font-black opacity-10"
                  style={{ color: form.invoiceColorTheme }}
                >
                  INVOICE
                </h2>
                <div className="flex flex-col items-end mt-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Invoice Number
                  </p>
                  <p className="text-lg font-black">{mockInvoice.billNo}</p>
                </div>
                <div className="flex flex-col items-end mt-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Date
                  </p>
                  <p className="text-sm font-bold">
                    {new Date().toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Party Details */}
            <div className="grid grid-cols-2 gap-8 py-6 px-6 bg-slate-50 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Billed To
                </p>
                <p className="text-lg font-black">{mockInvoice.partyName}</p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Sample Address, City, State
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Contact
                </p>
                <p className="text-sm font-bold">+91 98765 43210</p>
                <p className="text-sm font-medium text-slate-600">
                  customer@example.com
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className="border-b-2"
                    style={{ borderColor: form.invoiceColorTheme }}
                  >
                    <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-widest">
                      Item Description
                    </th>
                    <th className="text-center py-4 px-2 text-[10px] font-black uppercase tracking-widest">
                      Lot
                    </th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest">
                      Weight
                    </th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest">
                      Rate
                    </th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockInvoice.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4 px-2 font-bold text-sm">
                        {item.fruitName} - Grade {item.grade}
                      </td>
                      <td className="py-4 px-2 text-center text-sm font-medium text-slate-500">
                        {item.lotNo}
                      </td>
                      <td className="py-4 px-2 text-right text-sm font-bold">
                        {item.totalWeight} kg
                      </td>
                      <td className="py-4 px-2 text-right text-sm font-medium">
                        {form.currencySymbol}
                        {item.rate}
                      </td>
                      <td className="py-4 px-2 text-right text-sm font-black">
                        {form.currencySymbol}
                        {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div
              className="flex justify-end pt-8 border-t-2"
              style={{ borderColor: form.invoiceColorTheme }}
            >
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                    Subtotal
                  </span>
                  <span className="font-bold">
                    {form.currencySymbol}
                    {mockInvoice.subtotal?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                    Commission ({form.commissionPercent}%)
                  </span>
                  <span className="font-bold">
                    {form.currencySymbol}
                    {mockInvoice.commission?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                    GST ({form.taxPercent}%)
                  </span>
                  <span className="font-bold">
                    {form.currencySymbol}
                    {mockInvoice.taxAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-black uppercase tracking-widest text-sm">
                    Grand Total
                  </span>
                  <span
                    className="text-2xl font-black"
                    style={{ color: form.invoiceColorTheme }}
                  >
                    {form.currencySymbol}
                    {mockInvoice.total?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto flex flex-col gap-12 pt-20">
              <div className="flex justify-between items-end">
                <div className="max-w-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Terms & Conditions
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                    {form.termsAndConditions}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {form.signatureUrl ? (
                    <img
                      src={form.signatureUrl}
                      alt="Signature"
                      className="h-16 object-contain"
                    />
                  ) : (
                    <div className="h-16 w-40 border-b border-slate-300" />
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Authorized Signatory
                  </p>
                </div>
              </div>
              <div
                className="text-center p-4 text-white rounded-xl"
                style={{ backgroundColor: form.invoiceColorTheme }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
                  Thank you for your business
                </p>
              </div>
            </div>
          </div>
        </div>
      </PremiumModal>

      <PremiumModal
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        title={tx("settings.resetAllData", "Reset All Data")}
        size="md"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={() => setShowReset(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={resetAll}>
              {tx("settings.confirmResetAll", "Yes, Reset Everything")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="bg-red-100 dark:bg-red-950/30 p-4 rounded-full mb-4">
            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Are you absolutely sure?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {tx(
              "settings.resetWarning",
              "This will permanently delete all parties, suppliers, bills, payments, inventory, and settings. This action cannot be undone.",
            )}
          </p>
        </div>
      </PremiumModal>
    </PageTransition>
  );
}
