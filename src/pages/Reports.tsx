import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import { TrendingUp, TrendingDown, CreditCard, IndianRupee, Calendar } from 'lucide-react';

export function ReportsPage() {
  const { loadParties, loadSuppliers, loadBills, loadPurchases, loadPayments } = useAppStore();
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(todayStr());
  const [daybookDate, setDaybookDate] = useState(todayStr());

  useEffect(() => { loadParties(); loadSuppliers(); loadBills(); loadPurchases(); loadPayments(); }, []);

  const report = db.getReportData(dateFrom, dateTo);
  const daybook = db.getDaybook(daybookDate);
  const daybookTotalSales = daybook.bills.reduce((s, b) => s + b.total, 0);
  const daybookTotalReceived = daybook.payments.filter(p => p.type === 'received').reduce((s, p) => s + p.amount, 0);
  const daybookTotalPaid = daybook.payments.filter(p => p.type === 'paid').reduce((s, p) => s + p.amount, 0);

  // Outstanding parties
  const allParties = [...db.getParties(), ...db.getSuppliers().map(s => ({ id: s.id, name: s.name, phone: s.phone, email: s.email }))];
  const outstandingParties = allParties.map(p => ({ ...p, balance: db.getPartyBalance(p.id) })).filter(p => p.balance.balance > 0).sort((a, b) => b.balance.balance - a.balance.balance);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports / રિપોર્ટ</h1></div>

      {/* Date Range */}
      <Card><CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /><span className="text-sm font-medium text-slate-600 dark:text-slate-300">Date Range</span></div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white" />
          <span className="text-slate-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white" />
        </div>
      </CardContent></Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(report.totalSales)}</p><p className="text-xs text-slate-500">Total Sales</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><TrendingDown className="h-5 w-5 text-red-600" /></div><div><p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(report.totalPurchases)}</p><p className="text-xs text-slate-500">Total Purchases</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><CreditCard className="h-5 w-5 text-blue-600" /></div><div><p className="text-xl font-bold text-blue-600">{formatCurrency(report.profit)}</p><p className="text-xs text-slate-500">Profit/Loss</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><IndianRupee className="h-5 w-5 text-purple-600" /></div><div><p className="text-xl font-bold text-purple-600">{formatCurrency(report.totalCommission)}</p><p className="text-xs text-slate-500">Commission Earned</p></div></div></CardContent></Card>
      </div>

      {/* Outstanding & Daybook */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Parties */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><h3 className="font-semibold text-slate-900 dark:text-white">Outstanding Parties / બાકી રકમ</h3></div>
          <CardContent className="p-4">
            {outstandingParties.length === 0 ? <p className="text-center py-6 text-slate-400">No outstanding</p> : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {outstandingParties.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <div><p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p><p className="text-xs text-slate-400">{p.phone}</p></div>
                    <div className="text-right"><p className={`text-sm font-bold ${p.balance.type === 'receivable' ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(p.balance.balance)}</p>
                      <Badge variant={p.balance.type === 'receivable' ? 'success' : 'danger'}>{p.balance.type === 'receivable' ? 'Receive' : 'Pay'}</Badge></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daybook */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Daybook / દૈનિક બહી</h3>
            <input type="date" value={daybookDate} onChange={e => setDaybookDate(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center"><p className="text-lg font-bold text-emerald-600">{formatCurrency(daybookTotalSales)}</p><p className="text-xs text-slate-500">Sales</p></div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center"><p className="text-lg font-bold text-blue-600">{formatCurrency(daybookTotalReceived)}</p><p className="text-xs text-slate-500">Received</p></div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center"><p className="text-lg font-bold text-red-600">{formatCurrency(daybookTotalPaid)}</p><p className="text-xs text-slate-500">Paid</p></div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {daybook.bills.length > 0 && <h4 className="text-xs font-semibold text-slate-500 uppercase">Bills</h4>}
              {daybook.bills.map(b => <div key={b.id} className="flex justify-between text-sm py-1"><span className="text-slate-600 dark:text-slate-300">{b.billNo} - {b.partyName}</span><span className="font-mono text-slate-900 dark:text-white">{formatCurrency(b.total)}</span></div>)}
              {daybook.payments.length > 0 && <h4 className="text-xs font-semibold text-slate-500 uppercase mt-3">Payments</h4>}
              {daybook.payments.map(p => <div key={p.id} className="flex justify-between text-sm py-1"><span className="text-slate-600 dark:text-slate-300">{p.partyName} ({p.mode})</span><span className={`font-mono ${p.type === 'received' ? 'text-emerald-600' : 'text-red-600'}`}>{p.type === 'received' ? '+' : '-'}{formatCurrency(p.amount)}</span></div>)}
              {daybook.bills.length === 0 && daybook.payments.length === 0 && <p className="text-center py-6 text-slate-400">No transactions on {formatDate(daybookDate)}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Report */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700"><h3 className="font-semibold text-slate-900 dark:text-white">Inventory Report / ઈન્વેન્ટરી રિપોર્ટ</h3></div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-slate-900 dark:text-white">{db.getInventoryItems().length}</p><p className="text-xs text-slate-500">Total Items</p></div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-slate-900 dark:text-white">{db.getInventoryItems().filter(i => i.status === 'in_stock').length}</p><p className="text-xs text-slate-500">In Stock</p></div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-amber-600">{db.getInventoryItems().filter(i => i.status === 'low_stock').length}</p><p className="text-xs text-slate-500">Low Stock</p></div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-red-600">{db.getInventoryItems().filter(i => i.status === 'out_of_stock').length}</p><p className="text-xs text-slate-500">Out of Stock</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 dark:border-slate-700"><th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Item</th><th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Grade</th><th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Stock</th><th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Est. Value</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {db.getInventoryItems().map(i => <tr key={i.id}><td className="py-2 text-slate-900 dark:text-white">{i.name}</td><td className="py-2 text-slate-500">{i.grade}</td><td className="py-2 text-right font-mono">{i.currentStock} {i.unit}</td><td className="py-2 text-right font-mono text-slate-900 dark:text-white">₹{(i.currentStock * 50).toLocaleString('en-IN')}</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
