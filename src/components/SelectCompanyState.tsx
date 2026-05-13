import { Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { authService } from "@/services/auth";

export function SelectCompanyState() {
  const navigate = useNavigate();
  const { companies } = useAppStore();

  // Get accessible companies
  const companyIds = authService.getAccessibleCompanies();
  const accessibleCompanies = companies.filter((c) =>
    companyIds.includes(c.id),
  );

  const handleCompanySelect = (companyId: string) => {
    navigate(`/app/${companyId}/dashboard`);
  };

  const handleCreateCompany = () => {
    navigate("/create-company");
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select a Company
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Choose a company to access your business data and operations.
        </p>

        {/* Company List */}
        {accessibleCompanies.length > 0 ? (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Available Companies
            </h3>
            {accessibleCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company.id)}
                className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {company.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {company.city}, {company.state}
                </div>
                {company.gstin && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    GSTIN: {company.gstin}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No companies available. Create your first company to get started.
            </p>
          </div>
        )}

        {/* Create Company Button */}
        <button
          onClick={handleCreateCompany}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Company
        </button>
      </div>
    </div>
  );
}
