import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { formatCurrency } from "@/utils/formatters";
import * as db from "@/db/db";
import type { PageId } from "@/stores/useAppStore";
import {
  Search,
  Truck,
  Users,
  Receipt,
  Package,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useBatchPageData } from "@/hooks/usePageData";
import { useDebouncedSearch } from "@/hooks/useDebounce";
import { VirtualList } from "@/components/VirtualList";

interface SearchResult {
  id: string;
  type: "party" | "vehicle";
  title: string;
  description: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  page?: PageId;
}

export function SearchPage() {
  useBatchPageData(["parties", "vehicles"]);

  const setCurrentPage = useAppStore((state) => state.setCurrentPage);
  const parties = useAppStore((state) => state.parties);
  const vehicleRegisters = useAppStore((state) => state.vehicleRegisters);
  const currentCompanyId = useAppStore((state) => state.currentCompanyId);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const partyBalanceMap = useMemo(() => {
    if (!currentCompanyId)
      return new Map<
        string,
        { balance: number; type: "receivable" | "payable" }
      >();

    return new Map(
      db
        .getPartyBalancesByCompany(currentCompanyId)
        .map((item) => [item.partyId, item] as const),
    );
  }, [currentCompanyId, parties.length]);

  const getSearchResults = useCallback(
    (searchQuery: string): SearchResult[] => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return [];

      const results: SearchResult[] = [];
      const partyIconColor = (type: string) =>
        type === "customer"
          ? "text-pink-600 dark:text-pink-400"
          : type === "supplier"
            ? "text-cyan-600 dark:text-cyan-400"
            : "text-purple-600 dark:text-purple-400";

      parties.forEach((party) => {
        const name = party.name || "";
        if (name.toLowerCase().includes(q) || (party.phone || "").includes(q)) {
          const balanceInfo = partyBalanceMap.get(party.id);
          results.push({
            id: `party-${party.id}`,
            type: "party",
            title: name,
            description: `${party.partyType.toUpperCase()} • ${party.city} • ${party.phone}`,
            value: formatCurrency(balanceInfo?.balance ?? 0),
            icon: Users,
            color: partyIconColor(party.partyType),
          });
        }
      });

      vehicleRegisters.forEach((vehicle) => {
        if (
          vehicle.entryNo.toLowerCase().includes(q) ||
          vehicle.vehicleNumber.toLowerCase().includes(q) ||
          vehicle.driverName.toLowerCase().includes(q)
        ) {
          results.push({
            id: `vehicle-${vehicle.id}`,
            type: "vehicle",
            title: `Vehicle #${vehicle.entryNo}`,
            description: `${vehicle.vehicleNumber} • ${vehicle.driverName}`,
            value: formatCurrency(vehicle.grandTotal),
            icon: Truck,
            color: "text-blue-600 dark:text-blue-400",
            page: "vehicle-register",
          });
        }
      });

      return results;
    },
    [parties, partyBalanceMap, vehicleRegisters],
  );

  const { query, setQuery, results, isSearching, clearCache } =
    useDebouncedSearch<SearchResult>(getSearchResults, 250, 20);

  useEffect(() => {
    clearCache();
  }, [currentCompanyId, parties.length, vehicleRegisters.length, clearCache]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = results.length;
    if (total === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result.page) setCurrentPage(result.page);
    }
  };

  return (
    <div className="h-full min-h-[calc(100vh-130px)] flex items-start justify-center pt-4 animate-fade-in">
      <div className="w-full max-w-2xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-blue-600/10 to-cyan-600/10 pointer-events-none" />
          <div className="relative rounded-2xl border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827] p-4 shadow-lg shadow-slate-200/50 dark:shadow-black/30">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search parties, vehicles..."
                className="flex-1 bg-transparent text-lg font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="rounded-xl border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827] shadow-lg overflow-hidden">
            {results.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Search className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No results found
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-[#1f2a43]">
                {isSearching && (
                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    Searching...
                  </div>
                )}
                <VirtualList
                  items={results}
                  itemHeight={72}
                  containerHeight={Math.min(results.length * 72, 520)}
                  className="divide-y divide-slate-200 dark:divide-[#1f2a43]"
                  overscan={5}
                  renderItem={(result, idx) => {
                    const Icon = result.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={result.id}
                        onClick={() =>
                          result.page && setCurrentPage(result.page)
                        }
                        className={cn(
                          "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-150",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-600 dark:border-blue-500"
                            : "hover:bg-slate-50 dark:hover:bg-[#172036]",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                            "bg-slate-100 dark:bg-slate-800 transition-colors",
                            result.color,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {result.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabnum">
                            {result.value}
                          </span>
                          {isSelected && (
                            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                          )}
                        </div>
                      </button>
                    );
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {!query.trim() && (
          <div className="rounded-lg border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827] p-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Type to search parties and vehicles
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Use{" "}
              <kbd className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                ↑ ↓
              </kbd>{" "}
              to navigate,{" "}
              <kbd className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono ml-1">
                Enter
              </kbd>{" "}
              to select
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
