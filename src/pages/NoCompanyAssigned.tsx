import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function NoCompanyAssignedPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleCreateCompany = () => {
    navigate("/create-company");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-xl w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">
          No Company Assigned
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Your account is authenticated, but there are no companies assigned to
          you yet. Please contact your administrator or create a new company to
          continue.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleCreateCompany}
            className="inline-flex justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Create Company
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
