import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";
import * as db from "@/db/db";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth";

export function ManageCompaniesPage() {
  const navigate = useNavigate();
  const { companies, loadCompanies } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const currentCompanyId = authService.getCurrentCompany();

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleEdit = (company: any) => {
    setEditingId(company.id);
    setEditingData({ ...company });
  };

  const handleSaveEdit = async (companyId: string) => {
    try {
      setLoading(true);
      db.updateCompany(companyId, editingData);
      loadCompanies();
      setEditingId(null);
      toast.success("Company updated successfully");
    } catch (error) {
      toast.error("Failed to update company");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This action cannot be undone.",
      )
    )
      return;

    try {
      setLoading(true);
      db.deleteCompany(companyId);
      loadCompanies();
      toast.success("Company deleted successfully");
    } catch (error) {
      toast.error("Failed to delete company");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (companyId: string) => {
    authService.setCurrentCompany(companyId);
    navigate(`/app/${companyId}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 dark:from-[#0a0f1d] dark:to-[#1a2d4d] p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Companies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your companies
          </p>
        </div>

        {/* New Company Button */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/create-company")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Company
          </Button>
        </div>

        {/* Companies Grid */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {companies.map((company) => (
              <Card
                key={company.id}
                className={`p-6 transition-all ${
                  editingId === company.id
                    ? "ring-2 ring-blue-500"
                    : "hover:shadow-lg"
                }`}
              >
                {editingId === company.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingData.name}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-[#1a2242] dark:border-gray-600"
                      placeholder="Company name"
                    />
                    <input
                      type="text"
                      value={editingData.gstin}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          gstin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-[#1a2242] dark:border-gray-600"
                      placeholder="GSTIN"
                      maxLength={24}
                    />
                    <textarea
                      value={editingData.address}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-[#1a2242] dark:border-gray-600"
                      placeholder="Address"
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(company.id)}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {company.name}
                          </h3>
                          {currentCompanyId === company.id && (
                            <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {company.gstin}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 py-4 border-y border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Address:</span>{" "}
                        {company.address}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">City:</span>{" "}
                        {company.city}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">State:</span>{" "}
                        {company.state}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Financial Year:</span> Apr
                        - Mar
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {currentCompanyId !== company.id && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSwitch(company.id)}
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Switch
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(company)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(company.id)}
                        className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Companies Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first company to get started
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
