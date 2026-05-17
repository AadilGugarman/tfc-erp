import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
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
} from "@/components";
import { formatCurrency, formatDate } from "@/utils/formatters";
import * as db from "@/db/db";
import {
  Plus,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import type { LedgerType } from "@/db/schema";
import { useShortcutAction } from "@/keyboard/shortcutManager";

export function LedgerPage() {
  const { t } = useTranslation();
  const {
    parties,
    suppliers,
    ledgerEntries,
    currentCompanyId,
    loadParties,
    loadSuppliers,
    loadLedgerEntries,
  } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();
  const [selectedParty, setSelectedParty] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [fDate, setFDate] = useState(new Date().toISOString().split("T")[0]);
  const [fType, setFType] = useState<LedgerType>("debit");
  const [fAmount, setFAmount] = useState(0);
  const [fDesc, setFDesc] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadParties();
    loadSuppliers();
    loadLedgerEntries();
  }, []);

  const allParties = [
    ...parties,
    ...suppliers.map((s) => ({ id: s.id, name: s.name })),
  ];

  const filtered = selectedParty
    ? ledgerEntries.filter((e) => e.partyId === selectedParty)
    : ledgerEntries;

  const dateFiltered =
    dateFrom && dateTo
      ? filtered.filter((e) => e.date >= dateFrom && e.date <= dateTo)
      : filtered;

  const searched = searchTerm
    ? dateFiltered.filter(
        (e) =>
          e.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : dateFiltered;

  // Calculate totals
  const totalDebit = searched.reduce(
    (s, e) => (e.type === "debit" ? s + e.amount : s),
    0,
  );
  const totalCredit = searched.reduce(
    (s, e) => (e.type === "credit" ? s + e.amount : s),
    0,
  );

  const selectedPartyName = selectedParty
    ? allParties.find((p) => p.id === selectedParty)?.name || ""
    : "All Parties";
  const balance = db.getPartyBalance(selectedParty);

  const handleSaveEntry = () => {
    if (!selectedParty || fAmount <= 0) {
      error("Validation Error", "Please select a party and enter an amount");
      return;
    }
    const party = allParties.find((p) => p.id === selectedParty);
    if (!party) {
      error("Error", "Party not found");
      return;
    }
    try {
      if (!currentCompanyId) {
        error("Error", "No company selected");
        return;
      }
      db.addLedgerEntry({
        companyId: currentCompanyId,
        partyId: selectedParty,
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

  const handleExport = () => {
    try {
      const data = searched
        .map(
          (e) =>
            `${e.date},${e.partyName},${e.type},${e.amount},${e.runningBalance},${e.description}`,
        )
        .join("\n");
      const csv = `Date,Party,Type,Amount,Balance,Description\n${data}`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger-${selectedPartyName}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      success("Export Complete", "Ledger exported as CSV");
    } catch (err) {
      error("Export Failed", (err as Error).message);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setSelectedParty("");
  };

  useShortcutAction("new-entry", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="ledger"]')) return;
    setModalOpen(true);
  });

  useShortcutAction("save", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="ledger"]')) return;
    if (!modalOpen) return;
    handleSaveEntry();
  });

  return (
    <PageTransition>
      <div data-entry-surface="ledger">
        <div className="space-y-3">
          {/* Filters */}
          <Section title="Filters">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <PremiumSelect
                label="Party"
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                options={[
                  { value: "", label: "All Parties" },
                  ...allParties.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />

              <PremiumInput
                label="Search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Description or party..."
              />

              <PremiumInput
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />

              <PremiumInput
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Party Balance Display */}
            {selectedParty && (
              <div className="mt-4 p-4 bg-linear-to-r from-blue-50 to-blue-50/60 dark:from-blue-950/35 dark:to-blue-900/25 rounded-lg border border-blue-200/50 dark:border-blue-800/40">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedPartyName}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(balance.balance)}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {balance.type === "receivable"
                      ? "(Receivable)"
                      : "(Payable)"}
                  </span>
                </div>
              </div>
            )}
          </Section>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total Debit
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(totalDebit)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <ArrowUpRight
                    size={24}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
              </div>
            </Section>

            <Section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Total Credit
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(totalCredit)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <ArrowDownLeft
                    size={24}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>
            </Section>

            <Section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Net Balance
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      totalDebit - totalCredit >= 0
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {formatCurrency(Math.abs(totalDebit - totalCredit))}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    totalDebit - totalCredit >= 0
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : "bg-orange-50 dark:bg-orange-950/30"
                  }`}
                />
              </div>
            </Section>
          </div>

          {/* Ledger Table */}
          <Section title="Ledger Entries">
            {searched.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No entries found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <PremiumTableHeader>Date</PremiumTableHeader>
                      <PremiumTableHeader>Party</PremiumTableHeader>
                      <PremiumTableHeader>Description</PremiumTableHeader>
                      <PremiumTableHeader numeric>Debit</PremiumTableHeader>
                      <PremiumTableHeader numeric>Credit</PremiumTableHeader>
                      <PremiumTableHeader numeric>Balance</PremiumTableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {searched
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((entry) => (
                        <PremiumTableRow key={entry.id}>
                          <PremiumTableCell>
                            {formatDate(entry.date)}
                          </PremiumTableCell>
                          <PremiumTableCell className="font-medium">
                            {entry.partyName}
                          </PremiumTableCell>
                          <PremiumTableCell>
                            <div>
                              <span className="text-xs text-slate-400 dark:text-slate-600 mr-2 uppercase font-semibold">
                                [{entry.referenceType}]
                              </span>
                              {entry.description}
                            </div>
                          </PremiumTableCell>
                          <PremiumTableCell
                            numeric
                            className={
                              entry.type === "debit"
                                ? "text-red-600 dark:text-red-400 font-semibold"
                                : "text-slate-500"
                            }
                          >
                            {entry.type === "debit"
                              ? formatCurrency(entry.amount)
                              : "—"}
                          </PremiumTableCell>
                          <PremiumTableCell
                            numeric
                            className={
                              entry.type === "credit"
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-slate-500"
                            }
                          >
                            {entry.type === "credit"
                              ? formatCurrency(entry.amount)
                              : "—"}
                          </PremiumTableCell>
                          <PremiumTableCell
                            numeric
                            className={
                              entry.runningBalance >= 0
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            <span className="font-semibold">
                              {formatCurrency(Math.abs(entry.runningBalance))}
                            </span>
                            <span className="text-xs ml-1 font-normal text-slate-500">
                              {entry.runningBalance >= 0 ? "Dr" : "Cr"}
                            </span>
                          </PremiumTableCell>
                        </PremiumTableRow>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* Ledger Entry Modal */}
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
            <PremiumSelect
              label="Party *"
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              error={
                !selectedParty && fAmount > 0 ? "Party is required" : undefined
              }
              options={[
                { value: "", label: "Select a party..." },
                ...allParties.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

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
              error={
                fAmount <= 0 && fAmount !== 0
                  ? "Amount must be greater than 0"
                  : undefined
              }
              placeholder="₹ 0.00"
            />

            <PremiumTextarea
              label="Description"
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              placeholder="e.g., Manual adjustment or payment reconciliation"
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
