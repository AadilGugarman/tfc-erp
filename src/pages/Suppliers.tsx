import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
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
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white">Suppliers</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-60 pl-7 pr-3 py-1.5 text-[12px] border border-slate-200 dark:border-[#1e2330] rounded-md bg-white dark:bg-[#111318] text-slate-800 dark:text-[#e8edf5] focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb]" />
            </div>
            <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5" /> Add Supplier</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0e1017] border-b border-slate-200 dark:border-[#1e2330]">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">Phone</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">City</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">Commission</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">Balance</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a1f2e]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No suppliers found</td></tr>
              ) : filtered.map(s => {
                const balance = db.getPartyBalance(s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#0e1017] transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500">{s.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500">{s.city}{s.state ? `, ${s.state}` : ''}</td>
                    <td className="px-4 py-2.5 text-right tabnum text-slate-600 dark:text-slate-400">{s.commissionPercent}%</td>
                    <td className={`px-4 py-2.5 text-right tabnum font-semibold ${balance.type === 'receivable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(balance.balance)}
                      <span className="text-[10px] font-normal ml-1 text-slate-400">{balance.type === 'receivable' ? 'Dr' : 'Cr'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1a1f2e] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" onClick={() => openEdit(s)}><Edit2 className="h-3.5 w-3.5" /></button>
                        <button className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors" onClick={() => { if (confirm('Delete this supplier?')) { db.deleteSupplier(s.id); showNotification('Supplier deleted', 'info'); loadSuppliers(); } }}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editSupplier ? 'Edit Supplier' : 'Add Supplier'} size="lg">
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
