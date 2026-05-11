import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  Users,
} from 'lucide-react';

export function DashboardPage() {
  const { parties, suppliers, bills, payments, inventoryItems, settings, loadParties, loadSuppliers, loadBills, loadPurchases, loadPayments, loadInventory, setCurrentPage } = useAppStore();

  useEffect(() => {
    loadParties();
    loadSuppliers();
    loadBills();
    loadPurchases();
    loadPayments();
    loadInventory();
  }, []);

  const today = todayStr();
  const vehicleRegisters = db.getVehicleRegisters();
  const todayBills = bills.filter(bill => bill.date === today);
  const todayVehicles = vehicleRegisters.filter(register => register.date === today);
  const lowStockItems = inventoryItems.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock');

  const todaySales = todayBills.reduce((sum, bill) => sum + bill.total, 0);
  const todayVehicleTotal = todayVehicles.reduce((sum, register) => sum + register.grandTotal, 0);
  const todayVehicleWeight = todayVehicles.reduce((sum, register) => sum + register.totalWeight, 0);
  const todayReceived = payments.filter(payment => payment.date === today && payment.type === 'received').reduce((sum, payment) => sum + payment.amount, 0);
  const todayPaid = payments.filter(payment => payment.date === today && payment.type === 'paid').reduce((sum, payment) => sum + payment.amount, 0);

  const totalOutstandingReceivable = parties.reduce((sum, party) => {
    const balance = db.getPartyBalance(party.id);
    return balance.type === 'receivable' ? sum + balance.balance : sum;
  }, 0);

  const totalPayable = suppliers.reduce((sum, supplier) => {
    const balance = db.getPartyBalance(supplier.id);
    return balance.type === 'payable' ? sum + balance.balance : sum;
  }, 0);

  const stats = [
    { title: 'Today Total Amount', value: formatCurrency(todayVehicleTotal + todaySales), detail: `${todayBills.length} bills + ${todayVehicles.length} vehicles`, icon: TrendingUp },
    { title: 'Total Vehicles', value: String(vehicleRegisters.length), detail: `${todayVehicles.length} today`, icon: Truck },
    { title: 'Total Weight', value: `${todayVehicleWeight.toFixed(2)} kg`, detail: `${vehicleRegisters.reduce((sum, register) => sum + register.totalWeight, 0).toFixed(2)} kg overall`, icon: Package },
    { title: 'Outstanding Payments', value: formatCurrency(totalOutstandingReceivable), detail: `${parties.length} parties receivable`, icon: CreditCard },
    { title: 'Inventory Summary', value: String(inventoryItems.length), detail: `${inventoryItems.filter(item => item.status === 'in_stock').length} in stock`, icon: Users },
    { title: 'Low Stock Alerts', value: String(lowStockItems.length), detail: `${lowStockItems.filter(item => item.status === 'out_of_stock').length} out of stock`, icon: ArrowDownRight },
  ];

  const recentVehicles = [...vehicleRegisters].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentBills = [...bills].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCurrentPage('vehicle-register')} className="gap-2">
              <Truck className="h-4 w-4" /> New Arrival Entry
            </Button>
            <Button onClick={() => setCurrentPage('billing')} className="gap-2">
              <FileText className="h-4 w-4" /> New Bill
            </Button>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">{formatDate(today)} • Today&apos;s business summary</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-900 dark:bg-slate-700 dark:text-white">
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline">Live</Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Arrival Entries</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('vehicle-register')}>Open Arrival Register</Button>
          </CardHeader>
          <CardContent>
            {recentVehicles.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <Truck className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p>No arrival entries yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVehicles.map((register) => (
                  <button key={register.id} onClick={() => setCurrentPage('vehicle-register')} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{register.entryNo}</p>
                      <p className="text-xs text-slate-500">{register.vehicleNumber} • {register.driverName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(register.grandTotal)}</p>
                      <p className="text-xs text-slate-500">{register.totalWeight.toFixed(2)} kg</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Alerts</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('inventory')}>Open Inventory</Button>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <Package className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p>All stock levels are healthy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.grade} • {item.warehouse}</p>
                    </div>
                    <Badge variant={item.status === 'out_of_stock' ? 'danger' : 'warning'}>
                      {item.currentStock.toFixed(2)} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outstanding Summary</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('ledger')}>Open Ledger</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-300">To Receive</p>
                <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-200">{formatCurrency(totalOutstandingReceivable)}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-xs font-medium text-red-600 dark:text-red-300">To Pay</p>
                <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-200">{formatCurrency(totalPayable)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500">Net Position</p>
              <p className={`mt-1 text-xl font-bold ${totalOutstandingReceivable - totalPayable >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(totalOutstandingReceivable - totalPayable))}
              </p>
              <p className="text-xs text-slate-400">{totalOutstandingReceivable >= totalPayable ? 'Receivable' : 'Payable'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bills</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('billing')}>Open Billing</Button>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <FileText className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p>No bills yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{bill.billNo}</p>
                      <p className="text-xs text-slate-500">{bill.partyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(bill.total)}</p>
                      <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'}>{bill.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex-col gap-1" onClick={() => setCurrentPage('vehicle-register')}>
                <Truck className="h-5 w-5" />
                <span>Arrival Entry</span>
              </Button>
              <Button variant="secondary" className="h-16 flex-col gap-1" onClick={() => setCurrentPage('billing')}>
                <FileText className="h-5 w-5" />
                <span>New Bill</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setCurrentPage('payments')}>
                <CreditCard className="h-5 w-5" />
                <span>Payment</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setCurrentPage('inventory')}>
                <Package className="h-5 w-5" />
                <span>Stock Inward</span>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Today received</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(todayReceived)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Today paid</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatCurrency(todayPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


