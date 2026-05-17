import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import type { PageId } from "@/stores/useAppStore";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { useEffect } from "react";
import {
  ArrowUpRight,
  Truck,
  Receipt,
  Package,
  CreditCard,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "vehicle" | "bill" | "inventory" | "payment";
  title: string;
  description: string;
  amount?: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  page: PageId;
}

export function RecentActivitySection() {
  const {
    payments,
    inventoryItems,
    vehicleRegisters,
    setCurrentPage,
    loadVehicleRegisters,
  } = useAppStore();
  const { t } = useTranslation();

  useEffect(() => {
    loadVehicleRegisters();
  }, [loadVehicleRegisters]);

  // Combine and sort all activities by date
  const activities: ActivityItem[] = [];

  // Add recent vehicle entries
  vehicleRegisters.slice(0, 5).forEach((v) => {
    activities.push({
      id: `v-${v.id}`,
      type: "vehicle",
      title: `Vehicle Entry #${v.entryNo}`,
      description: v.vehicleNumber || "No vehicle number",
      amount: formatCurrency(v.grandTotal),
      date: v.date,
      icon: Truck,
      color: "text-blue-600 dark:text-blue-400",
      page: "vehicle-register",
    });
  });

  // Add recent payments
  payments.slice(0, 5).forEach((p) => {
    activities.push({
      id: `p-${p.id}`,
      type: "payment",
      title: `Payment #${p.id}`,
      description: p.type === "received" ? "Received" : "Paid",
      amount: formatCurrency(p.amount),
      date: p.date,
      icon: CreditCard,
      color: "text-green-600 dark:text-green-400",
      page: "payments",
    });
  });

  // Add recent inventory changes
  inventoryItems.slice(0, 5).forEach((i) => {
    activities.push({
      id: `i-${i.id}`,
      type: "inventory",
      title: `Inventory: ${i.name}`,
      description: `Stock: ${i.currentStock}${i.unit}`,
      amount: formatCurrency(i.currentStock * 100), // placeholder for display
      date: i.lastUpdated || new Date().toISOString(),
      icon: Package,
      color: "text-amber-600 dark:text-amber-400",
      page: "inventory",
    });
  });

  // Sort by date (newest first) and take top 10
  const recentActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (recentActivities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-1">
        Recent Activity
      </h2>
      <div className="rounded-lg border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827] overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-[#1f2a43]">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <button
                key={activity.id}
                onClick={() => setCurrentPage(activity.page)}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3",
                  "hover:bg-slate-50 dark:hover:bg-[#172036]",
                  "transition-colors duration-150 text-left",
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                    "bg-slate-100 dark:bg-slate-800 transition-colors",
                    activity.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activity.description} · {activity.date}
                  </p>
                </div>

                {/* Amount */}
                {activity.amount && (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabnum">
                      {activity.amount}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
