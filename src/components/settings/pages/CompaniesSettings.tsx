import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, ArrowRightLeft } from "lucide-react";
import {
  Card as SettingsCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../BaseComponents";
import { useDialog } from "@/components/ui/dialogs";

export function CompaniesSettings() {
  const navigate = useNavigate();
  const {
    companies,
    loadCompanies,
    deleteCompany,
    setCurrentCompany,
    currentCompany,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const openEditPage = (companyId: string) => {
    navigate(`/edit-company/${companyId}`);
  };

  const handleDelete = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    const confirmed = await dialog.destructive({
      title: `Delete "${company?.name ?? "Company"}"?`,
      description:
        "This will permanently remove the company and all associated data — invoices, parties, transactions, and settings. This action cannot be undone.",
      confirmLabel: "Delete Company",
      cancelLabel: "Keep Company",
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      deleteCompany(companyId);
      toast.success("Company deleted successfully");
    } catch {
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
    <div className="space-y-6">
      <SettingsCard>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Manage Companies</CardTitle>
              <CardDescription>
                Create, edit, switch, or remove business entities linked to your
                account.
              </CardDescription>
            </div>
            <Button
              onClick={() => navigate("/create-company")}
              className="flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Company
            </Button>
          </div>
        </CardHeader>
      </SettingsCard>

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
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {company.name}
                  </h3>
                  {currentCompany?.id === company.id && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {company.city}, {company.state}
                </p>
              </div>

              <div className="space-y-2 mb-6 border-y border-slate-200 py-4 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Address:</span> {company.address}
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
                    disabled={loading}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Switch
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openEditPage(company.id)}
                  className="gap-2"
                  disabled={loading}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDelete(company.id)}
                  className="gap-2 text-red-600 dark:text-red-400 hover:text-red-700"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <SettingsCard>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No companies yet
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Create your first company to start using the ERP.
            </p>
            <Button onClick={() => navigate("/create-company")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Company
            </Button>
          </CardContent>
        </SettingsCard>
      )}
    </div>
  );
}
