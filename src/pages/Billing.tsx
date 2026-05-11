import { useEffect, useState } from 'react';
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
  const { parties, loadParties, loadBills, settings, showNotification } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [billSearch, setBillSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [billDate, setBillDate] = useState(todayStr());
  const [items, setItems] = useState<BillLineItem[]>([{ id: '1', fruitName: '', grade: 'A', boxCount: 0, weightPerBox: 0, totalWeight: 0, rate: 0, amount: 0, lotNo: '' }]);
  const [billNotes, setBillNotes] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);
  const bills = db.getBills();

  useEffect(() => { loadParties(); loadBills(); }, []);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), fruitName: '', grade: 'A', boxCount: 0, weightPerBox: 0, totalWeight: 0, rate: 0, amount: 0, lotNo: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing / બિલિંગ</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <FileText className="h-4 w-4" /> {showForm ? 'View Bills' : 'New Bill'}
        </Button>
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
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Item</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="md:col-span-2"><Input value={item.fruitName} onChange={e => updateItem(item.id, 'fruitName', e.target.value)} placeholder="ફળ" /></div>
                      <div className="md:col-span-1"><Input value={item.grade} onChange={e => updateItem(item.id, 'grade', e.target.value)} placeholder="Grade" /></div>
                      <div className="md:col-span-1"><Input value={item.lotNo} onChange={e => updateItem(item.id, 'lotNo', e.target.value)} placeholder="Lot" /></div>
                      <div className="md:col-span-1"><Input type="number" value={item.boxCount || ''} onChange={e => updateItem(item.id, 'boxCount', parseFloat(e.target.value) || 0)} /></div>
                      <div className="md:col-span-1"><Input type="number" value={item.weightPerBox || ''} onChange={e => updateItem(item.id, 'weightPerBox', parseFloat(e.target.value) || 0)} /></div>
                      <div className="md:col-span-1"><Input type="number" value={item.totalWeight || ''} onChange={e => updateItem(item.id, 'totalWeight', parseFloat(e.target.value) || 0)} readOnly /></div>
                      <div className="md:col-span-1"><Input type="number" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} /></div>
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
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
