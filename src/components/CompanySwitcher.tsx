import { useState, useEffect, useRef } from "react";
import { ChevronDown, Building2, Loader2, Check } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { authService } from "@/services/auth";
import { cn } from "@/utils/cn";
import { useNavigate, useLocation } from "react-router-dom";
import type { Company } from "@/db/schema";

interface CompanySwitcherProps {
  currentCompanyName: string;
  onCompanyChange?: (companyId: string) => void;
}

export function CompanySwitcher({
  currentCompanyName,
  onCompanyChange,
}: CompanySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const { companies: storeCompanies, setCurrentCompany } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const companyIds = authService.getAccessibleCompanies();
    const accessibleCompanies = storeCompanies.filter((c) =>
      companyIds.includes(c.id),
    );
    setCompanies(accessibleCompanies);
  }, [storeCompanies]);

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
      setCurrentCompany(companyId);

      const pathParts = location.pathname.split("/");
      const currentPage = pathParts.length >= 4 ? pathParts[3] : "dashboard";

      navigate(`/app/${companyId}/${currentPage}`);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setIsOpen(false);
      onCompanyChange?.(companyId);
    } catch (error) {
      console.error("Error switching company:", error);
    } finally {
      setIsSwitching(false);
      setSwitchingTo(null);
    }
  };

  const currentCompany = companies.find((c) => c.name === currentCompanyName);

  return (
    <div className="relative" ref={dropdownRef}>
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
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          {isSwitching ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Building2 className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold truncate">
            {isSwitching ? "Switching..." : currentCompanyName}
          </div>
          {currentCompany?.city && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentCompany.city}
            </div>
          )}
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200 text-gray-400",
            isOpen && "rotate-180",
            isSwitching && "opacity-50",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-3 z-50 w-[320px] rounded-2xl",
            "bg-white dark:bg-[#1a2242] border border-gray-200 dark:border-gray-700",
            "shadow-2xl backdrop-blur-xl",
            "animate-in fade-in-0 zoom-in-95 duration-200",
          )}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Switch Company
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select a company to continue
            </p>
          </div>

          <div className="py-2 max-h-[320px] overflow-y-auto">
            {companies.length > 0 ? (
              companies.map((company) => {
                const isCurrent = company.name === currentCompanyName;
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
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        )}
                      </div>

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

                      {isCurrent && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
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
                  Add companies from Settings → Companies
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
