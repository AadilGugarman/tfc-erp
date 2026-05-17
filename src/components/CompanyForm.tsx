import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Company } from "@/db/schema";
import { useTranslation } from "react-i18next";

const languageOptions = [
  { value: "english", label: "English" },
  { value: "gujarati", label: "ગુજરાતી" },
] as const;

export type CompanyFormData = Omit<Company, "id" | "createdAt" | "updatedAt">;

interface CompanyFormProps {
  initialData?: Partial<CompanyFormData>;
  onSubmit: (company: CompanyFormData) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  title?: string;
  isLoading?: boolean;
}

export function CompanyForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Company",
  title = "Company Details",
  isLoading = false,
}: CompanyFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CompanyFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    gstin: "",
    invoicePrefix: "INV",
    language: "english",
    theme: "light",
    financialYearStart: 4,
    financialYearEnd: 3,
    ownerId: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setForm((prev) => ({
      ...prev,
      ...initialData,
      financialYearStart:
        initialData.financialYearStart ?? prev.financialYearStart,
      financialYearEnd: initialData.financialYearEnd ?? prev.financialYearEnd,
      ownerId: initialData.ownerId ?? prev.ownerId,
    }));
  }, [initialData]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim())
      nextErrors.name = t("validation.required", "Company name is required");
    if (!form.address.trim())
      nextErrors.address = t("validation.required", "Address is required");
    if (!form.city.trim())
      nextErrors.city = t("validation.required", "City is required");
    if (!form.state.trim())
      nextErrors.state = t("validation.required", "State is required");
    if (form.gstin.trim() && form.gstin.trim().length !== 15) {
      nextErrors.gstin = t(
        "validation.gstinLength",
        "GSTIN must be 15 characters",
      );
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t(
            "companyForm.description",
            "Enter the company details for billing and operations.",
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("settings.companyName", "Company Name")}
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          error={errors.name}
        />
        <Input
          label={t("settings.gstin", "GSTIN")}
          value={form.gstin}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, gstin: e.target.value }))
          }
          error={errors.gstin}
          placeholder={t("placeholders.gstin", "Optional - 15 characters")}
          maxLength={15}
        />
      </div>

      <Input
        label={t("settings.businessAddress", "Address")}
        value={form.address}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, address: e.target.value }))
        }
        error={errors.address}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("settings.city", "City")}
          value={form.city}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, city: e.target.value }))
          }
          error={errors.city}
        />
        <Input
          label={t("settings.state", "State")}
          value={form.state}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, state: e.target.value }))
          }
          error={errors.state}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("settings.phone", "Phone")}
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
          type="tel"
        />
        <Input
          label={t("settings.email", "Email")}
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
          type="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("settings.invoicePrefix", "Invoice Prefix")}
          value={form.invoicePrefix}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, invoicePrefix: e.target.value }))
          }
        />
        <Select
          label={t("settings.language", "Language")}
          value={form.language}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              language: e.target.value as CompanyFormData["language"],
            }))
          }
          options={languageOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel}>
            {t("common.cancel", "Cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.saving", "Saving...") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
