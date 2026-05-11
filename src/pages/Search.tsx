import { useEffect, useMemo, useState, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import * as db from '@/db/db';
import { Search, Truck, Users, Receipt, Package, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchResult {
  id: string;
  type: 'party' | 'supplier' | 'bill' | 'vehicle';
  title: string;
  description: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  page?: string;
}

export function SearchPage() {
  const { setCurrentPage } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const allResults: SearchResult[] = [];

    // Search parties
    db.getParties()
      .filter(item => item.name.toLowerCase().includes(q) || item.phone.includes(q))
      .forEach(party => {
        allResults.push({
          id: `party-${party.id}`,
          type: 'party',
          title: party.name,
          description: `${party.city} • ${party.phone}`,
          value: formatCurrency(db.getPartyBalance(party.id).balance),
          icon: Users,
          color: 'text-pink-600 dark:text-pink-400',
        });
      });

    // Search suppliers
    db.getSuppliers()
      .filter(item => item.name.toLowerCase().includes(q) || item.phone.includes(q))
      .forEach(supplier => {
        allResults.push({
          id: `supplier-${supplier.id}`,
          type: 'supplier',
          title: supplier.name,
          description: `${supplier.city} • ${supplier.phone}`,
          value: formatCurrency(db.getPartyBalance(supplier.id).balance),
          icon: Users,
          color: 'text-cyan-600 dark:text-cyan-400',
        });
      });

    // Search bills
    db.getBills()
      .filter(item => item.billNo.toLowerCase().includes(q) || item.partyName.toLowerCase().includes(q))
      .forEach(bill => {
        allResults.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          title: `Bill #${bill.billNo}`,
          description: `${bill.partyName} • ${formatDate(bill.date)}`,
          value: formatCurrency(bill.total),
          icon: Receipt,
          color: 'text-emerald-600 dark:text-emerald-400',
          page: 'billing',
        });
      });

    // Search vehicles
    db.getVehicleRegisters()
      .filter(item => item.entryNo.toLowerCase().includes(q) || item.vehicleNumber.toLowerCase().includes(q) || item.driverName.toLowerCase().includes(q))
      .forEach(vehicle => {
        allResults.push({
          id: `vehicle-${vehicle.id}`,
          type: 'vehicle',
          title: `Vehicle #${vehicle.entryNo}`,
          description: `${vehicle.vehicleNumber} • ${vehicle.driverName}`,
          value: formatCurrency(vehicle.grandTotal),
          icon: Truck,
          color: 'text-blue-600 dark:text-blue-400',
          page: 'vehicle-register',
        });
      });

    return allResults;
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result.page) setCurrentPage(result.page);
    }
  };

  return (
    <div className="h-full min-h-[calc(100vh-200px)] flex items-start justify-center pt-12 animate-fade-in">
      <div className="w-full max-w-2xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600/5 to-cyan-600/5 pointer-events-none" />
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-lg shadow-slate-200/50 dark:shadow-black/30">
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
                placeholder="Search parties, suppliers, bills, vehicles..."
                className="flex-1 bg-transparent text-lg font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-lg overflow-hidden">
            {results.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Search className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No results found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {results.map((result, idx) => {
                  const Icon = result.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={result.id}
                      onClick={() => result.page && setCurrentPage(result.page)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-150',
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-indigo-600 dark:border-indigo-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                        'bg-slate-100 dark:bg-slate-800 transition-colors',
                        result.color
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {result.description}
                        </p>
                      </div>

                      {/* Value & Indicator */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabnum">
                          {result.value}
                        </span>
                        {isSelected && (
                          <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {!query.trim() && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Type to search parties, suppliers, bills, and vehicles
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Use <kbd className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">↑ ↓</kbd> to navigate, <kbd className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono ml-1">Enter</kbd> to select
            </p>
          </div>
        )}
      </div>
    </div>
  );
}