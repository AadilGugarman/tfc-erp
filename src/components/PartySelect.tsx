import React, { useMemo, useState, useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import { Search, Plus, User } from "lucide-react";
import type { Party } from "@/db/schema";
import { Button } from "./ui/Button";

interface PartySelectProps {
  value: string;
  parties: Party[];
  onChange: (v: string) => void;
  placeholder: string;
  onCreateNew?: () => void;
  createLabel?: string;
}

export function PartySelect({
  value,
  parties,
  onChange,
  placeholder,
  onCreateNew,
  createLabel = "Create New",
}: PartySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parties.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return parties
      .filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.phone || "").includes(q),
      )
      .slice(0, 10);
  }, [parties, search]);

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
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-10 px-3 text-left text-[13px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all",
          selected
            ? "text-slate-900 dark:text-white font-medium"
            : "text-slate-400",
          open && "ring-2 ring-blue-500/50 border-blue-500",
        )}
      >
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 opacity-50" />
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-[100] w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                placeholder="Search party..."
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
                type="button"
                className="w-full px-4 py-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between group"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{p.phone}</span>
                </div>
                {p.partyType === "both" && (
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 rounded uppercase opacity-50">
                    Both
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-center text-xs text-slate-400">
                No parties found
              </div>
            )}
          </div>
          {onCreateNew && (
            <div className="p-1 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Plus size={14} />
                {createLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
