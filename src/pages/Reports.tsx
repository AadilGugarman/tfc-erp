import { Card } from '@/components/ui/Card';

export function ReportsPage() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sales, ledger, and inventory analytics will appear here.
        </p>
      </header>

      <Card className="p-6 text-sm text-slate-600 dark:text-slate-300">
        Reports module is wired and ready for implementation.
      </Card>
    </section>
  );
}
