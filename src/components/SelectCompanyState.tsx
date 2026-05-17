import { Building2, Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { authService } from "@/services/auth";

export function SelectCompanyState() {
  const navigate = useNavigate();
  const { companies, logout } = useAppStore();

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
      {/* Logout button in corner */}
      <button
        onClick={handleLogout}
        className="absolute top-8 right-8 flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-semibold text-sm cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout Session</span>
      </button>

      <div className="text-center max-w-2xl w-full mx-auto px-6">
        {/* Icon Container */}
        <div className="w-20 h-20 bg-blue-100/80 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm ring-4 ring-blue-50">
          <Building2 className="w-10 h-10 text-blue-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
          Choose a Company
        </h1>

        {/* Description */}
        <p className="text-slate-500 mb-10 max-w-sm mx-auto text-sm font-medium leading-relaxed">
          Select a company to continue or create a new one.
        </p>

        {/* Company List or Empty State */}
        {accessibleCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {accessibleCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company.id)}
                className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all text-left relative overflow-hidden"
              >
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {company.name}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    {company.city}, {company.state}
                  </div>
                  {company.gstin && (
                    <div className="text-[10px] text-slate-400 font-mono mt-3 uppercase tracking-wider">
                      GSTIN: {company.gstin}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-10 p-8 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-bold text-sm">
              No companies available. Create your first company to get started.
            </p>
          </div>
        )}

        {/* Create Company Button */}
        <button
          onClick={handleCreateCompany}
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>New Company</span>
        </button>

        {/* Version Info Footer */}
        <div className="mt-16 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
          Powered by TFC Billing Software
        </div>
      </div>
    </div>
  );
}
