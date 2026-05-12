import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { QuickActions } from "@/components/QuickActions";
import { PendingTasksWidgets } from "@/components/PendingTasksWidgets";
import { RecentActivitySection } from "@/components/RecentActivitySection";

export function DashboardPage() {
  const { loadParties, loadSuppliers, loadPayments, loadInventory } =
    useAppStore();

  useEffect(() => {
    loadParties();
    loadSuppliers();
    loadPayments();
    loadInventory();
  }, [loadParties, loadSuppliers, loadPayments, loadInventory]);

  return (
    <div className="space-y-3 animate-fade-in">
      <QuickActions />
      <PendingTasksWidgets />
      <RecentActivitySection />
    </div>
  );
}
