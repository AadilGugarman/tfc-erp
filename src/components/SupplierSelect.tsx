import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
import type { Supplier } from "@/db/schema";

interface SupplierSelectProps {
  value: string;
  suppliers: Supplier[];
  onChange: (v: string) => void;
  placeholder: string;
}

export function SupplierSelect({
  value,
  suppliers,
  onChange,
  placeholder,
}: SupplierSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = suppliers.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers
      .filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q))
      .slice(0, 10);
  }, [suppliers, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-10 px-3 text-left text-[13px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all",
          selected
            ? "text-slate-900 dark:text-white font-medium"
            : "text-slate-400",
          open && "ring-2 ring-emerald-500/50",
        )}
      >
        {selected ? selected.name : placeholder}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                placeholder="Search supplier..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                className="w-full px-4 py-2 text-left text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-between"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span>{p.name}</span>
                <span className="text-[10px] text-slate-400">{p.phone}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
