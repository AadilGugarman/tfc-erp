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
import { Plus, Search, Trash2, CreditCard, IndianRupee } from 'lucide-react';
import type { PaymentMode } from '@/db/schema';

export function PaymentsPage() {
  const { t } = useTranslation();
  const { parties, suppliers, loadParties, loadSuppliers, showNotification } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fDate, setFDate] = useState(todayStr());
  const [fParty, setFParty] = useState('');
  const [fAmount, setFAmount] = useState(0);
  const [fMode, setFMode] = useState<PaymentMode>('cash');
  const [fType, setFType] = useState<'received' | 'paid'>('received');
  const [fRef, setFRef] = useState('');
  const [fNotes, setFNotes] = useState('');

  useEffect(() => { loadParties(); loadSuppliers(); }, []);

  const allParties = [...parties.map(p => ({ id: p.id, name: p.name })), ...suppliers.map(s => ({ id: s.id, name: s.name }))];
  const payments = db.getPayments().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = payments.filter(p =>
    p.partyName.toLowerCase().includes(search.toLowerCase()) || p.referenceNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = payments.filter(p => p.type === 'received').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.type === 'paid').reduce((s, p) => s + p.amount, 0);

  const save = () => {
    if (!fParty || fAmount <= 0) return;
    const party = allParties.find(p => p.id === fParty);
    if (!party) return;
    db.createPayment({
      date: fDate, partyId: fParty, partyName: party.name,
      amount: fAmount, mode: fMode, type: fType, referenceNo: fRef, notes: fNotes,
    });
    showNotification(`Payment ${fType === 'received' ? 'received' : 'paid'} successfully`, 'success');
    setModalOpen(false);
    setFAmount(0); setFRef(''); setFNotes(''); setFParty('');
    loadParties();
  };

  const deletePayment = (id: string) => {
    if (confirm('Delete this payment?')) {
      db.deletePayment(id);
      showNotification('Payment deleted', 'info');
      loadParties();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments / ચુકવણી</h1></div>
        <Button onClick={() => { setFParty(''); setFDate(todayStr()); setFType('received'); setFAmount(0); setFMode('cash'); setFRef(''); setFNotes(''); setModalOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> New Payment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><IndianRupee className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceived)}</p><p className="text-xs text-slate-500">Total Received</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><IndianRupee className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{formatCurrency(totalPaid)}</p><p className="text-xs text-slate-500">Total Paid</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><CreditCard className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalReceived - totalPaid)}</p><p className="text-xs text-slate-500">Net</p></div></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" placeholder={t('placeholders.searchPayments')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Party</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ref No</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.partyName}</td>
                  <td className="px-4 py-3"><Badge variant={p.type === 'received' ? 'success' : 'danger'}>{p.type === 'received' ? 'Received' : 'Paid'}</Badge></td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{p.mode}</td>
                  <td className="px-4 py-3 text-slate-500">{p.referenceNo || '-'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${p.type === 'received' ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" className="p-1.5 h-auto text-red-500" onClick={() => deletePayment(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-slate-400">No payments found</div>}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Payment / નવી ચુકવણી" size="md">
        <div className="space-y-4">
          <Select label="Type *" value={fType} onChange={e => setFType(e.target.value as 'received' | 'paid')}
            options={[{ value: 'received', label: 'Payment Received (લેવું)' }, { value: 'paid', label: 'Payment Paid (આપવું)' }]} />
          <Select label="Party *" value={fParty} onChange={e => setFParty(e.target.value)}
            options={[{ value: '', label: 'Select Party...' }, ...allParties.map(p => ({ value: p.id, label: p.name }))]} />
          <Input label="Date" type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
          <Input label="Amount *" type="number" value={fAmount} onChange={e => setFAmount(parseFloat(e.target.value) || 0)} prefix="₹" />
          <Select label="Mode" value={fMode} onChange={e => setFMode(e.target.value as PaymentMode)}
            options={[{ value: 'cash', label: 'Cash (રોકડ)' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'upi', label: 'UPI' }, { value: 'cheque', label: 'Cheque' }, { value: 'other', label: 'Other' }]} />
          <Input label="Reference No" value={fRef} onChange={e => setFRef(e.target.value)} placeholder="UTR / Cheque No" />
          <TextArea label="Notes" value={fNotes} onChange={e => setFNotes(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={save}>Save Payment</Button></div>
      </Modal>
    </div>
  );
}
