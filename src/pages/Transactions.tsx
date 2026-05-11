import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import type { BillItem, PurchaseItem } from '@/db/schema';
import {
  Plus, Trash2, Printer, Search, ArrowDownCircle, ArrowUpCircle,
  Filter, X, ChevronDown, Save, RefreshCw, Receipt,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type TxType = 'sale' | 'purchase';

interface LineItem {
  id: string;
  fruitName: string;
  grade: string;
  lotNo: string;
  // SALE-specific
  boxCount: number;
  weightPerBox: number;
  // shared
  totalWeight: number;
  rate: number;
  amount: number;
  unit: string;
}

type FilterState = {
  type: 'all' | 'sale' | 'purchase';
  search: string;
  dateFrom: string;
  dateTo: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const emptyLine = (): LineItem => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  fruitName: '',
  grade: 'A',
  lotNo: '',
  boxCount: 0,
  weightPerBox: 0,
  totalWeight: 0,
  rate: 0,
  amount: 0,
  unit: 'kg',
});

// Merge bills + purchases into a single list with common shape
interface TxRecord {
  id: string;
  txType: TxType;
  txNo: string;
  date: string;
  partyName: string;
  total: number;
  paidAmount: number;
  netBalance: number;
  status: 'paid' | 'partial' | 'unpaid';
  itemCount: number;
  notes: string;
  raw: ReturnType<typeof db.getBills>[0] | ReturnType<typeof db.getPurchases>[0];
}

function mergeTxRecords(filter: FilterState): TxRecord[] {
  const results: TxRecord[] = [];

  if (filter.type !== 'purchase') {
    db.getBills().forEach(b => {
      results.push({
        id: b.id, txType: 'sale', txNo: b.billNo, date: b.date,
        partyName: b.partyName, total: b.total, paidAmount: b.paidAmount,
        netBalance: b.netBalance, status: b.status,
        itemCount: b.items.length, notes: b.notes, raw: b,
      });
    });
  }

  if (filter.type !== 'sale') {
    db.getPurchases().forEach(p => {
      results.push({
        id: p.id, txType: 'purchase', txNo: p.purchaseNo, date: p.date,
        partyName: p.supplierName, total: p.total, paidAmount: p.paidAmount,
        netBalance: p.netBalance, status: p.status,
        itemCount: p.items.length, notes: p.notes, raw: p,
      });
    });
  }

  // Apply search / date filters
  return results
    .filter(r => {
      const q = filter.search.toLowerCase();
      const matchSearch = !q ||
        r.txNo.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q);
      const matchFrom = !filter.dateFrom || r.date >= filter.dateFrom;
      const matchTo = !filter.dateTo || r.date <= filter.dateTo;
      return matchSearch && matchFrom && matchTo;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.txNo.localeCompare(a.txNo));
}

// ─── Main Component ────────────────────────────────────────────────────────

