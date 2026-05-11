import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import * as db from '@/db/db';
import { Search, Plus, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import type { Supplier, LedgerType } from '@/db/schema';

export function SuppliersPage() {
  const { t } = useTranslation();
  const { suppliers, loadSuppliers, showNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fCity, setFCity] = useState('');
  const [fState, setFState] = useState('');
  const [fOpenBal, setFOpenBal] = useState(0);
  const [fBalType, setFBalType] = useState<LedgerType>('credit');
  const [fComm, setFComm] = useState(3);
  const [fNotes, setFNotes] = useState('');

  useEffect(() => { loadSuppliers(); }, []);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  );

  const resetForm = () => {
    setFName(''); setFPhone(''); setFEmail(''); setFAddress('');
    setFCity(''); setFState(''); setFOpenBal(0);
    setFBalType('credit'); setFComm(3); setFNotes('');
  };

  const openNew = () => { setEditSupplier(null); resetForm(); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditSupplier(s); setFName(s.name); setFPhone(s.phone); setFEmail(s.email);
    setFAddress(s.address); setFCity(s.city); setFState(s.state);
    setFOpenBal(s.openingBalance); setFBalType(s.balanceType);
    setFComm(s.commissionPercent); setFNotes(s.notes); setModalOpen(true);
  };

  const save = () => {
    if (!fName.trim()) return;
    if (editSupplier) {
      db.updateSupplier(editSupplier.id, { name: fName, phone: fPhone, email: fEmail, address: fAddress, city: fCity, state: fState, openingBalance: fOpenBal, balanceType: fBalType, commissionPercent: fComm, notes: fNotes });
      showNotification(t('messages.supplierUpdated'), 'success');
    } else {
      db.createSupplier({ name: fName, phone: fPhone, email: fEmail, address: fAddress, city: fCity, state: fState, openingBalance: fOpenBal, balanceType: fBalType, commissionPercent: fComm, notes: fNotes });
      showNotification(t('messages.supplierCreated'), 'success');
    }
    setModalOpen(false); loadSuppliers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suppliers / સપ્લાયર</h1>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> {t('buttons.addSupplier')}</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder={t('placeholders.searchSupplier')} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} {t('common.search')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const balance = db.getPartyBalance(s.id);
          return (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                    <p className="text-sm text-slate-500">{s.city}, {s.state}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="p-1.5 h-auto" onClick={() => openEdit(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="p-1.5 h-auto text-red-500" onClick={() => { if (confirm('Delete this supplier?')) { db.deleteSupplier(s.id); showNotification('Supplier deleted', 'info'); loadSuppliers(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{s.phone}</div>
                  {s.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" />{s.email}</div>}
                  {s.notes && <div className="text-xs text-slate-400">{s.notes}</div>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className={`text-lg font-bold ${balance.type === 'receivable' ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(balance.balance)}</p>
                  </div>
                  <Badge variant="info">Comm: {s.commissionPercent}%</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editSupplier ? 'Edit Supplier' : 'Add Supplier / નવો સપ્લાયર'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Supplier Name *" value={fName} onChange={e => setFName(e.target.value)} placeholder="Enter supplier name" />
          <Input label="Phone" value={fPhone} onChange={e => setFPhone(e.target.value)} />
          <Input label="Email" value={fEmail} onChange={e => setFEmail(e.target.value)} />
          <TextArea label="Address" value={fAddress} onChange={e => setFAddress(e.target.value)} />
          <Input label="City" value={fCity} onChange={e => setFCity(e.target.value)} />
          <Input label="State" value={fState} onChange={e => setFState(e.target.value)} />
          <Select label="Balance Type" value={fBalType} onChange={e => setFBalType(e.target.value as LedgerType)}
            options={[{ value: 'debit', label: 'Debit (They owe us)' }, { value: 'credit', label: 'Credit (We owe them)' }]} />
          <Input label="Opening Balance" type="number" value={fOpenBal} onChange={e => setFOpenBal(parseFloat(e.target.value) || 0)} prefix="₹" />
          <Input label="Commission %" type="number" value={fComm} onChange={e => setFComm(parseFloat(e.target.value) || 0)} suffix="%" />
          <TextArea label="Notes" value={fNotes} onChange={e => setFNotes(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>{editSupplier ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
    </div>
  );
}
