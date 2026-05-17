import { useAppStore } from "@/stores/useAppStore";
import {
  Truck,
  Package,
  Users,
  CreditCard,
  BookOpen,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  page: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "vehicle",
    label: "New Vehicle Entry",
    icon: Truck,
    color: "from-blue-500 to-blue-600",
    page: "vehicle-register",
    shortcut: "Alt+V",
  },
  {
    id: "inventory",
    label: "Add Inventory",
    icon: Package,
    color: "from-amber-500 to-amber-600",
    page: "inventory",
    shortcut: "Alt+I",
  },
  {
    id: "party",
    label: "New Party",
    icon: Users,
    color: "from-pink-500 to-pink-600",
    page: "parties",
    shortcut: "Alt+U",
  },
  {
    id: "payment",
    label: "Receive Payment",
    icon: CreditCard,
    color: "from-green-500 to-green-600",
    page: "payments",
    shortcut: "Alt+M",
  },
  {
    id: "ledger",
    label: "Open Ledger",
    icon: BookOpen,
    color: "from-blue-500 to-blue-600",
    page: "ledger",
    shortcut: "Alt+L",
  },
  {
    id: "sales",
    label: "Create Sales Invoice",
    icon: FileText,
    color: "from-emerald-500 to-emerald-600",
    page: "transactions",
    shortcut: "Alt+N",
  },
  {
    id: "purchase",
    label: "Create Purchase Order",
    icon: ShoppingCart,
    color: "from-orange-500 to-orange-600",
    page: "transactions",
    shortcut: "Alt+O",
  },
];

export function QuickActions() {
  const { setCurrentPage, setInvoiceCreationMode } = useAppStore();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-1">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const handleClick = () => {
            if (action.id === "sales" || action.id === "purchase") {
              setInvoiceCreationMode(
                action.id === "sales" ? "sales" : "purchase",
              );
            }
            setCurrentPage(action.page as any);
          };
          return (
            <button
              key={action.id}
              onClick={handleClick}
              className={cn(
                "group relative overflow-hidden rounded-lg p-4",
                "bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550]",
                "hover:shadow-md dark:hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/50",
                "transition-all duration-200 ease-out",
                "hover:-translate-y-0.5",
              )}
            >
              {/* Background gradient */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-5",
                  `bg-linear-to-br ${action.color}`,
                  "transition-opacity duration-200",
                )}
              />

              {/* Content */}
              <div className="relative space-y-2">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    `bg-linear-to-br ${action.color} text-white shadow-lg`,
                    "group-hover:shadow-xl transition-shadow duration-200",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {action.label}
                  </p>
                  {action.shortcut && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                      {action.shortcut}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
