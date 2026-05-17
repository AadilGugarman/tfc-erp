import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, ArrowLeft } from "lucide-react";
import type { Company } from "@/db/schema";
import { authService } from "@/services/auth";

export function ManageCompaniesPage() {
  const navigate = useNavigate();
  const {
    companies,
    loadCompanies,
    deleteCompany,
    setCurrentCompany,
    currentCompany,
  } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleBack = () => {
    const lastCompanyId = authService.getCurrentCompany();
    if (lastCompanyId) {
      navigate(`/app/${lastCompanyId}/dashboard`);
    } else if (companies.length > 0) {
      navigate(`/app/${companies[0].id}/dashboard`);
    } else {
      navigate("/select-company");
    }
  };

  const openEditPage = (companyId: string) => {
    navigate(`/edit-company/${companyId}`);
  };

  const handleDelete = async (companyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      deleteCompany(companyId);
      toast.success("Company deleted successfully");
    } catch (error) {
      toast.error("Failed to delete company");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (companyId: string) => {
    setCurrentCompany(companyId);
    navigate(`/app/${companyId}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 dark:from-[#0a0f1d] dark:to-[#1a2d4d] p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Manage Companies
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View and manage your business entities.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage company settings, switch active company, or edit company
              details.
            </p>
          </div>
          <Button
            onClick={() => navigate("/create-company")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Company
          </Button>
        </div>

        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((company) => (
              <Card
                key={company.id}
                className={
                  "p-6 transition-all " +
                  (currentCompany?.id === company.id
                    ? "ring-2 ring-blue-500"
                    : "hover:shadow-lg")
                }
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {company.name}
                      </h3>
                      {currentCompany?.id === company.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {company.city}, {company.state}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 border-y border-slate-200 py-4 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Address:</span>{" "}
                    {company.address}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Email:</span>{" "}
                    {company.email || "—"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">GSTIN:</span>{" "}
                    {company.gstin || "N/A"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {currentCompany?.id !== company.id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSwitch(company.id)}
                      className="flex-1 gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Switch
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditPage(company.id)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDelete(company.id)}
                    className="gap-2 text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No Companies Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first company to get started.
            </p>
            <Button onClick={() => navigate("/create-company")}>
              Create Company
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
