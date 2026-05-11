import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';

export function ReportsPage() {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) => t(key, { defaultValue: fallback });
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

  const allParties = [...db.getParties(), ...db.getSuppliers().map(s => ({ id: s.id, name: s.name, phone: s.phone, email: s.email }))];
  const outstandingParties = allParties.map(p => ({ ...p, balance: db.getPartyBalance(p.id) })).filter(p => p.balance.balance > 0).sort((a, b) => b.balance.balance - a.balance.balance);

  const inputCls = "px-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#1e2330] rounded-md bg-white dark:bg-[#111318] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb]";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white">{tx('reports.title', 'Reports')}</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
          <span className="text-[11px] text-slate-400">{tx('reports.toDate', 'to')}</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tx('dashboard.totalSales', 'Total Sales'), value: report.totalSales, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: tx('dashboard.totalPurchases', 'Total Purchases'), value: report.totalPurchases, color: 'text-red-600 dark:text-red-400' },
          { label: tx('reports.profitLoss', 'Profit / Loss'), value: report.profit, color: 'text-[#3b5bdb] dark:text-[#8ba4f9]' },
          { label: tx('billing.commission', 'Commission'), value: report.totalCommission, color: 'text-slate-800 dark:text-slate-200' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600 mb-1">{kpi.label}</p>
            <p className={`text-[17px] font-semibold tabnum ${kpi.color}`}>{formatCurrency(kpi.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1a1f2e]">
            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{tx('reports.outstanding', 'Outstanding')}</h3>
          </div>
          <div className="p-4">
            {outstandingParties.length === 0 ? (
              <p className="text-center py-6 text-[12px] text-slate-400">{tx('emptyStates.noOutstanding', 'No outstanding balances')}</p>
            ) : (
              <div className="space-y-1 max-h-[360px] overflow-y-auto">
                {outstandingParties.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-[#1a1f2e] last:border-0">
                    <div>
                      <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[12px] tabnum font-semibold ${p.balance.type === 'receivable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(p.balance.balance)}</p>
                      <Badge variant={p.balance.type === 'receivable' ? 'success' : 'danger'}>{p.balance.type === 'receivable' ? tx('reports.receivable', 'Receivable') : tx('reports.payable', 'Payable')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1a1f2e] flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{tx('reports.daybook', 'Daybook')}</h3>
            <input type="date" value={daybookDate} onChange={e => setDaybookDate(e.target.value)}
              className="px-2.5 py-1 text-[11px] border border-slate-200 dark:border-[#1e2330] rounded-md bg-white dark:bg-[#0e1017] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb]" />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-50 dark:bg-[#0e1017] rounded-md p-2.5 text-center">
                <p className="text-[13px] font-semibold tabnum text-emerald-600 dark:text-emerald-400">{formatCurrency(daybookTotalSales)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{tx('dashboard.totalSales', 'Sales')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#0e1017] rounded-md p-2.5 text-center">
                <p className="text-[13px] font-semibold tabnum text-[#3b5bdb] dark:text-[#8ba4f9]">{formatCurrency(daybookTotalReceived)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{tx('payments.received', 'Received')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#0e1017] rounded-md p-2.5 text-center">
                <p className="text-[13px] font-semibold tabnum text-red-600 dark:text-red-400">{formatCurrency(daybookTotalPaid)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{tx('payments.paid', 'Paid')}</p>
              </div>
            </div>
            <div className="space-y-0 max-h-[260px] overflow-y-auto">
              {daybook.bills.length > 0 && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.06em] pb-1">{tx('common.bills', 'Bills')}</p>}
              {daybook.bills.map(b => (
                <div key={b.id} className="flex justify-between text-[12px] py-1.5 border-b border-slate-50 dark:border-[#1a1f2e] last:border-0">
                  <span className="text-slate-600 dark:text-slate-400">{b.billNo} · {b.partyName}</span>
                  <span className="tabnum text-slate-800 dark:text-slate-200 font-medium">{formatCurrency(b.total)}</span>
                </div>
              ))}
              {daybook.payments.length > 0 && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.06em] pb-1 pt-2">{tx('navigation.payments', 'Payments')}</p>}
              {daybook.payments.map(p => (
                <div key={p.id} className="flex justify-between text-[12px] py-1.5 border-b border-slate-50 dark:border-[#1a1f2e] last:border-0">
                  <span className="text-slate-600 dark:text-slate-400">{p.partyName} · {p.mode}</span>
                  <span className={`tabnum font-medium ${p.type === 'received' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{p.type === 'received' ? '+' : '-'}{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {daybook.bills.length === 0 && daybook.payments.length === 0 && (
                <p className="text-center py-6 text-[12px] text-slate-400">{tx('reports.noTransactionsOn', 'No transactions on')} {formatDate(daybookDate)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1a1f2e]">
          <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{tx('reports.inventoryReport', 'Inventory Report')}</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { label: tx('reports.totalItems', 'Total Items'), value: db.getInventoryItems().length, color: 'text-slate-800 dark:text-slate-200' },
              { label: tx('inventory.inStock', 'In Stock'), value: db.getInventoryItems().filter(i => i.status === 'in_stock').length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: tx('inventory.lowStock', 'Low Stock'), value: db.getInventoryItems().filter(i => i.status === 'low_stock').length, color: 'text-amber-600 dark:text-amber-400' },
              { label: tx('inventory.outOfStock', 'Out of Stock'), value: db.getInventoryItems().filter(i => i.status === 'out_of_stock').length, color: 'text-red-600 dark:text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 dark:bg-[#0e1017] rounded-md p-2.5 text-center">
                <p className={`text-[15px] font-semibold tabnum ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1a1f2e]">
                  <th className="text-left py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.itemName', 'Item')}</th>
                  <th className="text-left py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.grade', 'Grade')}</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('reports.stock', 'Stock')}</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('reports.estimatedValue', 'Est. Value')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-[#1a1f2e]">
                {db.getInventoryItems().map(i => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-[#0e1017] transition-colors">
                    <td className="py-2 text-slate-800 dark:text-slate-200">{i.name}</td>
                    <td className="py-2 text-slate-500">{i.grade}</td>
                    <td className="py-2 text-right tabnum text-slate-600 dark:text-slate-400">{i.currentStock} {i.unit}</td>
                    <td className="py-2 text-right tabnum font-medium text-slate-800 dark:text-slate-200">&#8377;{(i.currentStock * 50).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
