import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useAppStore, type PageId } from "@/stores/useAppStore";
import {
  listCommands,
  listRegisteredShortcuts,
} from "@/keyboard/shortcutManager";
import { cn } from "@/utils/cn";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type PaletteItem = {
  id: string;
  title: string;
  subtitle?: string;
  shortcut?: string;
  group?: string;
  run: () => void;
};

const PAGE_COMMANDS: Array<{ id: PageId; title: string; shortcut?: string }> = [
  { id: "dashboard", title: "Go to Dashboard", shortcut: "Alt+1" },
  {
    id: "vehicle-register",
    title: "Go to Vehicle Register",
    shortcut: "Alt+V",
  },
  { id: "parties", title: "Go to Parties", shortcut: "Alt+2" },
  { id: "suppliers", title: "Go to Suppliers", shortcut: "Alt+3" },
  { id: "ledger", title: "Go to Ledger", shortcut: "Alt+4" },
  { id: "transactions", title: "Go to Sales/Purchase", shortcut: "Alt+5" },
  { id: "inventory", title: "Go to Inventory", shortcut: "Alt+6" },
  { id: "payments", title: "Go to Payments", shortcut: "Alt+7" },
  { id: "reports", title: "Go to Reports", shortcut: "Alt+8" },
  { id: "settings", title: "Go to Settings", shortcut: "Alt+9" },
  { id: "search", title: "Go to Search", shortcut: "Ctrl+F" },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dynamicItems, setDynamicItems] = useState<PaletteItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setCurrentPage } = useAppStore();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);

    const pageItems: PaletteItem[] = PAGE_COMMANDS.map((command) => ({
      id: `page-${command.id}`,
      title: command.title,
      shortcut: command.shortcut,
      group: "Navigation",
      run: () => setCurrentPage(command.id),
    }));

    const registered = listCommands().map((command) => ({
      id: command.id,
      title: command.title,
      subtitle: command.subtitle,
      shortcut: command.shortcut,
      group: command.group ?? "Commands",
      run: command.run,
    }));

    setDynamicItems([...pageItems, ...registered]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, setCurrentPage]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dynamicItems;

    return dynamicItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.shortcut?.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q)
      );
    });
  }, [dynamicItems, query]);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(0);
    }
  }, [items.length, selectedIndex]);

  const shortcutHints = useMemo(() => {
    return listRegisteredShortcuts().map((shortcut) => ({
      id: shortcut.id,
      combo: shortcut.combo,
      description: shortcut.description,
    }));
  }, [open]);

  if (!open) return null;

  const execute = () => {
    const selected = items[selectedIndex];
    if (!selected) return;
    selected.run();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((prev) =>
                  Math.min(prev + 1, Math.max(items.length - 1, 0)),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                execute();
              } else if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder="Type a command or shortcut..."
            className="flex-1 h-10 px-3 rounded-xl text-sm"
          />
          <kbd className="erp-kbd hidden sm:inline-flex">Esc</kbd>
        </div>

        <div className="max-h-[45vh] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No commands found
            </div>
          ) : (
            items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  item.run();
                  onClose();
                }}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors",
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500"
                    : "hover:bg-slate-50 dark:hover:bg-[#172036]",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.subtitle ?? item.group}
                  </p>
                </div>
                {item.shortcut ? (
                  <kbd className="erp-kbd px-2 py-1 text-[11px]">
                    {item.shortcut}
                  </kbd>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/70">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Global Shortcuts
          </p>
          <div className="flex flex-wrap gap-2">
            {shortcutHints.slice(0, 8).map((hint) => (
              <span
                key={hint.id}
                className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300"
                title={hint.description}
              >
                <kbd className="font-mono text-[10px] text-slate-500">
                  {hint.combo}
                </kbd>
                <span>{hint.description}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
