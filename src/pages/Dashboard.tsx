import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { PageLayout } from '@/components/PremiumLayout';
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
    <PageLayout
      title="Dashboard"
      subtitle="Operations Workspace / enterprise command center"
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800/45 dark:text-emerald-300 dark:bg-emerald-950/30">
            Live Overview
          </span>
        </div>
      }
    >
      <QuickActions />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-1">{t('common.operationalStatus')}</h2>
        <PendingTasksWidgets />
      </div>

      <RecentActivitySection />
    </PageLayout>
  );
}
