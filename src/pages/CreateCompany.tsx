import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { CompanyForm, type CompanyFormData } from "@/components/CompanyForm";

export function CreateCompanyPage() {
  const navigate = useNavigate();
  const { createCompany, showNotification } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (company: CompanyFormData) => {
    setIsSaving(true);
    try {
      console.log("Submitting company creation:", company);
      const newCompany = await createCompany(company);
      console.log("Company created successfully:", newCompany);
      showNotification("Company created successfully", "success");
      
      // Delay navigation slightly to ensure state is updated
      setTimeout(() => {
        console.log("Navigating to dashboard for:", newCompany.id);
        navigate(`/app/${newCompany.id}/dashboard`);
      }, 300);
    } catch (error) {
      console.error("Error creating company:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create company";
      showNotification(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-[#0a0f1d] dark:to-[#1a2d4d] p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Create New Company
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Set up a new company for your billing system.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <CompanyForm
            submitLabel="Create Company"
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
            isLoading={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
