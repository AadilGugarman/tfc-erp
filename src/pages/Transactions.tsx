import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLayout } from '@/components';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Bill, Purchase } from '@/db/schema';
import { ArrowDownCircle, ArrowUpCircle, Filter, Printer, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useShortcutAction } from '@/keyboard/shortcutManager';

type TxTypeFilter = 'all' | 'sale' | 'purchase';

type TxRecord = {
  id: string;
  txType: 'sale' | 'purchase';
  txNo: string;
  date: string;
  partyName: string;
  total: number;
  paidAmount: number;
  netBalance: number;
  status: 'paid' | 'partial' | 'unpaid';
};

function buildRecords(type: TxTypeFilter, search: string, from: string, to: string, bills: Bill[], purchases: Purchase[]): TxRecord[] {
  const out: TxRecord[] = [];

  if (type !== 'purchase') {
    for (const b of bills) {
      out.push({
        id: b.id,
        txType: 'sale',
        txNo: b.billNo,
        date: b.date,
        partyName: b.partyName,
        total: b.total,
        paidAmount: b.paidAmount,
        netBalance: b.netBalance,
        status: b.status,
      });
    }
  }

  if (type !== 'sale') {
    for (const p of purchases) {
      out.push({
        id: p.id,
        txType: 'purchase',
        txNo: p.purchaseNo,
        date: p.date,
        partyName: p.supplierName,
        total: p.total,
        paidAmount: p.paidAmount,
        netBalance: p.netBalance,
        status: p.status,
      });
    }
  }

  const q = search.trim().toLowerCase();
  return out
    .filter(r => {
      const searchMatch =
        q.length === 0 ||
        r.txNo.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q);
      const fromMatch = !from || r.date >= from;
      const toMatch = !to || r.date <= to;
      return searchMatch && fromMatch && toMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.txNo.localeCompare(a.txNo));
}

