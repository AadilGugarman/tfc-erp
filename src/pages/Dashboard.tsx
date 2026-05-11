import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { DashboardHero } from '@/components/DashboardHero';
import { QuickActions } from '@/components/QuickActions';
import { PendingTasksWidgets } from '@/components/PendingTasksWidgets';
import { RecentActivitySection } from '@/components/RecentActivitySection';
import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const {
    loadParties,
    loadSuppliers,
    loadBills,
    loadPurchases,
    loadPayments,
    loadInventory,
  } = useAppStore();
  const { t } = useTranslation();

  useEffect(() => {
    loadParties();
    loadSuppliers();
    loadBills();
    loadPurchases();
    loadPayments();
    loadInventory();
  }, [loadParties, loadSuppliers, loadBills, loadPurchases, loadPayments, loadInventory]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Hero Section */}
      <DashboardHero />

      {/* Quick Actions */}
      <QuickActions />

      {/* Pending Tasks */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-1">{t('common.operationalStatus')}</h2>
        <PendingTasksWidgets />
      </div>

      {/* Recent Activity */}
      <RecentActivitySection />
    </div>
  );
}
