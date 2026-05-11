import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import { Plus, Search, Printer, ShoppingCart } from 'lucide-react';
import type { PurchaseItem } from '@/db/schema';

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

export function PurchasesPage() {
  const { t } = useTranslation();
  const { suppliers, loadSuppliers, loadPurchases, showNotification, settings } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [pDate, setPDate] = useState(todayStr());
  const [items, setItems] = useState<LineItem[]>([{ id: '1', fruitName: '', grade: 'A', quantity: 0, unit: 'kg', rate: 0, amount: 0, lotNo: '' }]);
  const [pNotes, setPNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => { loadSuppliers(); loadPurchases(); }, []);

  const purchases = db.getPurchases().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = purchases.filter(p =>
    p.purchaseNo.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = () => setItems([...items, { id: Date.now().toString(), fruitName: '', grade: 'A', quantity: 0, unit: 'kg', rate: 0, amount: 0, lotNo: '' }]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') updated.amount = updated.quantity * updated.rate;
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const total = subtotal;
  const netBalance = total - paidAmount;

  const savePurchase = () => {
    if (!selectedSupplier) { showNotification('Select supplier', 'error'); return; }
    if (items.some(i => !i.fruitName || i.amount <= 0)) { showNotification('Fill all items', 'error'); return; }
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (!supplier) return;

    const pi: PurchaseItem[] = items.map(i => ({ ...i, id: i.id }));
    db.createPurchase({
      date: pDate, supplierId: selectedSupplier, supplierName: supplier.name,
      items: pi, subtotal, taxAmount: 0, total, paidAmount, netBalance,
      notes: pNotes, status: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    });
    showNotification('Purchase created!', 'success');
    setShowForm(false); setSelectedSupplier(''); setPDate(todayStr()); setPNotes(''); setPaidAmount(0);
    setItems([{ id: '1', fruitName: '', grade: 'A', quantity: 0, unit: 'kg', rate: 0, amount: 0, lotNo: '' }]);
    loadPurchases();
  };

  const printPurchase = (p: typeof purchases[0]) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Purchase ${p.purchaseNo}</title><style>body{font-family:'Courier New',monospace;padding:20px;max-width:800px;margin:0 auto}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:15px}table{width:100%;border-collapse:collapse;margin-bottom:15px}th,td{border:1px solid #333;padding:6px 8px;font-size:11px;text-align:left}th{background:#f0f0f0}.totals{text-align:right;font-size:12px}.totals p{margin:2px 0}.totals .grand{font-size:16px;font-weight:bold;border-top:2px solid #333;padding-top:5px}@media print{body{padding:0}}</style></head><body><div class="header"><h1>${settings.businessName}</h1><p>Purchase Order</p></div><div style="display:flex;justify-content:space-between;margin-bottom:15px;font-size:12px"><div><strong>PO No:</strong> ${p.purchaseNo}<br><strong>Date:</strong> ${formatDate(p.date)}</div><div><strong>Supplier:</strong> ${p.supplierName}</div></div><table><thead><tr><th>#</th><th>Item</th><th>Grade</th><th>Lot</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${p.items.map((item, i) => `<tr><td>${i+1}</td><td>${item.fruitName}</td><td>${item.grade}</td><td>${item.lotNo}</td><td>${item.quantity}</td><td>${item.unit}</td><td>${formatCurrency(item.rate)}</td><td>${formatCurrency(item.amount)}</td></tr>`).join('')}</tbody></table><div class="totals"><p class="grand">Total: ${formatCurrency(p.total)}</p>${p.paidAmount > 0 ? `<p>Paid: ${formatCurrency(p.paidAmount)}</p><p class="grand">Balance: ${formatCurrency(p.netBalance)}</p>` : ''}</div><script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchases / ખરીદ</h1></div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2"><ShoppingCart className="h-4 w-4" /> {showForm ? t('buttons.viewPurchases') : t('buttons.addPurchase')}</Button>
      </div>

      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card><CardHeader><CardTitle>Purchase Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Supplier *" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
                    options={[{ value: '', label: 'Select...' }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} />
                  <Input label="Date" type="date" value={pDate} onChange={e => setPDate(e.target.value)} />
                </div>
                <Input label="PO No" value={db.getNextPurchaseNo()} disabled />
                <div className="flex items-center justify-between"><h3 className="font-semibold">Items</h3><Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button></div>
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="col-span-3"><Input value={item.fruitName} onChange={e => updateItem(item.id, 'fruitName', e.target.value)} placeholder="Fruit name" /></div>
                    <div className="col-span-2"><Input value={item.grade} onChange={e => updateItem(item.id, 'grade', e.target.value)} placeholder="Grade" /></div>
                    <div className="col-span-1"><Input value={item.lotNo} onChange={e => updateItem(item.id, 'lotNo', e.target.value)} placeholder="Lot" /></div>
                    <div className="col-span-2"><Input type="number" value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-1"><Input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} /></div>
                    <div className="col-span-1"><Input type="number" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-1"><p className="text-sm font-bold text-slate-900 dark:text-white py-2">{formatCurrency(item.amount)}</p></div>
                    <div className="col-span-1"><Button variant="ghost" size="sm" className="p-1.5 h-auto text-red-500" onClick={() => removeItem(item.id)}><ShoppingCart className="hidden" /></Button>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1">✕</button></div>
                  </div>
                ))}
                <TextArea label="Notes" value={pNotes} onChange={e => setPNotes(e.target.value)} />
              </CardContent>
            </Card>
          </div>
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="border-t-2 pt-2 flex justify-between font-bold text-xl text-emerald-600"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            <Input label="Paid Amount" type="number" value={paidAmount} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} prefix="₹" />
            {paidAmount > 0 && <div className="flex justify-between font-bold text-emerald-600"><span>Balance</span><span>{formatCurrency(netBalance)}</span></div>}
            <div className="pt-4 space-y-2">
              <Button onClick={savePurchase} className="w-full">Save Purchase</Button>
            </div>
          </CardContent></Card>
        </div>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search purchases..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-3">
            {filtered.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-bold text-slate-900 dark:text-white">{p.purchaseNo}</h3><p className="text-sm text-slate-500">{p.supplierName} • {formatDate(p.date)}</p></div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(p.total)}</p><Badge variant={p.status === 'paid' ? 'success' : p.status === 'partial' ? 'warning' : 'danger'}>{p.status}</Badge></div>
                      <Button variant="ghost" size="sm" className="p-2 h-auto" onClick={() => printPurchase(p)}><Printer className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex gap-4"><span>{p.items.length} items</span>{p.paidAmount > 0 && <span>Paid: {formatCurrency(p.paidAmount)}</span>}{p.netBalance > 0 && <span>Balance: {formatCurrency(p.netBalance)}</span>}</div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-slate-400"><ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No purchases yet</p></div>}
          </div>
        </>
      )}
    </div>
  );
}
