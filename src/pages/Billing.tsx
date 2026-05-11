import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import type { BillItem } from '@/db/schema';
import { Plus, Trash2, Printer, FileText, Search } from 'lucide-react';

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

function createEmptyItem(id = '1'): BillLineItem {
  return {
    id,
    fruitName: '',
    grade: 'A',
    boxCount: 0,
    weightPerBox: 0,
    totalWeight: 0,
    rate: 0,
    amount: 0,
    lotNo: '',
  };
}

export function BillingPage() {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) => t(key, { defaultValue: fallback });
  const { parties, loadParties, loadBills, settings, showNotification } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [billSearch, setBillSearch] = useState('');

  const [selectedParty, setSelectedParty] = useState('');
  const [billDate, setBillDate] = useState(todayStr());
  const [items, setItems] = useState<BillLineItem[]>([createEmptyItem()]);
  const [billNotes, setBillNotes] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);

  const bills = db.getBills();

  useEffect(() => {
    loadParties();
    loadBills();
  }, []);

  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem(Date.now().toString())]);
  };

  const removeItem = (id: string) => {
    setItems(prev => (prev.length > 1 ? prev.filter(item => item.id !== id) : prev));
  };

  const updateItem = (id: string, field: keyof BillLineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'boxCount' || field === 'weightPerBox') {
        updated.totalWeight = updated.boxCount * updated.weightPerBox;
      }
      if (field === 'boxCount' || field === 'weightPerBox' || field === 'rate') {
        updated.amount = updated.totalWeight * updated.rate;
      }
      return updated;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const commission = subtotal * (settings.commissionPercent / 100);
  const taxAmount = subtotal * (settings.taxPercent / 100);
  const total = subtotal - commission + taxAmount;
  const netBalance = total - advancePayment;

  const filteredBills = useMemo(() => {
    const q = billSearch.toLowerCase();
    return bills
      .filter(bill =>
        bill.billNo.toLowerCase().includes(q) ||
        bill.partyName.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bills, billSearch]);

  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalReceived = filteredBills.reduce((sum, bill) => sum + bill.paidAmount, 0);
  const totalBalance = filteredBills.reduce((sum, bill) => sum + bill.netBalance, 0);

  const resetForm = () => {
    setSelectedParty('');
    setBillDate(todayStr());
    setBillNotes('');
    setAdvancePayment(0);
    setItems([createEmptyItem()]);
  };

  const saveBill = () => {
    if (!selectedParty) {
      showNotification(tx('validation.selectParty', 'Please select a party'), 'error');
      return;
    }
    if (items.some(item => !item.fruitName || item.amount <= 0)) {
      showNotification(tx('messages.fillAllItems', 'Please fill all items'), 'error');
      return;
    }

    const party = parties.find(p => p.id === selectedParty);
    if (!party) return;

    const billItems: BillItem[] = items.map(item => ({ ...item }));
    const status: 'paid' | 'partial' | 'unpaid' =
      advancePayment >= total ? 'paid' : advancePayment > 0 ? 'partial' : 'unpaid';

    const result = db.createBill({
      date: billDate,
      partyId: selectedParty,
      partyName: party.name,
      items: billItems,
      subtotal,
      commission,
      taxAmount,
      taxPercent: settings.taxPercent,
      total,
      previousBalance: 0,
      paidAmount: advancePayment,
      netBalance,
      notes: billNotes,
      status,
    });

    showNotification(`${tx('messages.billCreated', 'Bill created!')} ${result.bill.billNo}`, 'success');
    setShowForm(false);
    resetForm();
    loadBills();
  };

  const printBill = (bill: typeof bills[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>${tx('billing.title', 'Billing')} ${bill.billNo}</title>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        :root {
          --ink: #0f172a;
          --muted: #475569;
          --line: #cbd5e1;
          --soft: #f8fafc;
          --brand: #0f766e;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #e2e8f0;
          color: var(--ink);
          font-family: 'Segoe UI', 'Inter', sans-serif;
          padding: 24px;
        }
        .sheet {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding: 22px 24px;
          background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
          border-bottom: 1px solid var(--line);
        }
        .brand h1 { margin: 0; font-size: 24px; letter-spacing: 0.2px; }
        .brand p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
        .doc { text-align: right; }
        .doc .label {
          display: inline-block;
          border: 1px solid #99f6e4;
          background: #ccfbf1;
          color: #115e59;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .doc h2 { margin: 10px 0 0; font-size: 20px; }
        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 18px 24px;
        }
        .meta .card {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 12px;
          background: var(--soft);
        }
        .meta .ttl {
          margin: 0 0 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .meta p { margin: 4px 0; font-size: 13px; }
        table {
          width: calc(100% - 48px);
          margin: 0 24px 20px;
          border-collapse: collapse;
        }
        thead th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          background: #f1f5f9;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          padding: 9px 8px;
          text-align: left;
        }
        tbody td {
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 8px;
          font-size: 13px;
        }
        tbody tr:nth-child(even) td { background: #fcfdff; }
        .num { text-align: right; white-space: nowrap; }
        .summary {
          display: flex;
          justify-content: flex-end;
          padding: 0 24px 24px;
        }
        .summary-box {
          width: min(380px, 100%);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 12px;
          background: var(--soft);
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
          font-size: 13px;
        }
        .summary-row.total {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed var(--line);
          font-size: 18px;
          font-weight: 700;
          color: #0f766e;
        }
        .footer {
          text-align: center;
          margin: 0 24px 20px;
          color: var(--muted);
          font-size: 12px;
          border-top: 1px solid var(--line);
          padding-top: 10px;
        }
        @media print {
          body { background: #fff; padding: 0; }
          .sheet { border: 0; border-radius: 0; max-width: none; }
        }
      </style></head><body>
      <section class="sheet">
        <header class="head">
          <div class="brand">
            <h1>${settings.businessName}</h1>
            <p>${settings.businessAddress}, ${settings.city}, ${settings.state}</p>
            <p>Phone: ${settings.phone} | GSTIN: ${settings.gstin || '-'}</p>
          </div>
          <div class="doc">
            <span class="label">${tx('billing.saleInvoice', 'Sale Invoice')}</span>
            <h2>${bill.billNo}</h2>
          </div>
        </header>

        <section class="meta">
          <div class="card">
            <p class="ttl">${tx('billing.billDetails', 'Bill Details')}</p>
            <p><strong>${tx('billing.billNo', 'Bill No')}:</strong> ${bill.billNo}</p>
            <p><strong>${tx('tableHeaders.date', 'Date')}:</strong> ${formatDate(bill.date)}</p>
            <p><strong>${tx('billing.status', 'Status')}:</strong> ${tx(`statuses.${bill.status}`, bill.status)}</p>
          </div>
          <div class="card">
            <p class="ttl">${tx('billing.customer', 'Customer')}</p>
            <p><strong>${tx('billing.name', 'Name')}:</strong> ${bill.partyName}</p>
            <p><strong>${tx('billing.items', 'Items')}:</strong> ${bill.items.length}</p>
            <p><strong>${tx('billing.tax', 'Tax')}:</strong> ${bill.taxPercent}%</p>
          </div>
        </section>

        <table>
          <thead><tr><th>#</th><th>${tx('tableHeaders.itemName', 'Item')}</th><th>${tx('tableHeaders.grade', 'Grade')}</th><th>${tx('billing.lot', 'Lot')}</th><th>${tx('billing.boxes', 'Boxes')}</th><th>${tx('billing.weightPerBox', 'Wt/Box')}</th><th>${tx('billing.totalWeight', 'Total Wt')}</th><th class="num">${tx('tableHeaders.rate', 'Rate')}</th><th class="num">${tx('tableHeaders.amount', 'Amount')}</th></tr></thead>
          <tbody>
            ${bill.items.map((item, index) => `<tr>
              <td>${index + 1}</td><td>${item.fruitName}</td><td>${item.grade}</td><td>${item.lotNo || '-'}</td>
              <td>${item.boxCount}</td><td>${item.weightPerBox}</td><td>${item.totalWeight.toFixed(2)} kg</td>
              <td class="num">${formatCurrency(item.rate)}</td><td class="num">${formatCurrency(item.amount)}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <section class="summary">
          <div class="summary-box">
            <div class="summary-row"><span>${tx('billing.subtotal', 'Subtotal')}</span><strong>${formatCurrency(bill.subtotal)}</strong></div>
            <div class="summary-row"><span>${tx('billing.commission', 'Commission')} (${settings.commissionPercent}%)</span><strong>- ${formatCurrency(bill.commission)}</strong></div>
            <div class="summary-row"><span>${tx('billing.tax', 'Tax')} (${bill.taxPercent}%)</span><strong>+ ${formatCurrency(bill.taxAmount)}</strong></div>
            ${bill.paidAmount > 0 ? `<div class="summary-row"><span>${tx('billing.advance', 'Advance Paid')}</span><strong>- ${formatCurrency(bill.paidAmount)}</strong></div>` : ''}
            ${bill.paidAmount > 0 ? `<div class="summary-row"><span>${tx('billing.netBalance', 'Net Balance')}</span><strong>${formatCurrency(bill.netBalance)}</strong></div>` : ''}
            <div class="summary-row total"><span>${tx('billing.total', 'Total')}</span><span>${formatCurrency(bill.total)}</span></div>
          </div>
        </section>

        ${bill.notes ? `<p style="margin-top:15px;font-size:11px;"><strong>${tx('common.notes', 'Notes')}:</strong> ${bill.notes}</p>` : ''}
        <div class="footer">
          <p>${tx('billing.thankYou', 'Thank you for your business!')}</p>
          <p>${tx('billing.generatedBill', 'This is a computer generated bill.')}</p>
        </div>
      </section>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white">{tx('billing.title', 'Billing')}</h1>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <FileText className="h-3.5 w-3.5" />
          {showForm ? tx('buttons.viewBills', 'View Bills') : tx('buttons.addBill', 'New Bill')}
        </Button>
      </div>

      {showForm ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={tx('billing.party', 'Party')}
                  value={selectedParty}
                  onChange={e => setSelectedParty(e.target.value)}
                  options={[{ value: '', label: tx('placeholders.selectParty', 'Select party...') }, ...parties.map(p => ({ value: p.id, label: p.name }))]}
                />
                <Input label={tx('billing.billDate', 'Bill Date')} type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input label={tx('billing.billNo', 'Bill No')} value={db.getNextBillNo()} disabled />
                <Input
                  label={tx('billing.advance', 'Advance')}
                  type="number"
                  value={advancePayment}
                  onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  prefix="Rs"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{tx('billing.billItems', 'Bill Items')}</h3>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" /> {tx('buttons.addItem', 'Add Item')}
                </Button>
              </div>

              <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-1">
                <span className="col-span-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.itemName', 'Item')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.grade', 'Grade')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('billing.lot', 'Lot')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('billing.boxes', 'Boxes')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('billing.weightPerBox', 'Wt/Box')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('billing.totalWeight', 'Wt')}</span>
                <span className="col-span-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.rate', 'Rate')}</span>
                <span className="col-span-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-600">{tx('tableHeaders.amount', 'Amount')}</span>
                <span className="col-span-1" />
              </div>

              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-2 rounded-md border border-slate-100 dark:border-[#1a1f2e] bg-slate-50 dark:bg-[#0e1017]">
                    <div className="md:col-span-3"><Input value={item.fruitName} onChange={e => updateItem(item.id, 'fruitName', e.target.value)} placeholder={tx('placeholders.enterFruitName', 'Fruit')} /></div>
                    <div className="md:col-span-1"><Input value={item.grade} onChange={e => updateItem(item.id, 'grade', e.target.value)} /></div>
                    <div className="md:col-span-1"><Input value={item.lotNo} onChange={e => updateItem(item.id, 'lotNo', e.target.value)} /></div>
                    <div className="md:col-span-1"><Input type="number" value={item.boxCount || ''} onChange={e => updateItem(item.id, 'boxCount', parseFloat(e.target.value) || 0)} /></div>
                    <div className="md:col-span-1"><Input type="number" value={item.weightPerBox || ''} onChange={e => updateItem(item.id, 'weightPerBox', parseFloat(e.target.value) || 0)} /></div>
                    <div className="md:col-span-1"><Input type="number" value={item.totalWeight || ''} readOnly /></div>
                    <div className="md:col-span-1"><Input type="number" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} /></div>
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
                <TextArea label={tx('common.notes', 'Notes')} value={billNotes} onChange={e => setBillNotes(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg p-4 h-fit">
            <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-3">{tx('billing.summary', 'Summary')}</h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-slate-500">{tx('billing.subtotal', 'Subtotal')}</span><span className="tabnum">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>{tx('billing.commission', 'Commission')} ({settings.commissionPercent}%)</span><span className="tabnum">- {formatCurrency(commission)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{tx('billing.tax', 'Tax')} ({settings.taxPercent}%)</span><span className="tabnum">+ {formatCurrency(taxAmount)}</span></div>
              <div className="border-t border-slate-200 dark:border-[#1e2330] pt-2 flex justify-between font-semibold"><span>{tx('billing.total', 'Total')}</span><span className="tabnum">{formatCurrency(total)}</span></div>
              {advancePayment > 0 && (
                <div className="flex justify-between"><span className="text-slate-500">{tx('billing.advance', 'Advance')}</span><span className="tabnum">- {formatCurrency(advancePayment)}</span></div>
              )}
              <div className="border-t border-slate-200 dark:border-[#1e2330] pt-2 flex justify-between font-semibold text-[#3b5bdb] dark:text-[#8ba4f9]"><span>{tx('billing.netBalance', 'Net Balance')}</span><span className="tabnum">{formatCurrency(netBalance)}</span></div>
            </div>
            <Button size="sm" className="w-full mt-4" onClick={saveBill}>{tx('buttons.saveBill', 'Save Bill')}</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder={tx('placeholders.searchBill', 'Search bills...')}
                value={billSearch}
                onChange={e => setBillSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#1e2330] rounded-md bg-white dark:bg-[#111318] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb]"
              />
            </div>
            <span className="text-[12px] text-slate-500 dark:text-slate-500">{filteredBills.length} {tx('common.bills', 'bills')}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">{tx('dashboard.totalSales', 'Sales')}</span>
              <span className="text-[14px] font-semibold tabnum text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSales)}</span>
            </div>
            <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">{tx('payments.received', 'Received')}</span>
              <span className="text-[14px] font-semibold tabnum text-[#3b5bdb] dark:text-[#8ba4f9]">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.06em]">{tx('common.balance', 'Balance')}</span>
              <span className="text-[14px] font-semibold tabnum text-amber-600 dark:text-amber-400">{formatCurrency(totalBalance)}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-[#1e2330] bg-white dark:bg-[#111318]">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0e1017] border-b border-slate-200 dark:border-[#1e2330]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('billing.billNo', 'Bill No')}</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.date', 'Date')}</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('billing.party', 'Party')}</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('billing.items', 'Items')}</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.total', 'Total')}</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.status', 'Status')}</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em]">{tx('tableHeaders.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1a1f2e]">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">{tx('emptyStates.noBills', 'No bills found')}</td>
                    </tr>
                  ) : (
                    filteredBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-[#0e1017] transition-colors">
                        <td className="px-4 py-2.5 tabnum font-semibold text-slate-800 dark:text-slate-200">{bill.billNo}</td>
                        <td className="px-4 py-2.5 text-slate-500">{formatDate(bill.date)}</td>
                        <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{bill.partyName}</td>
                        <td className="px-4 py-2.5 text-right tabnum text-slate-500">{bill.items.length}</td>
                        <td className="px-4 py-2.5 text-right tabnum font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(bill.total)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'}>{tx(`statuses.${bill.status}`, bill.status)}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => printBill(bill)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1a1f2e] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
