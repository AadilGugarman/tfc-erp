import { cn } from "@/utils/cn";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Truck,
  BookOpen,
  Receipt,
  Package,
  CreditCard,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      {
        id: "dashboard",
        labelKey: "navigation.dashboard",
        icon: LayoutDashboard,
        shortcut: "Alt+1",
      },
      {
        id: "transactions",
        labelKey: "navigation.transactions",
        icon: Receipt,
        shortcut: "Alt+5",
      },
    ],
  },
  {
    label: "Accounting",
    items: [
      {
        id: "vehicle-register",
        labelKey: "navigation.vehicleArrivalRegister",
        icon: Truck,
        shortcut: "Alt+V",
      },
      {
        id: "inventory",
        labelKey: "navigation.inventory",
        icon: Package,
        shortcut: "Alt+6",
      },
      {
        id: "parties",
        labelKey: "navigation.parties",
        icon: Users,
        shortcut: "Alt+2",
      },
      {
        id: "suppliers",
        labelKey: "navigation.suppliers",
        icon: Layers,
        shortcut: "Alt+3",
      },
      {
        id: "ledger",
        labelKey: "navigation.ledger",
        icon: BookOpen,
        shortcut: "Alt+4",
      },
      {
        id: "payments",
        labelKey: "navigation.payments",
        icon: CreditCard,
        shortcut: "Alt+7",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        id: "reports",
        labelKey: "navigation.reports",
        icon: BarChart3,
        shortcut: "Alt+8",
      },
      {
        id: "settings",
        labelKey: "navigation.settings",
        icon: SettingsIcon,
        shortcut: "Alt+9",
      },
    ],
  },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } =
    useAppStore();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed top-16 left-0 z-20 h-[calc(100vh-4rem)] flex flex-col",
        "bg-gradient-to-b from-[#f8fbff] via-[#f4f8ff] to-[#eef4ff] dark:from-[#0b1324] dark:via-[#0a1222] dark:to-[#0a111f] backdrop-blur-xl",
        "border-r border-slate-200/80 dark:border-[#1f2a43]",
        "transition-[width] duration-300 ease-in-out",
        sidebarOpen ? "w-56" : "w-[60px]",
      )}
    >
      <div className="h-11 shrink-0 flex items-center border-b border-slate-200/60 dark:border-[#1f2a43]/80 px-2.5">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
            "text-slate-500 dark:text-slate-400",
            "bg-white/60 dark:bg-[#101a2f]/75 ring-1 ring-slate-200/70 dark:ring-[#2a3550]/75",
            "hover:bg-white dark:hover:bg-[#1b2945] hover:text-slate-700 dark:hover:text-slate-200",
            "transition-all duration-150",
            !sidebarOpen && "mx-auto",
          )}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 space-y-6 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {sidebarOpen && (
              <div className="mb-2.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-[#5b6f95] select-none">
                  {group.label}
                </span>
              </div>
            )}
            <div className={cn("space-y-1", !sidebarOpen && "space-y-2")}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                const label = t(item.labelKey);

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    title={!sidebarOpen ? label : undefined}
                    className={cn(
                      "group relative w-full rounded-xl transition-all duration-150 font-medium",
                      sidebarOpen
                        ? cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm",
                            active
                              ? "bg-linear-to-r from-blue-50/95 to-cyan-50/85 dark:from-blue-950/35 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/70 dark:ring-blue-800/35"
                              : "text-slate-600 dark:text-slate-400 hover:bg-white/65 dark:hover:bg-[#16203a] hover:text-slate-900 dark:hover:text-slate-200",
                          )
                        : cn(
                            "flex h-11 w-11 items-center justify-center mx-auto rounded-xl",
                            active
                              ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-600/30"
                              : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/70 dark:hover:bg-[#16203a]",
                          ),
                    )}
                  >
                    {/* Active indicator line (expanded only) */}
                    {active && sidebarOpen && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-500" />
                    )}

                    {/* Icon */}
                    <Icon
                      className={cn(
                        !sidebarOpen
                          ? "h-6 w-6 shrink-0 transition-all duration-150"
                          : "h-4 w-4 shrink-0 transition-all duration-150",
                        active && sidebarOpen
                          ? "text-blue-600 dark:text-blue-400"
                          : active
                            ? "text-white"
                            : "",
                      )}
                    />

                    {/* Label (expanded only) */}
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left truncate">
                          {label}
                        </span>
                        <kbd
                          className={cn(
                            "ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-mono leading-none ring-1",
                            active
                              ? "ring-blue-300/80 bg-blue-100/80 text-blue-700 dark:ring-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : "ring-slate-200 bg-white/90 text-slate-500 dark:ring-[#2c3a59] dark:bg-[#14213a] dark:text-slate-400",
                          )}
                        >
                          {item.shortcut}
                        </kbd>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
