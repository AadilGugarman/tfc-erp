import { Cloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { DashboardHero } from "@/components/DashboardHero";
import { QuickActions } from "@/components/QuickActions";
import { PendingTasksWidgets } from "@/components/PendingTasksWidgets";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { CompanySwitcher } from "@/components/CompanySwitcher";

function getFinancialYearLabel(
  company?: { financialYearStart?: number; financialYearEnd?: number } | null,
) {
  if (!company) return "FY: 2025-26";

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startMonth = company.financialYearStart ?? 4;
  const endMonth = company.financialYearEnd ?? 3;

  let startYear = year;
  let endYear = year;

  if (startMonth <= endMonth) {
    if (month < startMonth) {
      startYear = year - 1;
      endYear = year - 1;
    }
  } else {
    if (month >= startMonth) {
      startYear = year;
      endYear = year + 1;
    } else {
      startYear = year - 1;
      endYear = year;
    }
  }

  return `FY: ${startYear}-${String(endYear).slice(2)}`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { loadParties, loadPayments, loadInventory, currentCompany } =
    useAppStore();
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(
    getFinancialYearLabel(currentCompany),
  );
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const yearMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadParties();
    loadPayments();
    loadInventory();
  }, [loadParties, loadPayments, loadInventory]);

  useEffect(() => {
    setSelectedFinancialYear(getFinancialYearLabel(currentCompany));
  }, [currentCompany]);

  useEffect(() => {
    if (!yearDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        yearMenuRef.current &&
        !yearMenuRef.current.contains(event.target as Node)
      ) {
        setYearDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [yearDropdownOpen]);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Company & Financial Year Selector */}
      <div className="rounded-xl bg-white dark:bg-[#0b1324] border border-slate-200/70 dark:border-slate-800/70 shadow-sm px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CompanySwitcher
            currentCompanyName={currentCompany?.name ?? "Select Company"}
          />
          <div className="relative" ref={yearMenuRef}>
            <button
              type="button"
              onClick={() => setYearDropdownOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white dark:bg-[#111b30] px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 shadow-sm transition hover:border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#16203a]"
            >
              <span className="text-base">📅</span>
              <span>{selectedFinancialYear}</span>
              <span className="text-slate-400 dark:text-slate-500">▼</span>
            </button>
            {yearDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:bg-[#0f172a] shadow-2xl">
                {[
                  "FY: 2024-25",
                  "FY: 2025-26",
                  "FY: 2026-27",
                  "FY: 2027-28",
                ].map((yearOption) => (
                  <button
                    key={yearOption}
                    type="button"
                    onClick={() => {
                      setSelectedFinancialYear(yearOption);
                      setYearDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    {yearOption}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardHero />
      <QuickActions />
      <PendingTasksWidgets />
      <RecentActivitySection />
      <div className="rounded-xl border border-slate-200/70 bg-white shadow-sm px-4 py-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-[#0b1324] dark:text-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
            <span>Status: Connected ✓</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Cloud className="h-4 w-4" />
            <span>Last Backup: Today 10:45 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
