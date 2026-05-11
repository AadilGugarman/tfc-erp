import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PageLayout,
  Section,
  PremiumModal,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
  PageTransition,
  ToastContainer,
  useToast,
  PremiumTable,
  PremiumTableHeader,
  PremiumTableRow,
  PremiumTableCell,
} from '@/components';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import { Plus, Search, Trash2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import type { PaymentMode } from '@/db/schema';

export function PaymentsPage() {
  const { t } = useTranslation();
  const { parties, suppliers, loadParties, loadSuppliers } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fDate, setFDate] = useState(todayStr());
  const [fParty, setFParty] = useState('');
  const [fAmount, setFAmount] = useState(0);
  const [fMode, setFMode] = useState<PaymentMode>('cash');
  const [fType, setFType] = useState<'received' | 'paid'>('received');
  const [fRef, setFRef] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadParties();
    loadSuppliers();
  }, []);

  const allParties = [
    ...parties.map(p => ({ id: p.id, name: p.name })),
    ...suppliers.map(s => ({ id: s.id, name: s.name })),
  ];
  const payments = db.getPayments().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = payments.filter(
    p =>
      p.partyName.toLowerCase().includes(search.toLowerCase()) ||
      p.referenceNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceived = payments
    .filter(p => p.type === 'received')
    .reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments
    .filter(p => p.type === 'paid')
    .reduce((s, p) => s + p.amount, 0);
  const netBalance = totalReceived - totalPaid;

  const handleSave = () => {
    if (!fParty || fAmount <= 0) {
      error('Validation Error', 'Please select a party and enter an amount');
      return;
    }
    const party = allParties.find(p => p.id === fParty);
    if (!party) {
      error('Error', 'Party not found');
      return;
    }
    try {
      db.createPayment({
        date: fDate,
        partyId: fParty,
        partyName: party.name,
        amount: fAmount,
        mode: fMode,
        type: fType,
        referenceNo: fRef,
        notes: fNotes,
      });
      success(
        `Payment ${fType === 'received' ? 'Received' : 'Paid'}`,
        `${formatCurrency(fAmount)} payment saved successfully`
      );
      setModalOpen(false);
      setFAmount(0);
      setFRef('');
      setFNotes('');
      setFParty('');
      loadParties();
    } catch (err) {
      error('Failed to save payment', (err as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      setDeleteLoading(id);
      try {
        db.deletePayment(id);
        success('Payment Deleted', 'Payment removed successfully');
        loadParties();
      } catch (err) {
        error('Failed to delete payment', (err as Error).message);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleOpenModal = () => {
    setFParty('');
    setFDate(todayStr());
    setFType('received');
    setFAmount(0);
    setFMode('cash');
    setFRef('');
    setFNotes('');
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <PageLayout
        title="Payments"
        subtitle="Manage incoming and outgoing payment transactions"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <Button icon={<Plus size={16} />} onClick={handleOpenModal}>
              New Payment
            </Button>
          </div>
        }
      >
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Payments Received</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(totalReceived)}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Section>

          <Section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Payments Paid</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <TrendingDown size={24} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Section>

          <Section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Net Balance</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    netBalance >= 0
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(Math.abs(netBalance))}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  netBalance >= 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/30'
                    : 'bg-red-50 dark:bg-red-950/30'
                }`}
              >
                <CreditCard
                  size={24}
                  className={
                    netBalance >= 0
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                />
              </div>
            </div>
          </Section>
        </div>

        {/* Payments Table */}
        <Section title="Payment History">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <PremiumTableHeader>Date</PremiumTableHeader>
                    <PremiumTableHeader>Party</PremiumTableHeader>
                    <PremiumTableHeader>Type</PremiumTableHeader>
                    <PremiumTableHeader>Mode</PremiumTableHeader>
                    <PremiumTableHeader>Reference</PremiumTableHeader>
                    <PremiumTableHeader numeric>Amount</PremiumTableHeader>
                    <PremiumTableHeader>Actions</PremiumTableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map(p => (
                    <PremiumTableRow key={p.id}>
                      <PremiumTableCell>{formatDate(p.date)}</PremiumTableCell>
                      <PremiumTableCell className="font-medium">{p.partyName}</PremiumTableCell>
                      <PremiumTableCell>
                        <Badge variant={p.type === 'received' ? 'success' : 'danger'}>
                          {p.type === 'received' ? 'Received' : 'Paid'}
                        </Badge>
                      </PremiumTableCell>
                      <PremiumTableCell className="capitalize">{p.mode}</PremiumTableCell>
                      <PremiumTableCell>{p.referenceNo || '—'}</PremiumTableCell>
                      <PremiumTableCell
                        numeric
                        className={
                          p.type === 'received'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {formatCurrency(p.amount)}
                      </PremiumTableCell>
                      <PremiumTableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={deleteLoading === p.id}
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </PremiumTableCell>
                    </PremiumTableRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </PageLayout>

      {/* Payment Modal */}
      <PremiumModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Payment"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Payment</Button>
          </>
        }
      >
        <div className="space-y-5">
          <PremiumSelect
            label="Type *"
            value={fType}
            onChange={e => setFType(e.target.value as 'received' | 'paid')}
            options={[
              { value: 'received', label: 'Payment Received' },
              { value: 'paid', label: 'Payment Paid' },
            ]}
          />

          <PremiumSelect
            label="Party *"
            value={fParty}
            onChange={e => setFParty(e.target.value)}
            error={!fParty && fAmount > 0 ? 'Party is required' : undefined}
            options={[
              { value: '', label: 'Select a party...' },
              ...allParties.map(p => ({ value: p.id, label: p.name })),
            ]}
          />

          <PremiumInput
            label="Date"
            type="date"
            value={fDate}
            onChange={e => setFDate(e.target.value)}
          />

          <PremiumInput
            label="Amount *"
            type="number"
            value={fAmount}
            onChange={e => setFAmount(parseFloat(e.target.value) || 0)}
            error={fAmount <= 0 && fAmount !== 0 ? 'Amount must be greater than 0' : undefined}
            placeholder="₹ 0.00"
          />

          <PremiumSelect
            label="Payment Mode"
            value={fMode}
            onChange={e => setFMode(e.target.value as PaymentMode)}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank', label: 'Bank Transfer' },
              { value: 'upi', label: 'UPI' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <PremiumInput
            label="Reference No"
            value={fRef}
            onChange={e => setFRef(e.target.value)}
            placeholder="UTR / Cheque No (optional)"
          />

          <PremiumTextarea
            label="Notes"
            value={fNotes}
            onChange={e => setFNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>
      </PremiumModal>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </PageTransition>
  );
}

