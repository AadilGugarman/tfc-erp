import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import type { BillItem } from '@/db/schema';
import { Plus, Trash2, Printer, FileText, Search } from 'lucide-react';
import { useShortcutAction } from '@/keyboard/shortcutManager';
import { useSpreadsheetNavigation } from '@/hooks/useSpreadsheetNavigation';

interface BillLineItem {
  id: string;
  fruitName: string;
  grade: string;
  boxCount: number;
  weightPerBox: number;
  totalWeight: number;
  rate: number;
  amount: number;
  lotNo: string;
}

export function BillingPage() {
  const { t } = useTranslation();
  const { parties, bills, loadParties, loadBills, settings, showNotification } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [billSearch, setBillSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [billDate, setBillDate] = useState(todayStr());
  const [items, setItems] = useState<BillLineItem[]>([{ id: '1', fruitName: '', grade: 'A', boxCount: 0, weightPerBox: 0, totalWeight: 0, rate: 0, amount: 0, lotNo: '' }]);
  const [billNotes, setBillNotes] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);
  const itemsGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadParties(); loadBills(); }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { id: Date.now().toString(), fruitName: '', grade: 'A', boxCount: 0, weightPerBox: 0, totalWeight: 0, rate: 0, amount: 0, lotNo: '' }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.length > 1 ? prev.filter((item) => item.id !== id) : prev);
  }, []);

  const grid = useSpreadsheetNavigation({
    rowCount: items.length,
    colCount: 7,
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

  const updateItem = (id: string, field: keyof BillLineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'boxCount' || field === 'weightPerBox') {
        updated.totalWeight = updated.boxCount * updated.weightPerBox;
        updated.amount = updated.totalWeight * updated.rate;
      }
      if (field === 'rate') {
        updated.amount = updated.totalWeight * updated.rate;
      }
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const commission = subtotal * (settings.commissionPercent / 100);
  const taxAmount = subtotal * (settings.taxPercent / 100);
  const total = subtotal - commission + taxAmount;
  const netBalance = total - advancePayment;

  const filteredBills = bills.filter(b =>
    b.billNo.toLowerCase().includes(billSearch.toLowerCase()) ||
    b.partyName.toLowerCase().includes(billSearch.toLowerCase())
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const saveBill = () => {
    if (!selectedParty) { showNotification('Please select a party', 'error'); return; }
    if (items.some(i => !i.fruitName || i.amount <= 0)) { showNotification('Please fill all items', 'error'); return; }

    const party = parties.find(p => p.id === selectedParty);
    if (!party) return;

    const billItems: BillItem[] = items.map(i => ({ ...i, id: i.id }));
    const status: 'paid' | 'partial' | 'unpaid' = advancePayment >= total ? 'paid' : advancePayment > 0 ? 'partial' : 'unpaid';

    const result = db.createBill({
      date: billDate, partyId: selectedParty, partyName: party.name,
      items: billItems, subtotal, commission, taxAmount, taxPercent: settings.taxPercent,
      total, previousBalance: 0, paidAmount: advancePayment, netBalance, notes: billNotes, status,
    });

    showNotification(`Bill ${result.bill.billNo} created!`, 'success');
    setShowForm(false);
    setSelectedParty(''); setBillDate(todayStr()); setBillNotes(''); setAdvancePayment(0);
    setItems([{ id: '1', fruitName: '', grade: 'A', boxCount: 0, weightPerBox: 0, totalWeight: 0, rate: 0, amount: 0, lotNo: '' }]);
    loadBills();
  };

  useShortcutAction('save', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="billing"]')) return;
    if (!showForm) return;
    saveBill();
  });

  useShortcutAction('new-entry', () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="billing"]')) return;
    setShowForm(true);
    addItem();
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

  const printBill = (bill: typeof bills[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Bill ${bill.billNo}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 2px 0; font-size: 12px; }
        .bill-info { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #333; padding: 6px 8px; font-size: 11px; text-align: left; }
        th { background: #f0f0f0; }
        .totals { text-align: right; font-size: 12px; }
        .totals p { margin: 2px 0; }
        .totals .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="header">
        <h1>${settings.businessName}</h1>
        <p>${settings.businessAddress}, ${settings.city}, ${settings.state}</p>
        <p>Phone: ${settings.phone} | GSTIN: ${settings.gstin}</p>
      </div>
      <div class="bill-info">
        <div><strong>Bill No:</strong> ${bill.billNo}<br><strong>Date:</strong> ${formatDate(bill.date)}</div>
        <div><strong>Party:</strong> ${bill.partyName}<br><strong>Status:</strong> ${bill.status.toUpperCase()}</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Item</th><th>Grade</th><th>Lot</th><th>Boxes</th><th>Wt/Box</th><th>Total Wt</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          ${bill.items.map((item) => `<tr>
            <td>${bill.items.indexOf(item) + 1}</td><td>${item.fruitName}</td><td>${item.grade}</td><td>${item.lotNo}</td>
            <td>${item.boxCount}</td><td>${item.weightPerBox}</td><td>${item.totalWeight.toFixed(2)}</td>
            <td>${formatCurrency(item.rate)}</td><td>${formatCurrency(item.amount)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="totals">
        <p>Subtotal: ${formatCurrency(bill.subtotal)}</p>
        <p>Commission (${settings.commissionPercent}%): -${formatCurrency(bill.commission)}</p>
        <p>Tax (${bill.taxPercent}%): +${formatCurrency(bill.taxAmount)}</p>
        <p class="grand">Total: ${formatCurrency(bill.total)}</p>
        ${bill.paidAmount > 0 ? `<p>Advance Paid: -${formatCurrency(bill.paidAmount)}</p><p class="grand">Net Balance: ${formatCurrency(bill.netBalance)}</p>` : ''}
      </div>
      ${bill.notes ? `<p style="margin-top:15px;font-size:11px;"><strong>Notes:</strong> ${bill.notes}</p>` : ''}
      <div class="footer">
        <p>Thank you for your business! / વ્યવસાર બદલ આભાર!</p>
        <p>This is a computer generated bill.</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4" data-entry-surface="billing">
      <div className="sticky top-[4.15rem] z-20 rounded-xl border border-slate-200/85 dark:border-[#2a3550]/90 bg-white/94 dark:bg-[#0f1628]/94 backdrop-blur-xl shadow-[0_14px_28px_-22px_rgba(15,23,42,0.65)]">
        <div className="flex items-center justify-between p-3.5 sm:p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Sales Ledger / Operations Workspace</p>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Billing / બિલિંગ</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2" size="sm">
            <FileText className="h-4 w-4" /> {showForm ? 'View Bills' : 'New Bill'}
          </Button>
        </div>
      </div>

      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bill Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>{t('billing.title')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select label={`${t('billing.party')} *`} value={selectedParty} onChange={e => setSelectedParty(e.target.value)}
                    options={[{ value: '', label: t('placeholders.selectPartyPlaceholder') }, ...parties.map(p => ({ value: p.id, label: p.name }))]} />
                  <Input label={t('billing.billDate')} type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label={t('billing.billNumber')} value={db.getNextBillNo()} disabled />
                  <Input label="Advance Payment" type="number" value={advancePayment} onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)} prefix="₹" />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Bill Items / બિલ આઇટમ્સ</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1" title="Insert"><Plus className="h-3.5 w-3.5" /> Add Item</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" ref={itemsGridRef}>
                  <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase">
                    <div className="col-span-2">Fruit</div>
                    <div className="col-span-1">Grade</div>
                    <div className="col-span-1">Lot</div>
                    <div className="col-span-1">Boxes</div>
                    <div className="col-span-1">Wt/Box</div>
                    <div className="col-span-1">Total Wt</div>
                    <div className="col-span-1">Rate</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 bg-slate-50 dark:bg-[#141d31] rounded-lg">
                      <div className="md:col-span-2"><Input data-grid-cell="true" data-r={idx} data-c={0} value={item.fruitName} onFocus={() => grid.setActiveCell(idx, 0)} onKeyDown={e => grid.onCellKeyDown(e, idx, 0)} onChange={e => updateItem(item.id, 'fruitName', e.target.value)} placeholder="ફળ" className={grid.isActiveCell(idx, 0) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={1} value={item.grade} onFocus={() => grid.setActiveCell(idx, 1)} onKeyDown={e => grid.onCellKeyDown(e, idx, 1)} onChange={e => updateItem(item.id, 'grade', e.target.value)} placeholder="Grade" className={grid.isActiveCell(idx, 1) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={2} value={item.lotNo} onFocus={() => grid.setActiveCell(idx, 2)} onKeyDown={e => grid.onCellKeyDown(e, idx, 2)} onChange={e => updateItem(item.id, 'lotNo', e.target.value)} placeholder="Lot" className={grid.isActiveCell(idx, 2) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={3} type="number" value={item.boxCount || ''} onFocus={() => grid.setActiveCell(idx, 3)} onKeyDown={e => grid.onCellKeyDown(e, idx, 3)} onChange={e => updateItem(item.id, 'boxCount', parseFloat(e.target.value) || 0)} className={grid.isActiveCell(idx, 3) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={4} type="number" value={item.weightPerBox || ''} onFocus={() => grid.setActiveCell(idx, 4)} onKeyDown={e => grid.onCellKeyDown(e, idx, 4)} onChange={e => updateItem(item.id, 'weightPerBox', parseFloat(e.target.value) || 0)} className={grid.isActiveCell(idx, 4) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={5} type="number" value={item.totalWeight || ''} onFocus={() => grid.setActiveCell(idx, 5)} onKeyDown={e => grid.onCellKeyDown(e, idx, 5)} onChange={e => updateItem(item.id, 'totalWeight', parseFloat(e.target.value) || 0)} readOnly className={grid.isActiveCell(idx, 5) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-1"><Input data-grid-cell="true" data-r={idx} data-c={6} type="number" value={item.rate || ''} onFocus={() => grid.setActiveCell(idx, 6)} onKeyDown={e => grid.onCellKeyDown(e, idx, 6)} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className={grid.isActiveCell(idx, 6) ? 'ring-2 ring-blue-500/35' : ''} /></div>
                      <div className="md:col-span-2"><p className="text-lg font-bold text-slate-900 dark:text-white py-2">{formatCurrency(item.amount)}</p></div>
                      <div className="md:col-span-1"><Button variant="ghost" size="sm" className="p-1.5 h-auto text-red-500" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button></div>
                    </div>
                  ))}
                </div>
                <TextArea label="Notes" value={billNotes} onChange={e => setBillNotes(e.target.value)} className="mt-4" />
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Bill Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-emerald-600"><span>Commission ({settings.commissionPercent}%)</span><span>- {formatCurrency(commission)}</span></div>
                  <div className="flex justify-between"><span>Tax ({settings.taxPercent}%)</span><span>+ {formatCurrency(taxAmount)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
                  {advancePayment > 0 && (
                    <div className="flex justify-between text-emerald-600"><span>Advance</span><span>- {formatCurrency(advancePayment)}</span></div>
                  )}
                  <div className="border-t-2 pt-2 flex justify-between font-bold text-xl text-emerald-600"><span>Net Balance</span><span>{formatCurrency(netBalance)}</span></div>
                </div>
                <div className="pt-4 space-y-2">
                  <Button onClick={saveBill} className="w-full">Save Bill / સાચવો</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search bills..." value={billSearch} onChange={e => setBillSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-[#2a3550] rounded-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500" />
            </div>
            <span className="text-sm text-slate-500">{filteredBills.length} bills</span>
          </div>

          <div className="space-y-3">
            {filteredBills.map(bill => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{bill.billNo}</h3>
                        <p className="text-sm text-slate-500">{bill.partyName} • {formatDate(bill.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(bill.total)}</p>
                        <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'}>{bill.status}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="p-2 h-auto" onClick={() => printBill(bill)}><Printer className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex gap-4">
                    <span>{bill.items.length} items</span>
                    <span>Comm: {formatCurrency(bill.commission)}</span>
                    <span>Tax: {formatCurrency(bill.taxAmount)}</span>
                    {bill.paidAmount > 0 && <span>Paid: {formatCurrency(bill.paidAmount)}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredBills.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No bills found</p>
                <Button className="mt-3" onClick={() => setShowForm(true)}>Create First Bill</Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
