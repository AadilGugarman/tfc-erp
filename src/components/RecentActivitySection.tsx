import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import * as db from '@/db/db';
import { ArrowUpRight, Truck, Receipt, Package, CreditCard } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'vehicle' | 'bill' | 'inventory' | 'payment';
  title: string;
  description: string;
  amount?: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  page: string;
}

export function RecentActivitySection() {
  const { bills, payments, inventoryItems, setCurrentPage } = useAppStore();
  const { t } = useTranslation();

  const vehicleRegisters = db.getVehicleRegisters();

  // Combine and sort all activities by date
  const activities: ActivityItem[] = [];

  // Add recent vehicle entries
  vehicleRegisters.slice(0, 5).forEach(v => {
    activities.push({
      id: `v-${v.id}`,
      type: 'vehicle',
      title: `Vehicle Entry #${v.entryNo}`,
      description: v.vehicleNumber || 'No vehicle number',
      amount: formatCurrency(v.grandTotal),
      date: v.date,
      icon: Truck,
      color: 'text-blue-600 dark:text-blue-400',
      page: 'vehicle-register',
    });
  });

  // Add recent bills
  bills.slice(0, 5).forEach(b => {
    activities.push({
      id: `b-${b.id}`,
      type: 'bill',
      title: `Bill #${b.billNo}`,
      description: b.partyId || 'No party',
      amount: formatCurrency(b.total),
      date: b.date,
      icon: Receipt,
      color: 'text-emerald-600 dark:text-emerald-400',
      page: 'billing',
    });
  });

  // Add recent payments
  payments.slice(0, 5).forEach(p => {
    activities.push({
      id: `p-${p.id}`,
      type: 'payment',
      title: `Payment #${p.id}`,
      description: p.type === 'received' ? 'Received' : 'Paid',
      amount: formatCurrency(p.amount),
      date: p.date,
      icon: CreditCard,
      color: 'text-green-600 dark:text-green-400',
      page: 'payments',
    });
  });

  // Sort by date (newest first) and take top 10
  const recentActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (recentActivities.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-6 py-8">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Recent Activity</h2>
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <button
                key={activity.id}
                onClick={() => setCurrentPage(activity.page)}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-3',
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  'transition-colors duration-150 text-left'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                  'bg-slate-100 dark:bg-slate-800 transition-colors',
                  activity.color
                )}>
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
