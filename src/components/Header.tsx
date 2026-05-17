import { useAppStore } from "@/stores/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Moon, Sun, Search, LogOut } from "lucide-react";
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

export function Header() {
  const { settings, setDarkMode, sidebarOpen, setSidebarOpen } = useAppStore();
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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-5 bg-linear-to-b from-white/88 to-white/72 dark:from-[#0c1528]/90 dark:to-[#0b1222]/72 backdrop-blur-xl border-b border-slate-200/70 dark:border-[#1f2a43]/80 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.55)]">
      {/* Left: Brand only */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500 shadow-sm">
          <MangoLogo />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            BILLING PRO
          </span>
        </div>
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