export function TransactionsPage() {
  const { t } = useTranslation();
  const {
    parties, loadParties,
    suppliers, loadSuppliers,
    loadBills, loadPurchases,
    settings, showNotification,
  } = useAppStore();

  // View state
  const [view, setView] = useState<'list' | 'form'>('list');
  const [txType, setTxType] = useState<TxType>('sale');

  // Form state
  const [txDate, setTxDate] = useState(todayStr());
  const [partyId, setPartyId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);

  // List/filter state
  const [filter, setFilter] = useState<FilterState>({
    type: 'all', search: '', dateFrom: '', dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<TxRecord[]>([]);

  // Refs for keyboard navigation
  const gridRef = useRef<HTMLTableSectionElement>(null);

  // Load data
  useEffect(() => {
    loadParties();
    loadSuppliers();
    loadBills();
    loadPurchases();
  }, []);

  // Refresh record list when view = list
  useEffect(() => {
    if (view === 'list') {
      setRecords(mergeTxRecords(filter));
    }
  }, [view, filter]);

  // ── Calculations ──────────────────────────────────────────────────────

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalWeight = items.reduce((s, i) => s + i.totalWeight, 0);
  const totalQty = items.reduce((s, i) => s + (txType === 'sale' ? i.boxCount : i.totalWeight), 0);
  const commission = txType === 'sale' ? subtotal * (settings.commissionPercent / 100) : 0;
  const taxAmount = subtotal * (settings.taxPercent / 100);
  const grandTotal = txType === 'sale' ? subtotal - commission + taxAmount : subtotal;
  const pending = grandTotal - paidAmount;

  // ── Line item helpers ─────────────────────────────────────────────────

  const addLine = () => setItems(prev => [...prev, emptyLine()]);

  const removeLine = (id: string) => {
    if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateLine = (id: string, field: keyof LineItem, raw: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated: LineItem = { ...item, [field]: raw };

      if (txType === 'sale') {
        if (field === 'boxCount' || field === 'weightPerBox') {
          updated.totalWeight = Number(((updated.boxCount || 0) * (updated.weightPerBox || 0)).toFixed(3));
          updated.amount = Number((updated.totalWeight * (updated.rate || 0)).toFixed(2));
        } else if (field === 'rate') {
          updated.amount = Number((updated.totalWeight * (updated.rate || 0)).toFixed(2));
        }
      } else {
        // Purchase: totalWeight = qty field
        if (field === 'totalWeight' || field === 'rate') {
          updated.amount = Number(((updated.totalWeight || 0) * (updated.rate || 0)).toFixed(2));
        }
      }
      return updated;
    }));
  };

  // Keyboard navigation: Tab moves between cells, Enter adds new row on last row
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    totalCols: number,
  ) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey && colIndex === totalCols - 1)) {
      e.preventDefault();
      if (rowIndex === items.length - 1) {
        addLine();
        // Focus first cell of new row after state update
        setTimeout(() => {
          const rows = gridRef.current?.querySelectorAll('tr');
          if (rows) {
            const newRow = rows[rows.length - 1];
            (newRow?.querySelector('input') as HTMLInputElement | null)?.focus();
          }
        }, 50);
      } else {
        // Move to next row first cell
        const rows = gridRef.current?.querySelectorAll('tr');
        if (rows) {
          const nextRow = rows[rowIndex + 1];
          (nextRow?.querySelector('input') as HTMLInputElement | null)?.focus();
        }
      }
    }
  };

  // ── Reset form ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setPartyId('');
    setVehicleNo('');
    setNotes('');
    setPaidAmount(0);
    setTxDate(todayStr());
    setItems([emptyLine()]);
  };

  const openNewForm = (type: TxType) => {
    setTxType(type);
    resetForm();
    setView('form');
  };

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!partyId) {
      showNotification(txType === 'sale' ? 'Select a customer / party' : 'Select a supplier', 'error');
      return;
    }
    if (items.some(i => !i.fruitName || i.amount <= 0)) {
      showNotification('Fill in all item rows with valid amounts', 'error');
      return;
    }

    if (txType === 'sale') {
      const party = parties.find(p => p.id === partyId);
      if (!party) return;
      const billItems: BillItem[] = items.map(i => ({
        id: i.id,
        fruitName: i.fruitName,
        grade: i.grade,
        boxCount: i.boxCount,
        weightPerBox: i.weightPerBox,
        totalWeight: i.totalWeight,
        rate: i.rate,
        amount: i.amount,
        lotNo: i.lotNo,
      }));
      const status: 'paid' | 'partial' | 'unpaid' =
        paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
      const result = db.createBill({
        date: txDate,
        partyId,
        partyName: party.name,
        items: billItems,
        subtotal,
        commission,
        taxAmount,
        taxPercent: settings.taxPercent,
        total: grandTotal,
        previousBalance: 0,
        paidAmount,
        netBalance: pending,
        notes: vehicleNo ? `Vehicle: ${vehicleNo}${notes ? ' | ' + notes : ''}` : notes,
        status,
      });
      showNotification(`Sale ${result.bill.billNo} created!`, 'success');
    } else {
      const supplier = suppliers.find(s => s.id === partyId);
      if (!supplier) return;
      const purchaseItems: PurchaseItem[] = items.map(i => ({
        id: i.id,
        fruitName: i.fruitName,
        grade: i.grade,
        quantity: i.totalWeight,
        unit: i.unit,
        rate: i.rate,
        amount: i.amount,
        lotNo: i.lotNo,
      }));
      const status: 'paid' | 'partial' | 'unpaid' =
        paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
      db.createPurchase({
        date: txDate,
        supplierId: partyId,
        supplierName: supplier.name,
        items: purchaseItems,
        subtotal,
        taxAmount: 0,
        total: grandTotal,
        paidAmount,
        netBalance: pending,
        notes: vehicleNo ? `Vehicle: ${vehicleNo}${notes ? ' | ' + notes : ''}` : notes,
        status,
      });
      showNotification('Purchase created!', 'success');
    }

    loadBills();
    loadPurchases();
    setRecords(mergeTxRecords(filter));
    setView('list');
  };

  // ── Print ──────────────────────────────────────────────────────────────

  const printRecord = (r: TxRecord) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const isSale = r.txType === 'sale';
    const bill = isSale ? (r.raw as ReturnType<typeof db.getBills>[0]) : null;
    const purchase = !isSale ? (r.raw as ReturnType<typeof db.getPurchases>[0]) : null;

    const rows = isSale
      ? (bill!.items.map((item, i) =>
          `<tr><td>${i + 1}</td><td>${item.fruitName}</td><td>${item.grade}</td><td>${item.lotNo}</td>
           <td>${item.boxCount}</td><td>${item.weightPerBox}</td><td>${item.totalWeight}</td>
           <td>${formatCurrency(item.rate)}</td><td>${formatCurrency(item.amount)}</td></tr>`
        ).join(''))
      : (purchase!.items.map((item, i) =>
          `<tr><td>${i + 1}</td><td>${item.fruitName}</td><td>${item.grade}</td><td>${item.lotNo}</td>
           <td colspan="3">${item.quantity} ${item.unit}</td>
           <td>${formatCurrency(item.rate)}</td><td>${formatCurrency(item.amount)}</td></tr>`
        ).join(''));

    w.document.write(`<!DOCTYPE html><html><head><title>${r.txType === 'sale' ? 'Sale Bill' : 'Purchase'} ${r.txNo}</title>
      <style>body{font-family:'Courier New',monospace;padding:20px;max-width:800px;margin:0 auto}
      .header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px}
      table{width:100%;border-collapse:collapse;margin-bottom:15px}
      th,td{border:1px solid #333;padding:6px 8px;font-size:11px;text-align:left}
      th{background:#f0f0f0}.totals{text-align:right;font-size:12px}
      .totals p{margin:2px 0}.grand{font-size:16px;font-weight:bold;border-top:2px solid #333;padding-top:5px}
      .type-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;
        background:${isSale ? '#d1fae5' : '#dbeafe'};color:${isSale ? '#065f46' : '#1e40af'}}
      @media print{body{padding:0}}</style></head>
      <body>
      <div class="header">
        <h1>${settings.businessName}</h1>
        <p><span class="type-badge">${isSale ? 'SALE' : 'PURCHASE'}</span></p>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:12px">
        <div><strong>${isSale ? 'Bill No' : 'PO No'}:</strong> ${r.txNo}<br>
             <strong>Date:</strong> ${formatDate(r.date)}</div>
        <div><strong>${isSale ? 'Customer' : 'Supplier'}:</strong> ${r.partyName}</div>
      </div>
      <table><thead><tr>
        <th>#</th><th>Item</th><th>Grade</th><th>Lot</th>
        ${isSale ? '<th>Boxes</th><th>Wt/Box</th>' : ''}<th>Total Wt</th>
        <th>Rate</th><th>Amount</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="totals">
        <p class="grand">Total: ${formatCurrency(r.total)}</p>
        ${r.paidAmount > 0 ? `<p>Paid: ${formatCurrency(r.paidAmount)}</p><p class="grand">Balance: ${formatCurrency(r.netBalance)}</p>` : ''}
      </div>
      <script>window.onload=()=>window.print();</script>
      </body></html>`);
    w.document.close();
  };

  // ── Render: List view ──────────────────────────────────────────────────

  const totalSale = records.filter(r => r.txType === 'sale').reduce((s, r) => s + r.total, 0);
  const totalPurchase = records.filter(r => r.txType === 'purchase').reduce((s, r) => s + r.total, 0);
  const totalPending = records.reduce((s, r) => s + r.netBalance, 0);

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full space-y-4">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-500" />
              Transactions
              <span className="text-sm font-normal text-slate-400 ml-1">/ વ્યવહાર</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Unified sales &amp; purchase register
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(v => !v)}
              className="gap-1.5"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filter.search || filter.dateFrom || filter.dateTo || filter.type !== 'all') && (
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNewForm('purchase')}
              className="gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <ArrowDownCircle className="h-4 w-4" />
              New Purchase
            </Button>
            <Button
              size="sm"
              onClick={() => openNewForm('sale')}
              className="gap-1.5"
            >
              <ArrowUpCircle className="h-4 w-4" />
              New Sale
            </Button>
          </div>
        </div>

        {/* ── Summary Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-3">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Sales</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalSale)}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Purchases</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalPurchase)}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Outstanding</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalPending)}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500 font-medium">Total Records</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{records.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ── */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                  <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {(['all', 'sale', 'purchase'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setFilter(f => ({ ...f, type: t }))}
                        className={cn(
                          'flex-1 text-xs py-1.5 font-medium capitalize transition-colors',
                          filter.type === t
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="No, Party, Supplier..."
                      value={filter.search}
                      onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filter.dateFrom}
                    onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filter.dateTo}
                    onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setFilter({ type: 'all', search: '', dateFrom: '', dateTo: '' })}
                className="mt-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            </CardContent>
          </Card>
        )}

        {/* ── Transaction List ── */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Tx No</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Party / Supplier</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No transactions found</p>
                    <p className="text-xs mt-1">Create a sale or purchase to get started</p>
                  </td>
                </tr>
              ) : (
                records.map(r => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      {r.txType === 'sale' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <ArrowUpCircle className="h-3 w-3" /> Sale
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <ArrowDownCircle className="h-3 w-3" /> Purchase
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {r.txNo}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 font-medium max-w-[180px] truncate">
                      {r.partyName}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                      {formatCurrency(r.total)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-xs">
                      {r.paidAmount > 0 ? formatCurrency(r.paidAmount) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-600 dark:text-amber-400 whitespace-nowrap text-xs font-semibold">
                      {r.netBalance > 0 ? formatCurrency(r.netBalance) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge
                        variant={
                          r.status === 'paid' ? 'success' :
                          r.status === 'partial' ? 'warning' : 'danger'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => printRecord(r)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Render: Form view ──────────────────────────────────────────────────

  const isSale = txType === 'sale';
  const partyOptions = isSale
    ? [{ value: '', label: 'Select party...' }, ...parties.map(p => ({ value: p.id, label: p.name }))]
    : [{ value: '', label: 'Select supplier...' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))];

  const colCount = isSale ? 8 : 6; // columns in the grid

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* ── Form Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isSale ? (
              <><ArrowUpCircle className="h-5 w-5 text-emerald-500" /> New Sale</>
            ) : (
              <><ArrowDownCircle className="h-5 w-5 text-blue-500" /> New Purchase</>
            )}
          </h1>
        </div>

        {/* Transaction type toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Transaction Type:</span>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => { setTxType('sale'); resetForm(); }}
              className={cn(
                'px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors',
                isSale
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
              )}
            >
              <ArrowUpCircle className="h-3.5 w-3.5" /> Sale
            </button>
            <button
              onClick={() => { setTxType('purchase'); resetForm(); }}
              className={cn(
                'px-4 py-1.5 text-sm font-semibold flex items-center gap-1.5 transition-colors',
                !isSale
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
              )}
            >
              <ArrowDownCircle className="h-3.5 w-3.5" /> Purchase
            </button>
          </div>
        </div>
      </div>

      {/* ── Header Fields ── */}
      <Card className={cn(
        'border-l-4',
        isSale ? 'border-l-emerald-500' : 'border-l-blue-500',
      )}>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date *</label>
              <input
                type="date"
                value={txDate}
                onChange={e => setTxDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tx No
              </label>
              <input
                disabled
                value={isSale ? db.getNextBillNo() : db.getNextPurchaseNo()}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {isSale ? 'Customer / Party *' : 'Supplier *'}
              </label>
              <select
                value={partyId}
                onChange={e => setPartyId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {partyOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle No</label>
              <input
                type="text"
                placeholder="GJ-01-AB-1234"
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <input
                type="text"
                placeholder="Optional..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Spreadsheet Grid ── */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn(
                'border-b',
                isSale
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white',
              )}>
                <th className="px-3 py-2 text-left text-xs font-semibold w-8">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold min-w-[130px]">Item / Fruit</th>
                <th className="px-3 py-2 text-left text-xs font-semibold w-16">Grade</th>
                <th className="px-3 py-2 text-left text-xs font-semibold w-20">Lot No</th>
                {isSale ? (
                  <>
                    <th className="px-3 py-2 text-right text-xs font-semibold w-20">Boxes</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold w-24">Wt/Box (kg)</th>
                  </>
                ) : null}
                <th className="px-3 py-2 text-right text-xs font-semibold w-24">
                  {isSale ? 'Total Wt' : 'Qty / Wt'}
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold w-24">Rate (₹)</th>
                <th className="px-3 py-2 text-right text-xs font-semibold w-28">Amount (₹)</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody ref={gridRef} className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, rowIdx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-3 py-1.5 text-xs text-slate-400 text-center">{rowIdx + 1}</td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={item.fruitName}
                      onChange={e => updateLine(item.id, 'fruitName', e.target.value)}
                      onKeyDown={e => handleCellKeyDown(e, rowIdx, 0, colCount)}
                      placeholder="Mango, Apple..."
                      className="w-full px-2 py-1 text-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={item.grade}
                      onChange={e => updateLine(item.id, 'grade', e.target.value)}
                      onKeyDown={e => handleCellKeyDown(e, rowIdx, 1, colCount)}
                      className="w-14 px-2 py-1 text-sm text-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={item.lotNo}
                      onChange={e => updateLine(item.id, 'lotNo', e.target.value)}
                      onKeyDown={e => handleCellKeyDown(e, rowIdx, 2, colCount)}
                      className="w-20 px-2 py-1 text-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  {isSale ? (
                    <>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          value={item.boxCount || ''}
                          onChange={e => updateLine(item.id, 'boxCount', parseFloat(e.target.value) || 0)}
                          onKeyDown={e => handleCellKeyDown(e, rowIdx, 3, colCount)}
                          className="w-20 px-2 py-1 text-sm text-right border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.weightPerBox || ''}
                          onChange={e => updateLine(item.id, 'weightPerBox', parseFloat(e.target.value) || 0)}
                          onKeyDown={e => handleCellKeyDown(e, rowIdx, 4, colCount)}
                          className="w-24 px-2 py-1 text-sm text-right border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                        />
                      </td>
                    </>
                  ) : null}
                  <td className="px-2 py-1">
                    {isSale ? (
                      <span className="block w-24 px-2 py-1 text-sm text-right text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded">
                        {item.totalWeight > 0 ? item.totalWeight.toFixed(3) : '—'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.totalWeight || ''}
                        onChange={e => updateLine(item.id, 'totalWeight', parseFloat(e.target.value) || 0)}
                        onKeyDown={e => handleCellKeyDown(e, rowIdx, 3, colCount)}
                        className="w-24 px-2 py-1 text-sm text-right border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                      />
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={e => updateLine(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      onKeyDown={e => handleCellKeyDown(e, rowIdx, isSale ? 5 : 4, colCount)}
                      className="w-24 px-2 py-1 text-sm text-right border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-400 rounded bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <span className={cn(
                      'text-sm font-semibold',
                      item.amount > 0
                        ? isSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-300',
                    )}>
                      {item.amount > 0 ? formatCurrency(item.amount) : '—'}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => removeLine(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 dark:border-slate-700">
                <td colSpan={colCount + 1} className="px-3 py-2">
                  <button
                    onClick={addLine}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row <span className="text-xs">(Enter)</span>
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* ── Sticky Bottom Summary ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto ml-16 lg:ml-64 transition-all duration-300">
          <div className={cn(
            'mx-4 mb-4 rounded-xl shadow-2xl border p-4',
            isSale
              ? 'bg-emerald-950/95 border-emerald-700 backdrop-blur-sm'
              : 'bg-blue-950/95 border-blue-700 backdrop-blur-sm',
          )}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Items</span>
                  <span className="text-white font-bold">{items.filter(i => i.amount > 0).length}</span>
                </div>
                {isSale && (
                  <div>
                    <span className="text-slate-400 text-xs block">Total Boxes</span>
                    <span className="text-white font-bold">{items.reduce((s, i) => s + i.boxCount, 0)}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-xs block">Total Weight</span>
                  <span className="text-white font-bold">{totalWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Subtotal</span>
                  <span className="text-white font-bold">{formatCurrency(subtotal)}</span>
                </div>
                {isSale && commission > 0 && (
                  <div>
                    <span className="text-slate-400 text-xs block">Commission ({settings.commissionPercent}%)</span>
                    <span className="text-amber-300 font-bold">- {formatCurrency(commission)}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-xs block">Grand Total</span>
                  <span className="text-2xl font-extrabold text-white">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Paid + Save */}
              <div className="flex items-end gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Paid Amount</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount || ''}
                      onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-32 pl-7 pr-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {pending > 0 && (
                    <span className="text-xs text-amber-300 mt-0.5 block">
                      Balance: {formatCurrency(pending)}
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleSave}
                  className={cn(
                    'gap-2 py-2 px-5 font-semibold',
                    isSale ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-blue-500 hover:bg-blue-400',
                  )}
                >
                  <Save className="h-4 w-4" />
                  {isSale ? 'Save Sale' : 'Save Purchase'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
