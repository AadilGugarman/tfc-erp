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
import { Search, Plus, Edit2, Trash2, Phone, Mail, CreditCard } from 'lucide-react';
import type { Party, LedgerType } from '@/db/schema';

export function PartiesPage() {
  const { t } = useTranslation();
  const { parties, loadParties, setCurrentPage, showNotification } = useAppStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formOpenBal, setFormOpenBal] = useState(0);
  const [formBalType, setFormBalType] = useState<LedgerType>('debit');
  const [formComm, setFormComm] = useState(3);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => { loadParties(); }, []);

  const filtered = parties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  const openNew = () => {
    setEditParty(null);
    setFormName(''); setFormPhone(''); setFormEmail(''); setFormGstin('');
    setFormAddress(''); setFormCity(''); setFormState(''); setFormOpenBal(0);
    setFormBalType('debit'); setFormComm(3); setFormNotes('');
    setModalOpen(true);
  };

  const openEdit = (party: Party) => {
    setEditParty(party);
    setFormName(party.name); setFormPhone(party.phone); setFormEmail(party.email);
    setFormGstin(party.gstin); setFormAddress(party.address); setFormCity(party.city);
    setFormState(party.state); setFormOpenBal(party.openingBalance);
    setFormBalType(party.balanceType); setFormComm(party.commissionPercent);
    setFormNotes(party.notes);
    setModalOpen(true);
  };

  const save = () => {
    if (!formName.trim()) return;
    if (editParty) {
      db.updateParty(editParty.id, {
        name: formName, phone: formPhone, email: formEmail, gstin: formGstin,
        address: formAddress, city: formCity, state: formState,
        openingBalance: formOpenBal, balanceType: formBalType,
        commissionPercent: formComm, notes: formNotes,
      });
      showNotification(t('messages.partyUpdated'), 'success');
    } else {
      db.createParty({
        name: formName, phone: formPhone, email: formEmail, gstin: formGstin,
        address: formAddress, city: formCity, state: formState,
        openingBalance: formOpenBal, balanceType: formBalType,
        commissionPercent: formComm, notes: formNotes, isSupplier: false,
      });
      showNotification(t('messages.partyCreated'), 'success');
    }
    setModalOpen(false);
    loadParties();
  };

  const deleteParty = (id: string) => {
    if (confirm(t('dialogs.deleteParty'))) {
      db.deleteParty(id);
      showNotification(t('messages.deleted'), 'info');
      loadParties();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parties / પાર્ટી</h1>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> {t('buttons.addParty')}</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder={t('placeholders.searchParty')} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} {t('common.search')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(party => {
          const balance = db.getPartyBalance(party.id);
          return (
            <Card key={party.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{party.name}</h3>
                    <p className="text-sm text-slate-500">{party.city}, {party.state}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="p-1.5 h-auto" onClick={() => openEdit(party)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="p-1.5 h-auto text-red-500" onClick={() => deleteParty(party.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{party.phone}</div>
                  {party.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" />{party.email}</div>}
                  {party.gstin && <div>GSTIN: {party.gstin}</div>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{t('tableHeaders.balance')}</p>
                    <p className={`text-lg font-bold ${balance.type === 'receivable' ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(balance.balance)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">Comm: {party.commissionPercent}%</Badge>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage('ledger')}>
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> {t('buttons.viewLedger')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editParty ? t('dialogs.editParty') : t('dialogs.addParty')} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('parties.partyName')} value={formName} onChange={e => setFormName(e.target.value)} placeholder={t('placeholders.enterPartyName')} />
          <Input label={t('parties.phone')} value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder={t('placeholders.enterPhone')} />
          <Input label={t('parties.email')} value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder={t('placeholders.enterEmail')} />
          <Input label={t('parties.gstin')} value={formGstin} onChange={e => setFormGstin(e.target.value)} placeholder={t('placeholders.enterGstin')} />
          <TextArea label={t('parties.address')} value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder={t('placeholders.enterAddress')} />
          <Input label={t('settings.city')} value={formCity} onChange={e => setFormCity(e.target.value)} placeholder={t('placeholders.enterCity')} />
          <Input label={t('settings.state')} value={formState} onChange={e => setFormState(e.target.value)} placeholder={t('placeholders.enterState')} />
          <Select label={t('parties.type')} value={formBalType} onChange={e => setFormBalType(e.target.value as LedgerType)}
            options={[{ value: 'debit', label: t('statuses.debit') }, { value: 'credit', label: t('statuses.credit') }]} />
          <Input label={t('parties.openingBalance')} type="number" value={formOpenBal} onChange={e => setFormOpenBal(parseFloat(e.target.value) || 0)} prefix="₹" />
          <Input label={t('settings.commissionPercent')} type="number" value={formComm} onChange={e => setFormComm(parseFloat(e.target.value) || 0)} suffix="%" />
          <TextArea label={t('common.notes')} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder={t('placeholders.enterNotes')} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={save}>{editParty ? t('common.update') : t('common.create')}</Button>
        </div>
      </Modal>
    </div>
  );
}
