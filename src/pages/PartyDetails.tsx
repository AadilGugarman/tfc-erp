import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import {
  Section,
  PageTransition,
  PremiumTable,
  PremiumTableHeader,
  PremiumTableRow,
  PremiumTableCell,
  PremiumModal,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
  ToastContainer,
  useToast,
} from "@/components";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import * as db from "@/db/db";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  History,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { Party, LedgerEntry, LedgerType } from "@/db/schema";

export function PartyDetailsPage() {
  const { t } = useTranslation();
  const { companyId, partyId } = useParams<{ companyId: string; partyId: string }>();
  const navigate = useNavigate();
  const { parties, ledgerEntries, currentCompanyId, loadParties, loadLedgerEntries, bills, purchases, payments } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "payments" | "statement">("overview");
  const [party, setParty] = useState<Party | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Manual Entry Form
  const [fDate, setFDate] = useState(new Date().toISOString().split("T")[0]);
  const [fType, setFType] = useState<LedgerType>("debit");
  const [fAmount, setFAmount] = useState(0);
  const [fDesc, setFDesc] = useState("");

  useEffect(() => {
    loadParties();
    loadLedgerEntries();
  }, []);

  useEffect(() => {
    if (partyId) {
      const found = parties.find((p) => p.id === partyId);
      if (found) {
        setParty(found);
      }
    }
  }, [partyId, parties]);

  if (!party) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
        <p className="text-slate-500">Loading party details...</p>
      </div>
    );
  }

  const partyLedger = ledgerEntries.filter((e) => e.partyId === party.id);
  const partyBills = bills.filter((b) => b.partyId === party.id);
  const partyPurchases = purchases.filter((p) => p.supplierId === party.id);
  const partyPayments = payments.filter((p) => p.partyId === party.id);
  const balance = db.getPartyBalance(currentCompanyId || "", party.id);

  const handleSaveEntry = () => {
    if (fAmount <= 0) {
      error("Validation Error", "Please enter a valid amount");
      return;
    }
    try {
      if (!currentCompanyId) return;
      db.addLedgerEntry({
        companyId: currentCompanyId,
        partyId: party.id,
        partyName: party.name,
        date: fDate,
        type: fType,
        amount: fAmount,
        description: fDesc || "Manual Entry",
        referenceType: "manual",
        referenceId: "",
        runningBalance: 0,
      });
      success("Entry Saved", "Manual ledger entry created successfully");
      setModalOpen(false);
      loadLedgerEntries();
      setFAmount(0);
      setFDesc("");
    } catch (err) {
      error("Failed to save entry", (err as Error).message);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate(`/app/${companyId}/parties`)}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {party.name}
                </h1>
                <Badge variant="soft" className="capitalize">
                  {party.partyType === "both" ? "Customer + Supplier" : party.partyType}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {party.city}, {party.state}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Plus size={16} />}
              onClick={() => setModalOpen(true)}
            >
              Add Manual Entry
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/app/${companyId}/transactions`, { state: { selectedPartyId: party.id } })}
            >
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Section className="!p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                balance.type === "receivable" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"
              )}>
                {balance.type === "receivable" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Outstanding
                </p>
                <p className={cn(
                  "text-xl font-bold",
                  balance.type === "receivable" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatCurrency(balance.balance)}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">{balance.type}</p>
              </div>
            </div>
          </Section>

          <Section className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Total Sales
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(partyBills.reduce((s, b) => s + b.total, 0))}
                </p>
                <p className="text-[10px] text-slate-400">{partyBills.length} Invoices</p>
              </div>
            </div>
          </Section>

          <Section className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Total Payments
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(partyPayments.reduce((s, p) => s + p.amount, 0))}
                </p>
                <p className="text-[10px] text-slate-400">{partyPayments.length} Transactions</p>
              </div>
            </div>
          </Section>

          <Section className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
                <History size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Credit Limit
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {party.creditLimit ? formatCurrency(party.creditLimit) : "No Limit"}
                </p>
                <p className="text-[10px] text-slate-400">Approved limit</p>
              </div>
            </div>
          </Section>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {[
            { id: "overview", label: "Overview" },
            { id: "transactions", label: "Transactions" },
            { id: "payments", label: "Payments" },
            { id: "statement", label: "Statement (Ledger)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Contact Details">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Phone Number</p>
                      <p className="text-sm font-medium">{party.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Email Address</p>
                      <p className="text-sm font-medium">{party.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">Billing Address</p>
                      <p className="text-sm font-medium whitespace-pre-wrap">{party.address || "—"}</p>
                      <p className="text-sm text-slate-500 mt-1">{party.city}, {party.state}</p>
                    </div>
                  </div>
                  {party.shippingAddress && (
                    <div className="flex items-start gap-3">
                      <Truck className="w-4 h-4 text-slate-400 mt-1" />
                      <div>
                        <p className="text-xs text-slate-500">Shipping Address</p>
                        <p className="text-sm font-medium whitespace-pre-wrap">{party.shippingAddress}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 text-slate-400 mt-1 font-bold text-[10px]">GST</div>
                    <div>
                      <p className="text-xs text-slate-500">GSTIN</p>
                      <p className="text-sm font-medium font-mono uppercase">{party.gstin || "—"}</p>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Notes & Remarks">
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-full min-h-[150px]">
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic">
                    {party.notes || "No notes available for this party."}
                  </p>
                </div>
              </Section>
            </div>
          )}

          {activeTab === "transactions" && (
            <Section title="Recent Transactions">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <PremiumTableHeader>Date</PremiumTableHeader>
                      <PremiumTableHeader>Ref #</PremiumTableHeader>
                      <PremiumTableHeader>Type</PremiumTableHeader>
                      <PremiumTableHeader numeric>Amount</PremiumTableHeader>
                      <PremiumTableHeader>Status</PremiumTableHeader>
                      <PremiumTableHeader>Actions</PremiumTableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[...partyBills, ...partyPurchases]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((tx) => (
                        <PremiumTableRow key={tx.id}>
                          <PremiumTableCell>{formatDate(tx.date)}</PremiumTableCell>
                          <PremiumTableCell className="font-mono uppercase font-medium">
                            {"billNo" in tx ? tx.billNo : tx.purchaseNo}
                          </PremiumTableCell>
                          <PremiumTableCell>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {"billNo" in tx ? "Sale" : "Purchase"}
                            </Badge>
                          </PremiumTableCell>
                          <PremiumTableCell numeric className="font-semibold">
                            {formatCurrency(tx.total)}
                          </PremiumTableCell>
                          <PremiumTableCell>
                            <Badge
                              variant="soft"
                              className={cn(
                                "capitalize",
                                tx.status === "paid" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                tx.status === "partial" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                                "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              )}
                            >
                              {tx.status}
                            </Badge>
                          </PremiumTableCell>
                          <PremiumTableCell>
                            <Button size="sm" variant="ghost">View</Button>
                          </PremiumTableCell>
                        </PremiumTableRow>
                      ))}
                    {partyBills.length === 0 && partyPurchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">No transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {activeTab === "payments" && (
            <Section title="Payment History">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <PremiumTableHeader>Date</PremiumTableHeader>
                      <PremiumTableHeader>Type</PremiumTableHeader>
                      <PremiumTableHeader>Mode</PremiumTableHeader>
                      <PremiumTableHeader>Ref #</PremiumTableHeader>
                      <PremiumTableHeader numeric>Amount</PremiumTableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {partyPayments
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((p) => (
                        <PremiumTableRow key={p.id}>
                          <PremiumTableCell>{formatDate(p.date)}</PremiumTableCell>
                          <PremiumTableCell>
                            <Badge variant="soft" className={cn(
                              "capitalize",
                              p.type === "received" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            )}>
                              {p.type}
                            </Badge>
                          </PremiumTableCell>
                          <PremiumTableCell className="capitalize">{p.mode}</PremiumTableCell>
                          <PremiumTableCell className="font-mono text-xs">{p.referenceNo || "—"}</PremiumTableCell>
                          <PremiumTableCell numeric className="font-semibold">
                            {formatCurrency(p.amount)}
                          </PremiumTableCell>
                        </PremiumTableRow>
                      ))}
                    {partyPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">No payments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {activeTab === "statement" && (
            <Section title="Account Statement">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <PremiumTableHeader>Date</PremiumTableHeader>
                      <PremiumTableHeader>Description</PremiumTableHeader>
                      <PremiumTableHeader numeric>Debit</PremiumTableHeader>
                      <PremiumTableHeader numeric>Credit</PremiumTableHeader>
                      <PremiumTableHeader numeric>Balance</PremiumTableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {partyLedger
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((entry) => (
                        <PremiumTableRow key={entry.id}>
                          <PremiumTableCell>{formatDate(entry.date)}</PremiumTableCell>
                          <PremiumTableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{entry.description}</span>
                              <span className="text-[10px] uppercase text-slate-400 font-mono tracking-tighter">
                                Ref: {entry.referenceType}
                              </span>
                            </div>
                          </PremiumTableCell>
                          <PremiumTableCell numeric className="text-red-600 dark:text-red-400">
                            {entry.type === "debit" ? formatCurrency(entry.amount) : "—"}
                          </PremiumTableCell>
                          <PremiumTableCell numeric className="text-emerald-600 dark:text-emerald-400">
                            {entry.type === "credit" ? formatCurrency(entry.amount) : "—"}
                          </PremiumTableCell>
                          <PremiumTableCell numeric className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(Math.abs(entry.runningBalance))}
                            <span className="text-[10px] ml-1 font-normal opacity-70">
                              {entry.runningBalance >= 0 ? "Dr" : "Cr"}
                            </span>
                          </PremiumTableCell>
                        </PremiumTableRow>
                      ))}
                    {partyLedger.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">No ledger entries found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        {/* Manual Entry Modal */}
        <PremiumModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Manual Ledger Entry"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEntry}>Save Entry</Button>
            </>
          }
        >
          <div className="space-y-5">
            <PremiumInput
              label="Date *"
              type="date"
              value={fDate}
              onChange={(e) => setFDate(e.target.value)}
            />

            <PremiumSelect
              label="Type *"
              value={fType}
              onChange={(e) => setFType(e.target.value as LedgerType)}
              options={[
                { value: "debit", label: "Debit (Dr.) — They owe us" },
                { value: "credit", label: "Credit (Cr.) — We owe them" },
              ]}
            />

            <PremiumInput
              label="Amount *"
              type="number"
              value={fAmount}
              onChange={(e) => setFAmount(parseFloat(e.target.value) || 0)}
              placeholder="₹ 0.00"
            />

            <PremiumTextarea
              label="Description"
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              placeholder="e.g., Manual adjustment or opening balance"
              rows={3}
            />
          </div>
        </PremiumModal>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </PageTransition>
  );
}
