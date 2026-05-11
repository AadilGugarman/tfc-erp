import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import { Search, Plus, Edit2, ArrowUpCircle, ArrowDownCircle, Package, History } from 'lucide-react';


export function InventoryPage() {
  const { t } = useTranslation();
  const { inventoryItems, loadInventory, showNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showInward, setShowInward] = useState(false);
  const [showTxn, setShowTxn] = useState(false);
  const [editItem, setEditItem] = useState<string | null>(null);
  const [txnItemId, setTxnItemId] = useState('');

  // Form state
  const [fName, setFName] = useState('');
  const [fGrade, setFGrade] = useState('A');
  const [fCategory, setFCategory] = useState('Fruits');
  const [fStock, setFStock] = useState(0);
  const [fUnit, setFUnit] = useState('kg');
  const [fThreshold, setFThreshold] = useState(50);
  const [fWarehouse, setFWarehouse] = useState('Main');

  // Inward state
  const [inwardItem, setInwardItem] = useState('');
  const [inwardQty, setInwardQty] = useState(0);
  const [inwardRate, setInwardRate] = useState(0);
  const [inwardNotes, setInwardNotes] = useState('');

  useEffect(() => { loadInventory(); }, []);

  const filtered = inventoryItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.grade.toLowerCase().includes(search.toLowerCase()) ||
    i.warehouse.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    in_stock: inventoryItems.filter(i => i.status === 'in_stock').length,
    low_stock: inventoryItems.filter(i => i.status === 'low_stock').length,
    out_of_stock: inventoryItems.filter(i => i.status === 'out_of_stock').length,
  };

  const openNew = () => {
    setEditItem(null);
    setFName(''); setFGrade('A'); setFCategory('Fruits'); setFStock(0);
    setFUnit('kg'); setFThreshold(50); setFWarehouse('Main');
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const item = inventoryItems.find(i => i.id === id);
    if (!item) return;
    setEditItem(id);
    setFName(item.name); setFGrade(item.grade); setFCategory(item.category);
    setFStock(item.currentStock); setFUnit(item.unit);
    setFThreshold(item.lowStockThreshold); setFWarehouse(item.warehouse);
    setShowForm(true);
  };

  const saveItem = () => {
    if (!fName.trim()) return;
    if (editItem) {
      db.updateInventoryItem(editItem, { name: fName, grade: fGrade, category: fCategory, currentStock: fStock, unit: fUnit, lowStockThreshold: fThreshold, warehouse: fWarehouse });
      showNotification('Item updated', 'success');
    } else {
      db.createInventoryItem({ name: fName, grade: fGrade, category: fCategory, currentStock: fStock, unit: fUnit, lowStockThreshold: fThreshold, warehouse: fWarehouse });
      showNotification('Item created', 'success');
    }
    setShowForm(false); loadInventory();
  };

  const doInward = () => {
    if (!inwardItem || inwardQty <= 0) return;
    db.addInventoryTransaction({
      itemId: inwardItem,
      itemName: inventoryItems.find(i => i.id === inwardItem)?.name || '',
      type: 'inward',
      quantity: inwardQty,
      rate: inwardRate,
      referenceType: 'manual',
      referenceId: '',
      date: todayStr(),
      notes: inwardNotes,
    });
    setShowInward(false); setInwardItem(''); setInwardQty(0); setInwardRate(0); setInwardNotes('');
    showNotification('Stock added', 'success'); loadInventory();
  };

  const openOutward = (itemId: string) => {
    const qty = parseFloat(prompt('Enter quantity to remove:') || '0');
    if (qty > 0) {
      const item = inventoryItems.find(i => i.id === itemId);
      if (item) {
        db.addInventoryTransaction({
          itemId, itemName: item.name, type: 'outward', quantity: qty,
          rate: 0, referenceType: 'manual', referenceId: '', date: todayStr(), notes: 'Manual outward',
        });
        showNotification(`${qty} ${item.unit} removed`, 'info'); loadInventory();
      }
    }
  };

  const txnData = txnItemId ? db.getInventoryTransactions(txnItemId) : db.getInventoryTransactions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory / ઈન્વેન્ટરી</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInward(true)} className="gap-1"><ArrowUpCircle className="h-4 w-4" /> {t('buttons.stockInward')}</Button>
          <Button variant="outline" size="sm" onClick={() => setShowTxn(true)} className="gap-1"><History className="h-4 w-4" /> {t('buttons.transactions')}</Button>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> {t('buttons.addItem')}</Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Package className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold text-slate-900 dark:text-white">{statusCounts.in_stock}</p><p className="text-xs text-slate-500">In Stock</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><Package className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-slate-900 dark:text-white">{statusCounts.low_stock}</p><p className="text-xs text-slate-500">Low Stock</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><Package className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-slate-900 dark:text-white">{statusCounts.out_of_stock}</p><p className="text-xs text-slate-500">Out of Stock</p></div></CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder={t('placeholders.searchBill')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Grade</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Last Updated</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.grade}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">{item.currentStock.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-3 text-slate-500">{item.warehouse}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.status === 'in_stock' ? 'success' : item.status === 'low_stock' ? 'warning' : 'danger'}>
                      {item.status === 'in_stock' ? 'In Stock' : item.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDate(item.lastUpdated)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="p-1.5 h-auto" onClick={() => openEdit(item.id)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="p-1.5 h-auto text-emerald-600" onClick={() => { setInwardItem(item.id); setShowInward(true); }}><ArrowUpCircle className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="p-1.5 h-auto text-red-500" onClick={() => openOutward(item.id)}><ArrowDownCircle className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="p-1.5 h-auto" onClick={() => { setTxnItemId(item.id); setShowTxn(true); }}><History className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-slate-400">No inventory items found</div>}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Inventory Item' : 'Add Inventory Item'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Item Name *" value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g., કેળા" />
          <Input label="Grade" value={fGrade} onChange={e => setFGrade(e.target.value)} />
          <Select label="Category" value={fCategory} onChange={e => setFCategory(e.target.value)} options={[{ value: 'Fruits', label: 'Fruits' }, { value: 'Vegetables', label: 'Vegetables' }, { value: 'Dry Fruits', label: 'Dry Fruits' }, { value: 'Other', label: 'Other' }]} />
          <Input label="Current Stock" type="number" value={fStock} onChange={e => setFStock(parseFloat(e.target.value) || 0)} />
          <Select label="Unit" value={fUnit} onChange={e => setFUnit(e.target.value)} options={[{ value: 'kg', label: 'Kg' }, { value: 'pcs', label: 'Pieces' }, { value: 'box', label: 'Box' }, { value: 'dozen', label: 'Dozen' }]} />
          <Input label="Low Stock Threshold" type="number" value={fThreshold} onChange={e => setFThreshold(parseFloat(e.target.value) || 0)} />
          <Input label="Warehouse" value={fWarehouse} onChange={e => setFWarehouse(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={saveItem}>{editItem ? 'Update' : 'Create'}</Button></div>
      </Modal>

      {/* Stock Inward Modal */}
      <Modal open={showInward} onClose={() => setShowInward(false)} title="Stock Inward / સ્ટોક ઇનવર્ડ" size="md">
        <div className="space-y-4">
          <Select label="Item *" value={inwardItem} onChange={e => setInwardItem(e.target.value)}
            options={[{ value: '', label: 'Select Item...' }, ...inventoryItems.map(i => ({ value: i.id, label: `${i.name} (${i.grade}) - ${i.currentStock} ${i.unit}` }))]} />
          <Input label="Quantity *" type="number" value={inwardQty} onChange={e => setInwardQty(parseFloat(e.target.value) || 0)} />
          <Input label="Rate (per unit)" type="number" value={inwardRate} onChange={e => setInwardRate(parseFloat(e.target.value) || 0)} prefix="₹" />
          <TextArea label="Notes" value={inwardNotes} onChange={e => setInwardNotes(e.target.value)} placeholder="e.g., From which supplier" />
        </div>
        <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowInward(false)}>Cancel</Button><Button onClick={doInward}>Add Stock</Button></div>
      </Modal>

      {/* Transactions Modal */}
      <Modal open={showTxn} onClose={() => { setShowTxn(false); setTxnItemId(''); }} title="Stock Transactions / ટ્રાન્ઝેક્શન" size="lg">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {txnData.length === 0 ? <p className="text-center py-8 text-slate-400">No transactions</p> : txnData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(txn => (
            <div key={txn.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${txn.type === 'inward' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {txn.type === 'inward' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{txn.itemName}</p>
                  <p className="text-xs text-slate-400">{formatDate(txn.date)} • {txn.referenceType} • {txn.notes}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-semibold ${txn.type === 'inward' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {txn.type === 'inward' ? '+' : '-'}{txn.quantity}
                </p>
                <p className="text-xs text-slate-400">@ {formatCurrency(txn.rate)}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
