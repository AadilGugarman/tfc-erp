import { useAppStore } from "@/stores/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Moon,
  Sun,
  Search,
  LogOut,
  ChevronDown,
  Building2,
  Loader2,
  Plus,
  Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import { authService } from "@/services/auth";

function MangoLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <defs>
        <linearGradient id="headerMangoBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="headerMangoLeaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <path
        d="M18.5 7.4c-4.6 0-9.8 2.8-11 8.6-1 5 2.2 9.2 7.2 10.2 5.8 1.1 11.7-2.3 12.7-8.7.8-4.8-2.6-10.1-8.9-10.1z"
        fill="url(#headerMangoBody)"
      />
      <path
        d="M19.5 5.4c1.7-2.6 4.3-3.6 7.3-3.1-1.3 2.7-3.6 4.3-6.8 4.8z"
        fill="url(#headerMangoLeaf)"
      />
      <path
        d="M18.2 4.5c.5-1.2 1.3-2.1 2.5-2.8"
        stroke="#14532d"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="12.6" cy="17.2" r="1.1" fill="#fff" opacity="0.6" />
    </svg>
  );
}

function HeaderCompanySwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const {
    companies: storeCompanies,
    setCurrentCompany,
    loadCompanies,
  } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCompanyId = authService.getCurrentCompany();
  const currentCompany = storeCompanies.find((c) => c.id === currentCompanyId);

  useEffect(() => {
    // Ensure companies are loaded
    if (storeCompanies.length === 0) {
      loadCompanies();
    }
  }, [storeCompanies.length, loadCompanies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCompanySelect = async (companyId: string) => {
    if (isSwitching) return;

    setIsSwitching(true);
    setSwitchingTo(companyId);

    try {
      // Update the current company in the store (this refreshes all data)
      setCurrentCompany(companyId);

      // Extract current page from URL
      const pathParts = location.pathname.split("/");
      const currentPage = pathParts.length >= 4 ? pathParts[3] : "dashboard";

      // Navigate to the same page in the new company
      navigate(`/app/${companyId}/${currentPage}`);

      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Error switching company:", error);
    } finally {
      setIsSwitching(false);
      setSwitchingTo(null);
      setIsOpen(false);
    }
  };

  const handleSelectCompany = () => {
    navigate("/select-company");
    setIsOpen(false);
  };

  const handleAddCompany = () => {
    navigate("/create-company");
    setIsOpen(false);
  };

  const handleManageCompanies = () => {
    navigate("/manage-companies");
    setIsOpen(false);
  };

  const displayText =
    currentCompanyId && currentCompany ? currentCompany.name : "Select Company";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !isSwitching && setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200",
          "bg-white dark:bg-[#1a2242] border border-gray-200 dark:border-gray-700",
          "hover:bg-gray-50 dark:hover:bg-[#212d47] hover:border-gray-300 dark:hover:border-gray-600",
          "text-gray-900 dark:text-gray-100 shadow-sm",
          "min-w-[200px] max-w-xs",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen &&
            "ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-600",
        )}
      >
        {/* Mango Icon - Always Fixed */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
          <MangoLogo />
        </div>

        {/* Company Name */}
        <div className="flex-1 min-w-0 text-left">
          <div
            className={cn(
              "text-sm font-semibold truncate",
              currentCompanyId && currentCompany
                ? "text-gray-900 dark:text-gray-100"
                : "text-blue-600 dark:text-blue-400",
            )}
          >
            {isSwitching ? "Switching..." : displayText}
          </div>
          {currentCompany && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentCompany.city}, {currentCompany.state}
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200 text-gray-400",
            isOpen && "rotate-180",
            isSwitching && "opacity-50",
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-3 z-50 w-[320px] rounded-2xl",
            "bg-white dark:bg-[#1a2242] border border-gray-200 dark:border-gray-700",
            "shadow-2xl backdrop-blur-xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {currentCompanyId ? "Switch Company" : "Select Company"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {currentCompanyId
                ? "Choose a different company to continue"
                : "Select a company to access your business data"}
            </p>
          </div>

          {/* Companies List */}
          <div className="py-2 max-h-[280px] overflow-y-auto">
            {storeCompanies.length > 0 ? (
              storeCompanies.map((company) => {
                const isCurrent = company.id === currentCompanyId;
                const isSwitchingToThis = switchingTo === company.id;

                return (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company.id)}
                    disabled={isSwitching}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-all duration-150 group",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isCurrent && "bg-blue-50 dark:bg-blue-950/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Company Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                          isCurrent
                            ? "bg-gradient-to-br from-blue-500 to-blue-600"
                            : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600",
                        )}
                      >
                        {isSwitchingToThis ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : isCurrent ? (
                          <Building2 className="w-5 h-5 text-white" />
                        ) : (
                          <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        )}
                      </div>

                      {/* Company Details */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium truncate",
                            isCurrent
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-gray-900 dark:text-gray-100",
                          )}
                        >
                          {company.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {company.city}, {company.state}
                          </span>
                          {company.gstin && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">
                                •
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {company.gstin.slice(0, 10)}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      {isCurrent && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No companies available
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Create a company to get started
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* Actions */}
          <div className="py-2">
            {!currentCompanyId && (
              <button
                onClick={handleSelectCompany}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm text-left",
                  "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                  "transition-all duration-150",
                )}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Select Company</div>
                  <div className="text-xs text-blue-500 dark:text-blue-400 opacity-75">
                    Choose from available companies
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleAddCompany}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm text-left",
                "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                "transition-all duration-150",
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Add Company</div>
                <div className="text-xs text-blue-500 dark:text-blue-400 opacity-75">
                  Create a new company
                </div>
              </div>
            </button>

            <button
              onClick={handleManageCompanies}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm text-left",
                "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                "transition-all duration-150",
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Manage Companies</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 opacity-75">
                  Edit company settings
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function Header() {
  const { settings, setDarkMode } = useAppStore();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const currentCompanyId = authService.getCurrentCompany();
  const effectiveCompanyId = companyId || currentCompanyId;

  // Extract current page from location
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/app\/[^/]+\/([^/]+)/);
    if (match && match[1]) {
      setCurrentPage(match[1]);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const moduleMeta: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Command Center" },
    "vehicle-register": {
      title: "Vehicle Register",
      subtitle: "Arrival Operations",
    },
    parties: { title: "Parties", subtitle: "Account Management" },
    suppliers: { title: "Suppliers", subtitle: "Vendor Operations" },
    ledger: { title: "Ledger", subtitle: "Balance Tracking" },
    transactions: { title: "Transactions", subtitle: "Unified Register" },
    inventory: { title: "Inventory", subtitle: "Stock Control" },
    payments: { title: "Payments", subtitle: "Cash Flow" },
    reports: { title: "Reports", subtitle: "Insights Workspace" },
    search: { title: "Search", subtitle: "Global Finder" },
    settings: { title: "Settings", subtitle: "System Controls" },
  };
  const activeModule = moduleMeta[currentPage] ?? {
    title: "Workspace",
    subtitle: "Operations",
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-5 bg-linear-to-b from-white/88 to-white/72 dark:from-[#0c1528]/90 dark:to-[#0b1222]/72 backdrop-blur-xl border-b border-slate-200/70 dark:border-[#1f2a43]/80 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.55)]">
      {/* Left: Company Switcher */}
      <div className="flex items-center gap-2.5 min-w-0">
        <HeaderCompanySwitcher />
      </div>

      {/* Center: Spacer */}
      <div className="flex justify-center flex-1"></div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        {/* Global Search - Right Side */}
        <button
          title="Ctrl+F"
          onClick={() => {
            if (effectiveCompanyId) {
              navigate(`/app/${effectiveCompanyId}/search`);
            }
          }}
          disabled={!effectiveCompanyId}
          className={cn(
            "hidden sm:flex items-center gap-2.5 h-9 px-3 rounded-xl max-w-[300px]",
            "bg-white/75 dark:bg-[#0f1a2f]/88 ring-1 ring-slate-200/70 dark:ring-[#2b3a58]/75",
            "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            "hover:bg-white dark:hover:bg-[#14213a]",
            "transition-all duration-150 group",
            !effectiveCompanyId && "opacity-50 cursor-not-allowed",
          )}
        >
          <Search className="h-4 w-4 shrink-0 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          <span className="text-sm flex-1 text-left truncate">
            Search across ERP modules...
          </span>
          <kbd className="erp-kbd hidden md:flex gap-0.5 text-xs">
            <span>Ctrl</span>+F
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!settings.darkMode)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
            "bg-white/90 dark:bg-[#111b30] border border-slate-200/90 dark:border-[#2a3550]",
            "hover:bg-white dark:hover:bg-[#16203a] transition-all duration-150",
          )}
          title={settings.darkMode ? "Light mode" : "Dark mode"}
        >
          {settings.darkMode ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-white/90 dark:bg-[#111b30] border border-slate-200/90 dark:border-[#2a3550]",
              "hover:bg-white dark:hover:bg-[#16203a] transition-all duration-150",
            )}
          >
            <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
              <span className="text-xs font-bold text-white select-none">
                TF
              </span>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 z-50 w-56 rounded-lg border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827] shadow-lg shadow-black/10 dark:shadow-black/40 animate-slide-up py-2">
              <div className="px-3 py-3 border-b border-slate-200 dark:border-[#22304a]">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                    {user?.role || "guest"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium",
                  "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
                  "transition-all duration-150",
                )}
              >
                <LogOut className="h-4 w-4" />
                <span>{t("header.logout", "Logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
