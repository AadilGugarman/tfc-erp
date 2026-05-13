import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";
import * as db from "@/db/db";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Mail, FileText } from "lucide-react";

export function CreateCompanyPage() {
  const navigate = useNavigate();
  const { showNotification, loadCompanies } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    gstin: "",
    invoicePrefix: "INV",
    financialYearStart: 4, // April
    financialYearEnd: 3, // March
    language: "gujarati" as const,
    theme: "light" as const,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Company name is required";
    if (!formData.gstin.trim())
      newErrors.gstin = "GSTIN is required (24 characters)";
    if (formData.gstin.trim().length !== 24)
      newErrors.gstin = "GSTIN must be 24 characters";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const newCompany = db.createCompany({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        gstin: formData.gstin,
        invoicePrefix: formData.invoicePrefix,
        language: formData.language,
        theme: formData.theme,
        isActive: true,
      });

      // Add company to user's accessible companies
      // This would be done in backend in production
      db.updateSettings({
        businessName: formData.name,
        businessAddress: formData.address,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        gstin: formData.gstin,
      });

      loadCompanies();
      toast.success(`Company "${formData.name}" created successfully!`);
      showNotification("Company created successfully", "success");

      // Redirect to company dashboard
      navigate(`/app/${newCompany.id}/dashboard`);
    } catch (error) {
      const msg = (error as Error).message || "Failed to create company";
      toast.error(msg);
      showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-[#0a0f1d] dark:to-[#1a2d4d] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Company
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up a new company for your billing system
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  placeholder="Your Company Name"
                />
                <Input
                  label="GSTIN (24 characters) *"
                  value={formData.gstin}
                  onChange={(e) =>
                    setFormData({ ...formData, gstin: e.target.value })
                  }
                  error={errors.gstin}
                  placeholder="e.g., 24AABCP1234F1Z5"
                  maxLength={24}
                />
              </div>

              <Input
                label="Address *"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                error={errors.address}
                placeholder="Building/Street Address"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City *"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  error={errors.city}
                  placeholder="City"
                />
                <Input
                  label="State *"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  error={errors.state}
                  placeholder="State"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 XXXXX XXXXX"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="company@example.com"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Invoice Prefix"
                  value={formData.invoicePrefix}
                  onChange={(e) =>
                    setFormData({ ...formData, invoicePrefix: e.target.value })
                  }
                  placeholder="INV"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        language: e.target.value as "english" | "gujarati",
                      })
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a2242] text-gray-900 dark:text-white"
                  >
                    <option value="gujarati">Gujarati (ગુજરાતી)</option>
                    <option value="english">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
