import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/formatters';
import * as db from '@/db/db';
import { Plus, Search, Download } from 'lucide-react';
import type { LedgerType } from '@/db/schema';

export function LedgerPage() {
  const { t } = useTranslation();
  const { parties, suppliers, loadParties, loadSuppliers } = useAppStore();
  const [selectedParty, setSelectedParty] = useState('');
  const [entries, setEntries] = useState(db.getLedgerEntries());
  const [modalOpen, setModalOpen] = useState(false);
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fType, setFType] = useState<LedgerType>('debit');
  const [fAmount, setFAmount] = useState(0);
  const [fDesc, setFDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadParties();
    loadSuppliers();
  }, []);

  useEffect(() => {
    setEntries(db.getLedgerEntries());
  }, [parties, suppliers]);

  const allParties = [...parties, ...suppliers.map(s => ({ id: s.id, name: s.name }))];

  const filtered = selectedParty
    ? entries.filter(e => e.partyId === selectedParty)
    : entries;

  const dateFiltered = dateFrom && dateTo
    ? filtered.filter(e => e.date >= dateFrom && e.date <= dateTo)
    : filtered;

  const searched = searchTerm
    ? dateFiltered.filter(e => e.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || e.description.toLowerCase().includes(searchTerm.toLowerCase()))
    : dateFiltered;

  // Calculate totals
  const totalDebit = searched.reduce((s, e) => e.type === 'debit' ? s + e.amount : s, 0);
  const totalCredit = searched.reduce((s, e) => e.type === 'credit' ? s + e.amount : s, 0);

  const selectedPartyName = selectedParty ? allParties.find(p => p.id === selectedParty)?.name || '' : 'All Parties';
  const balance = db.getPartyBalance(selectedParty);

  const saveEntry = () => {
    if (!selectedParty || fAmount <= 0) return;
    const party = allParties.find(p => p.id === selectedParty);
    if (!party) return;
    db.addLedgerEntry({
      partyId: selectedParty,
      partyName: party.name,
      date: fDate,
      type: fType,
      amount: fAmount,
      description: fDesc || 'Manual Entry',
      referenceType: 'manual',
      referenceId: '',
      runningBalance: 0,
    });
    setModalOpen(false);
    setEntries(db.getLedgerEntries());
    setFAmount(0); setFDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ledger / ખાતું</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            const data = searched.map(e => `${e.date},${e.partyName},${e.type},${e.amount},${e.runningBalance},${e.description}`).join('\n');
            const blob = new Blob([`Date,Party,Type,Amount,Balance,Description\n${data}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'ledger.csv'; a.click();
          }}><Download className="h-4 w-4" /> {t('common.export')}</Button>
          <Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t('buttons.newEntry')}</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Party</label>
              <select value={selectedParty} onChange={e => setSelectedParty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">All Parties</option>
                {allParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex items-end">
              {(searchTerm || dateFrom || dateTo || selectedParty) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); setSelectedParty(''); }}>Clear Filters</Button>
              )}
            </div>
          </div>
          {selectedParty && (
            <div className="mt-3 flex gap-4 text-sm">
              <Badge variant="info">{selectedPartyName}</Badge>
              <Badge variant={balance.type === 'receivable' ? 'success' : 'danger'}>
                {balance.type === 'receivable' ? 'Receivable' : 'Payable'}: {formatCurrency(balance.balance)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tally-style Ledger Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Party</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit (Dr.)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit (Cr.)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {searched.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{entry.partyName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <span className="text-xs text-slate-400 mr-1">[{entry.referenceType}]</span>
                    {entry.description}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400">
                    {entry.type === 'debit' ? formatCurrency(entry.amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {entry.type === 'credit' ? formatCurrency(entry.amount) : '-'}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${entry.runningBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(entry.runningBalance))} {entry.runningBalance >= 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-300 dark:border-slate-600">
                <td colSpan={3} className="px-4 py-3 font-bold text-slate-900 dark:text-white">Total</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{formatCurrency(totalDebit)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(totalCredit)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(Math.abs(totalDebit - totalCredit))}</td>
              </tr>
            </tfoot>
          </table>
          {searched.length === 0 && (
            <div className="text-center py-12 text-slate-400">No ledger entries found</div>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Manual Ledger Entry / મેન્યુઅલ એન્ટ્રી" size="md">
        <div className="space-y-4">
          <Select label="Party *" value={selectedParty} onChange={e => setSelectedParty(e.target.value)}
            options={[{ value: '', label: 'Select Party...' }, ...allParties.map(p => ({ value: p.id, label: p.name }))]} />
          <Input label="Date *" type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
          <Select label="Type *" value={fType} onChange={e => setFType(e.target.value as LedgerType)}
            options={[{ value: 'debit', label: 'Debit (Dr.) - They owe us' }, { value: 'credit', label: 'Credit (Cr.) - We owe them' }]} />
          <Input label="Amount *" type="number" value={fAmount} onChange={e => setFAmount(parseFloat(e.target.value) || 0)} prefix="₹" />
          <TextArea label="Description" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="e.g., Manual adjustment" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={saveEntry}>Save Entry</Button>
        </div>
      </Modal>
    </div>
  );
}
