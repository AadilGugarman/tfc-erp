import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Building2, Grid2x2, HandCoins, Package2, Route, Truck } from 'lucide-react';

const quickActions = [
  { label: 'New Vehicle Entry', icon: Truck },
  { label: 'Sales Billing', icon: HandCoins },
  { label: 'Inventory Inward', icon: Package2 },
  { label: 'Ledger Lookup', icon: Route },
  { label: 'Party Register', icon: Building2 },
  { label: 'Reports', icon: Grid2x2 },
];

export function TabletViewPage() {
  return (
    <div className="space-y-6">
      <div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tablet Optimized View / ટેબલેટ વ્યૂ</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <button key={action.label} className="flex min-h-28 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
              <action.icon className="h-6 w-6 text-slate-900 dark:text-white" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}