import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import { Plus, Search, Printer, ShoppingCart, Trash2 } from 'lucide-react';
import type { PurchaseItem } from '@/db/schema';
import { useSpreadsheetNavigation } from '@/hooks/useSpreadsheetNavigation';
import { useShortcutAction } from '@/keyboard/shortcutManager';

interface LineItem {
  id: string;
  fruitName: string;
  grade: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  lotNo: string;
}

function createEmptyItem(id = '1'): LineItem {
  return {
    id,
    fruitName: '',
    grade: 'A',
    quantity: 0,
    unit: 'kg',
    rate: 0,
    amount: 0,
    lotNo: '',
  };
}

export function PurchasesPage() {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) => t(key, { defaultValue: fallback });
  const { suppliers, purchases, loadSuppliers, loadPurchases, showNotification } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [pDate, setPDate] = useState(todayStr());
  const [items, setItems] = useState<LineItem[]>([createEmptyItem()]);
  const [pNotes, setPNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const itemsGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSuppliers();
    loadPurchases();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return purchases
      .filter(purchase =>
        purchase.purchaseNo.toLowerCase().includes(q) ||
        purchase.supplierName.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [purchases, search]);

  const totalPurchases = filtered.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalPaid = filtered.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
  const totalBalance = filtered.reduce((sum, purchase) => sum + purchase.netBalance, 0);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, createEmptyItem(Date.now().toString())]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => (prev.length > 1 ? prev.filter(item => item.id !== id) : prev));
  }, []);

  const grid = useSpreadsheetNavigation({
    rowCount: items.length,
    colCount: 6,
    onAddRow: addItem,
    onDeleteRow: (row) => {
      const item = items[row];
      if (!item) return;
      removeItem(item.id);
    },
  });

  const focusCell = useCallback((row: number, col: number) => {
    const element = itemsGridRef.current?.querySelector<HTMLInputElement>(`[data-r="${row}"][data-c="${col}"]`);
    element?.focus();
    element?.select();
  }, []);

  useEffect(() => {
    focusCell(grid.activeCell.row, grid.activeCell.col);
  }, [focusCell, grid.activeCell]);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updated.amount = updated.quantity * updated.rate;
      }
      return updated;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal;
  const netBalance = total - paidAmount;

  const resetForm = () => {
    setSelectedSupplier('');
    setPDate(todayStr());
    setPNotes('');
    setPaidAmount(0);
    setItems([createEmptyItem()]);
  };

  const savePurchase = () => {
    if (!selectedSupplier) {
      showNotification(tx('validation.selectSupplier', 'Select supplier'), 'error');
      return;
    }
    if (items.some(item => !item.fruitName || item.amount <= 0)) {
      showNotification(tx('messages.fillAllItems', 'Fill all items'), 'error');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (!supplier) return;

    const purchaseItems: PurchaseItem[] = items.map(item => ({ ...item }));

    db.createPurchase({
      date: pDate,
      supplierId: selectedSupplier,
      supplierName: supplier.name,
      items: purchaseItems,
      subtotal,
      taxAmount: 0,
      total,
      paidAmount,
      netBalance,
      notes: pNotes,
      status: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    });

    showNotification(tx('messages.purchaseCreated', 'Purchase created!'), 'success');
    setShowForm(false);
    resetForm();
    loadPurchases();
  };

  useShortcutAction('save', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="purchases"]')) return;
    if (!showForm) return;
    savePurchase();
  });

  useShortcutAction('new-entry', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="purchases"]')) return;
    setShowForm(true);
    resetForm();
    requestAnimationFrame(() => grid.setActiveCell(0, 0));
  });

  useShortcutAction('insert-row', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.hasAttribute('data-grid-cell')) return;
    addItem();
    requestAnimationFrame(() => grid.setActiveCell(items.length, 0));
  });

  useShortcutAction('delete-row', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.hasAttribute('data-grid-cell')) return;
    const row = grid.activeCell.row;
    const item = items[row];
    if (!item) return;
    removeItem(item.id);
    requestAnimationFrame(() => grid.setActiveCell(Math.max(row - 1, 0), grid.activeCell.col));
  });

  const printPurchase = (purchase: typeof purchases[0]) => {
    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`<!DOCTYPE html><html><head><title>${tx('purchases.title', 'Purchase')} ${purchase.purchaseNo}</title><style>body{font-family:'Courier New',monospace;padding:20px;max-width:800px;margin:0 auto}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px}table{width:100%;border-collapse:collapse;margin-bottom:15px}th,td{border:1px solid #333;padding:6px 8px;font-size:11px;text-align:left}th{background:#f0f0f0}.totals{text-align:right;font-size:12px}.totals p{margin:2px 0}.totals .grand{font-size:16px;font-weight:bold;border-top:2px solid #333;padding-top:5px}@media print{body{padding:0}}</style></head><body><div class="header"><h1>${tx('purchases.purchaseOrder', 'Purchase Order')}</h1><p>${purchase.purchaseNo}</p></div><div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:12px"><div><strong>${tx('purchases.purchaseNo', 'PO No')}:</strong> ${purchase.purchaseNo}<br><strong>${tx('tableHeaders.date', 'Date')}:</strong> ${formatDate(purchase.date)}</div><div><strong>${tx('purchases.supplier', 'Supplier')}:</strong> ${purchase.supplierName}</div></div><table><thead><tr><th>#</th><th>${tx('tableHeaders.itemName', 'Item')}</th><th>${tx('tableHeaders.grade', 'Grade')}</th><th>${tx('purchases.lot', 'Lot')}</th><th>${tx('tableHeaders.quantity', 'Qty')}</th><th>${tx('purchases.unit', 'Unit')}</th><th>${tx('tableHeaders.rate', 'Rate')}</th><th>${tx('tableHeaders.amount', 'Amount')}</th></tr></thead><tbody>${purchase.items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.fruitName}</td><td>${item.grade}</td><td>${item.lotNo || '-'}</td><td>${item.quantity}</td><td>${item.unit}</td><td>${formatCurrency(item.rate)}</td><td>${formatCurrency(item.amount)}</td></tr>`).join('')}</tbody></table><div class="totals"><p class="grand">${tx('tableHeaders.total', 'Total')}: ${formatCurrency(purchase.total)}</p>${purchase.paidAmount > 0 ? `<p>${tx('purchases.paid', 'Paid')}: ${formatCurrency(purchase.paidAmount)}</p><p class="grand">${tx('common.balance', 'Balance')}: ${formatCurrency(purchase.netBalance)}</p>` : ''}</div><script>window.onload=()=>window.print();</script></body></html>`);

    w.document.close();
  };

  return (
    <div className="space-y-4 animate-fade-in" data-entry-surface="purchases">
      <div className="sticky top-[4.15rem] z-20 rounded-xl border border-slate-200/85 dark:border-[#2a3550]/90 bg-white/94 dark:bg-[#0f1628]/94 backdrop-blur-xl shadow-[0_14px_28px_-22px_rgba(15,23,42,0.65)]">
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Purchase Ledger / Operations Workspace</p>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">{tx('purchases.title', 'Purchases')}</h1>
          </div>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <ShoppingCart className="h-3.5 w-3.5" />
            {showForm ? t('buttons.viewPurchases') : t('buttons.addPurchase')}
          </Button>
        </div>
      </div>

      {showForm ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={tx('purchases.supplier', 'Supplier')}
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  options={[{ value: '', label: tx('placeholders.selectSupplier', 'Select supplier...') }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]}
                />
                <Input label={tx('tableHeaders.date', 'Date')} type="date" value={pDate} onChange={e => setPDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input label={tx('purchases.purchaseNo', 'PO No')} value={db.getNextPurchaseNo()} disabled />
                <Input label={tx('purchases.paid', 'Paid')} type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} prefix="Rs" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{tx('purchases.purchaseItems', 'Purchase Items')}</h3>
                <Button variant="outline" size="sm" onClick={addItem} title="Insert">
                  <Plus className="h-3.5 w-3.5" /> {tx('buttons.addItem', 'Add Item')}
                </Button>
              </div>

              <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-1">
                <span className="col-span-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.itemName', 'Item')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.grade', 'Grade')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('purchases.lot', 'Lot')}</span>
                <span className="col-span-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.quantity', 'Qty')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('purchases.unit', 'Unit')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.rate', 'Rate')}</span>
                <span className="col-span-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.amount', 'Amount')}</span>
                <span className="col-span-1" />
              </div>

              <div className="space-y-2" ref={itemsGridRef}>
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-2 rounded-md border border-slate-100 dark:border-[#22304a] bg-slate-50 dark:bg-[#141d31]">
                    <div className="md:col-span-3"><Input data-grid-cell="true" data-r={idx} data-c={0} value={item.fruitName} onFocus={() => grid.setActiveCell(idx, 0)} onKeyDown={e => grid.onCellKeyDown(e, idx, 0)} onChange={e => updateItem(item.id, 'fruitName', e.target.value)} placeholder={tx('placeholders.enterFruitName', 'Fruit')} className={grid.isActiveCell(idx, 0) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                    <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={1} value={item.grade} onFocus={() => grid.setActiveCell(idx, 1)} onKeyDown={e => grid.onCellKeyDown(e, idx, 1)} onChange={e => updateItem(item.id, 'grade', e.target.value)} className={grid.isActiveCell(idx, 1) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                    <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={2} value={item.lotNo} onFocus={() => grid.setActiveCell(idx, 2)} onKeyDown={e => grid.onCellKeyDown(e, idx, 2)} onChange={e => updateItem(item.id, 'lotNo', e.target.value)} className={grid.isActiveCell(idx, 2) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                    <div className="md:col-span-2"><Input data-grid-cell="true" data-r={idx} data-c={3} type="number" value={item.quantity || ''} onFocus={() => grid.setActiveCell(idx, 3)} onKeyDown={e => grid.onCellKeyDown(e, idx, 3)} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className={grid.isActiveCell(idx, 3) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                    <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={4} value={item.unit} onFocus={() => grid.setActiveCell(idx, 4)} onKeyDown={e => grid.onCellKeyDown(e, idx, 4)} onChange={e => updateItem(item.id, 'unit', e.target.value)} className={grid.isActiveCell(idx, 4) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                    <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={5} type="number" value={item.rate || ''} onFocus={() => grid.setActiveCell(idx, 5)} onKeyDown={e => grid.onCellKeyDown(e, idx, 5)} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className={grid.isActiveCell(idx, 5) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                    <div className="md:col-span-2 py-2 text-[12px] font-semibold tabnum text-slate-800 dark:text-slate-200">{formatCurrency(item.amount)}</div>
                    <div className="md:col-span-1">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <TextArea label={tx('common.notes', 'Notes')} value={pNotes} onChange={e => setPNotes(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-xl p-4 h-fit">
            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-3">{tx('purchases.summary', 'Summary')}</h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-500">{tx('billing.subtotal', 'Subtotal')}</span><span className="tabnum">{formatCurrency(subtotal)}</span></div>
              <div className="border-t border-slate-200 dark:border-[#22304a] pt-2 flex justify-between font-semibold"><span>{tx('tableHeaders.total', 'Total')}</span><span className="tabnum">{formatCurrency(total)}</span></div>
              {paidAmount > 0 && (
                <div className="flex justify-between"><span className="text-slate-500">{tx('purchases.paid', 'Paid')}</span><span className="tabnum">- {formatCurrency(paidAmount)}</span></div>
              )}
              <div className="border-t border-slate-200 dark:border-[#22304a] pt-2 flex justify-between font-semibold text-blue-700 dark:text-blue-300"><span>{tx('common.balance', 'Balance')}</span><span className="tabnum">{formatCurrency(netBalance)}</span></div>
            </div>
            <Button size="sm" className="w-full mt-4" onClick={savePurchase}>{tx('buttons.savePurchase', 'Save Purchase')}</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder={tx('purchases.searchPurchases', 'Search purchases...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#2a3550] rounded-md bg-white dark:bg-[#111827] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <span className="text-[12px] text-slate-500 dark:text-slate-500">{filtered.length} {tx('purchases.title', 'purchases').toLowerCase()}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">{tx('purchases.title', 'Purchases')}</span>
              <span className="text-[14px] font-semibold tabnum text-red-600 dark:text-red-400">{formatCurrency(totalPurchases)}</span>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">{tx('purchases.paid', 'Paid')}</span>
              <span className="text-[14px] font-semibold tabnum text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">{tx('common.balance', 'Balance')}</span>
              <span className="text-[14px] font-semibold tabnum text-amber-600 dark:text-amber-400">{formatCurrency(totalBalance)}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#2a3550] bg-white dark:bg-[#111827]">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#22304a]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('purchases.purchaseNo', 'PO No')}</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.date', 'Date')}</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('purchases.supplier', 'Supplier')}</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('purchases.items', 'Items')}</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.total', 'Total')}</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.status', 'Status')}</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a43]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">{tx('emptyStates.noPurchases', 'No purchases yet')}</td>
                    </tr>
                  ) : (
                    filtered.map(purchase => (
                      <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-[#172036] transition-colors">
                        <td className="px-4 py-2.5 tabnum font-semibold text-slate-800 dark:text-slate-200">{purchase.purchaseNo}</td>
                        <td className="px-4 py-2.5 text-slate-500">{formatDate(purchase.date)}</td>
                        <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{purchase.supplierName}</td>
                        <td className="px-4 py-2.5 text-right tabnum text-slate-500">{purchase.items.length}</td>
                        <td className="px-4 py-2.5 text-right tabnum font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(purchase.total)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant={purchase.status === 'paid' ? 'success' : purchase.status === 'partial' ? 'warning' : 'danger'}>{tx(`statuses.${purchase.status}`, purchase.status)}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => printPurchase(purchase)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1b2335] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
        </>
      )}
    </div>
  );
}