export function TransactionsPage() {
  const { setCurrentPage, bills, purchases, loadBills, loadPurchases } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState<TxTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBills();
    loadPurchases();
  }, []);

  const records = useMemo(
    () => buildRecords(type, search, dateFrom, dateTo, bills, purchases),
    [type, search, dateFrom, dateTo, bills, purchases]
  );

  // Clamp selectedRowIndex when records change
  useEffect(() => {
    if (selectedRowIndex >= records.length && records.length > 0) {
      setSelectedRowIndex(records.length - 1);
    } else if (records.length === 0) {
      setSelectedRowIndex(0);
    }
  }, [records.length, selectedRowIndex]);

  const totalSale = records.filter(r => r.txType === 'sale').reduce((sum, r) => sum + r.total, 0);
  const totalPurchase = records.filter(r => r.txType === 'purchase').reduce((sum, r) => sum + r.total, 0);
  const totalPending = records.reduce((sum, r) => sum + r.netBalance, 0);

  // Wire keyboard shortcuts for this surface
  useShortcutAction('new-entry', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="transactions"]')) return;
    setCurrentPage('billing');
  });

  useShortcutAction('save', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="transactions"]')) return;
    // Transactions is read-only, so save is not applicable
  });

  // Handle ArrowUp/ArrowDown row selection when table is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = tableContainerRef.current;
      if (!container) return;

      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement?.closest('[data-entry-surface="transactions"]')) return;

      if (e.key === 'ArrowUp' && records.length > 0) {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowDown' && records.length > 0) {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.min(prev + 1, records.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [records.length]);

  const printRow = (row: TxRecord) => {
    const w = window.open('', '_blank', 'width=960,height=720');
    if (!w) return;
    w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${row.txNo}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a}
h1{margin:0 0 8px 0;font-size:22px}
.meta{margin-bottom:20px;color:#475569}
.kv{display:grid;grid-template-columns:160px 1fr;gap:6px 10px;max-width:640px}
.badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:600}
</style>
</head>
<body>
<h1>${row.txType === 'sale' ? 'Sale Transaction' : 'Purchase Transaction'}</h1>
<div class="meta">Generated from ERP transaction register</div>
<div class="kv">
<div>No</div><div><strong>${row.txNo}</strong></div>
<div>Date</div><div>${formatDate(row.date)}</div>
<div>Party</div><div>${row.partyName}</div>
<div>Total</div><div>${formatCurrency(row.total)}</div>
<div>Paid</div><div>${formatCurrency(row.paidAmount)}</div>
<div>Balance</div><div>${formatCurrency(row.netBalance)}</div>
<div>Status</div><div><span class="badge">${row.status}</span></div>
</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div className="flex flex-col h-full animate-fade-in" data-entry-surface="transactions">
      <PageLayout
        title="Transactions"
        subtitle="Operations Workspace / unified sales and purchase register"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('search')}>
              <Search className="h-3.5 w-3.5" /> Search
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
              <Filter className="h-3.5 w-3.5" /> Filters
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage('purchases')}>
              <ArrowDownCircle className="h-3.5 w-3.5" /> New Purchase
            </Button>
            <Button size="sm" onClick={() => setCurrentPage('billing')}>
              <ArrowUpCircle className="h-3.5 w-3.5" /> New Sale
            </Button>
          </div>
        }
      >

      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">Total Sales</span>
          <span className="text-[14px] font-semibold tabnum text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSale)}</span>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">Total Purchases</span>
          <span className="text-[14px] font-semibold tabnum text-red-600 dark:text-red-400">{formatCurrency(totalPurchase)}</span>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">Outstanding</span>
          <span className="text-[14px] font-semibold tabnum text-amber-600 dark:text-amber-400">{formatCurrency(totalPending)}</span>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">Records</span>
          <span className="text-[14px] font-semibold tabnum text-slate-800 dark:text-slate-200">{records.length}</span>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600 mb-1">Type</label>
              <div className="flex rounded-md border border-slate-200 dark:border-[#2a3550] overflow-hidden">
                {(['all', 'sale', 'purchase'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setType(v)}
                    className={cn(
                      'px-3 py-1.5 text-[11px] font-medium capitalize transition-colors',
                      type === v
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-[#172036]'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="No, Party, Supplier..."
                  className="w-full pl-7 pr-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#2a3550] rounded-md bg-white dark:bg-[#111827] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#2a3550] rounded-md bg-white dark:bg-[#111827] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#2a3550] rounded-md bg-white dark:bg-[#111827] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setType('all');
                setSearch('');
                setDateFrom('');
                setDateTo('');
              }}
              className="py-1.5 px-2.5 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-[#2a3550] rounded-md hover:bg-slate-50 dark:hover:bg-[#172036] transition-colors mt-5"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827]" ref={tableContainerRef}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#22304a]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] whitespace-nowrap">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] whitespace-nowrap">Tx No</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">Party</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">Total</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">Paid</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">Balance</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">Status</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a43]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400 text-[12px]">No sales/purchase records found</td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr 
                    key={`${r.txType}-${r.id}`} 
                    className={cn(
                      'hover:bg-slate-50 dark:hover:bg-[#172036] transition-colors',
                      selectedRowIndex === idx && 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500'
                    )}
                  >
                    <td className="px-4 py-2.5">
                      {r.txType === 'sale' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <ArrowUpCircle className="h-3 w-3" /> Sale
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          <ArrowDownCircle className="h-3 w-3" /> Purchase
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabnum text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.txNo}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium max-w-[180px] truncate">{r.partyName}</td>
                    <td className="px-4 py-2.5 text-right tabnum font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{formatCurrency(r.total)}</td>
                    <td className="px-4 py-2.5 text-right tabnum text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{r.paidAmount > 0 ? formatCurrency(r.paidAmount) : '—'}</td>
                    <td className="px-4 py-2.5 text-right tabnum text-amber-600 dark:text-amber-400 whitespace-nowrap font-semibold">{r.netBalance > 0 ? formatCurrency(r.netBalance) : '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge variant={r.status === 'paid' ? 'success' : r.status === 'partial' ? 'warning' : 'danger'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => printRow(r)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1b2335] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Print"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </PageLayout>
    </div>
  );
}
