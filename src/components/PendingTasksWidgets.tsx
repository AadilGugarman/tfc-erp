import { useAppStore } from "@/stores/useAppStore";
import type { PageId } from "@/stores/useAppStore";
import { Clock, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface TaskWidget {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count: number;
  value?: string;
  action?: () => void;
  page?: PageId;
}

export function PendingTasksWidgets() {
  const { bills, setCurrentPage } = useAppStore();

  // Calculate pending data from available data
  const pendingPayments = bills.filter(
    (b) => b.status === "unpaid" || b.status === "partial",
  ).length;

  const pendingPaymentsAmount = bills
    .filter((b) => b.status === "unpaid" || b.status === "partial")
    .reduce((sum, b) => sum + (b.netBalance || 0), 0);

  const widgets: TaskWidget[] = [
    {
      id: "payments",
      title: "Pending Payments",
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      count: pendingPayments,
      value: formatCurrency(pendingPaymentsAmount),
      page: "payments",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {widgets.map((widget) => {
        const Icon = widget.icon;
        return (
          <button
            key={widget.id}
            onClick={() => widget.page && setCurrentPage(widget.page)}
            className={cn(
              "group relative overflow-hidden rounded-lg p-4",
              "bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550]",
              "hover:shadow-md dark:hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/50",
              "transition-all duration-200 ease-out text-left",
              "hover:-translate-y-0.5",
            )}
          >
            {/* Background gradient */}
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-5",
                `bg-gradient-to-br ${widget.color}`,
                "transition-opacity duration-200",
              )}
            />

            {/* Content */}
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    `bg-gradient-to-br ${widget.color} text-white shadow-lg`,
                    "group-hover:shadow-xl transition-shadow duration-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {widget.title}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {widget.count}
                  </p>
                  {widget.value && (
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {widget.value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
