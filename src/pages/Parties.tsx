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
import { formatCurrency } from "@/utils/formatters";
import * as db from "@/db/db";
import { Search, Plus, Edit2, Trash2, Phone, Mail, User } from "lucide-react";
import type { Party, LedgerType } from "@/db/schema";
import { useShortcutAction } from "@/keyboard/shortcutManager";

export function PartiesPage() {
  const { t } = useTranslation();
  const { parties, loadParties } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formOpenBal, setFormOpenBal] = useState(0);
  const [formBalType, setFormBalType] = useState<LedgerType>("debit");
  const [formComm, setFormComm] = useState(3);
  const [formNotes, setFormNotes] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  useEffect(() => {
    loadParties();
  }, []);

  const filtered = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  );

  const openNew = () => {
    setEditParty(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormGstin("");
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormOpenBal(0);
    setFormBalType("debit");
    setFormComm(3);
    setFormNotes("");
    setModalOpen(true);
  };

  const openEdit = (party: Party) => {
    setEditParty(party);
    setFormName(party.name);
    setFormPhone(party.phone);
    setFormEmail(party.email);
    setFormGstin(party.gstin);
    setFormAddress(party.address);
    setFormCity(party.city);
    setFormState(party.state);
    setFormOpenBal(party.openingBalance);
    setFormBalType(party.balanceType);
    setFormComm(party.commissionPercent);
    setFormNotes(party.notes);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      error("Validation Error", "Party name is required");
      return;
    }
    setSaveLoading(true);
    try {
      if (editParty) {
        db.updateParty(editParty.id, {
          name: formName,
          phone: formPhone,
          email: formEmail,
          gstin: formGstin,
          address: formAddress,
          city: formCity,
          state: formState,
          openingBalance: formOpenBal,
          balanceType: formBalType,
          commissionPercent: formComm,
          notes: formNotes,
        });
        success("Party Updated", "Party information updated successfully");
      } else {
        db.createParty({
          name: formName,
          phone: formPhone,
          email: formEmail,
          gstin: formGstin,
          address: formAddress,
          city: formCity,
          state: formState,
          openingBalance: formOpenBal,
          balanceType: formBalType,
          commissionPercent: formComm,
          notes: formNotes,
          isSupplier: false,
        });
        success("Party Created", "New party added successfully");
      }
      setModalOpen(false);
      loadParties();
    } catch (err) {
      error("Error", (err as Error).message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteParty = (id: string) => {
    if (confirm("Are you sure you want to delete this party?")) {
      setDeleteLoading(id);
      try {
        db.deleteParty(id);
        success("Party Deleted", "Party removed successfully");
        loadParties();
      } catch (err) {
        error("Error", (err as Error).message);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedRowIndex(0);
      return;
    }
    if (selectedRowIndex > filtered.length - 1) {
      setSelectedRowIndex(filtered.length - 1);
    }
  }, [filtered.length, selectedRowIndex]);

  useShortcutAction("new-entry", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="parties"]')) return;
    openNew();
  });

  useShortcutAction("save", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="parties"]')) return;
    if (!modalOpen) return;
    handleSave();
  });

  useShortcutAction("delete-row", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="parties"]')) return;
    if (modalOpen) return;
    const selected = filtered[selectedRowIndex];
    if (!selected) return;
    handleDeleteParty(selected.id);
  });

  useEffect(() => {
    const onHistoryKeyDown = (event: KeyboardEvent) => {
      if (modalOpen) return;
      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement?.closest('[data-entry-surface="parties"]')) return;
      if (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA"
      )
        return;

      if (event.key === "ArrowDown") {
        if (filtered.length === 0) return;
        event.preventDefault();
        setSelectedRowIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      }
      if (event.key === "ArrowUp") {
        if (filtered.length === 0) return;
        event.preventDefault();
        setSelectedRowIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    document.addEventListener("keydown", onHistoryKeyDown);
    return () => document.removeEventListener("keydown", onHistoryKeyDown);
  }, [filtered.length, modalOpen]);

  return (
    <PageTransition>
      <div data-entry-surface="parties">
        {/* Search */}
        <Section>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-[#2a3550] rounded-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
              />
            </div>
            <Button icon={<Plus size={16} />} onClick={openNew}>
              Add Party
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {filtered.length} parties found
          </p>
        </Section>

        {/* Parties Table */}
        <Section title="All Parties">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No parties found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <PremiumTableHeader>Name</PremiumTableHeader>
                    <PremiumTableHeader>Contact</PremiumTableHeader>
                    <PremiumTableHeader>City</PremiumTableHeader>
                    <PremiumTableHeader>Commission</PremiumTableHeader>
                    <PremiumTableHeader numeric>Balance</PremiumTableHeader>
                    <PremiumTableHeader>Actions</PremiumTableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((party, index) => {
                    const balance = db.getPartyBalance(party.id);
                    return (
                      <PremiumTableRow key={party.id}>
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          <div className="font-medium">{party.name}</div>
                          {party.gstin && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              GST: {party.gstin}
                            </div>
                          )}
                        </PremiumTableCell>
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          <div className="text-sm">{party.phone || "—"}</div>
                          {party.email && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {party.email}
                            </div>
                          )}
                        </PremiumTableCell>
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          {party.city || "—"}
                        </PremiumTableCell>
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          {party.commissionPercent}%
                        </PremiumTableCell>
                        <PremiumTableCell
                          numeric
                          className={`${
                            balance.type === "receivable"
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-red-600 dark:text-red-400"
                          } ${index === selectedRowIndex ? "bg-blue-50/60 dark:bg-blue-950/20" : ""}`}
                        >
                          <div className="font-semibold">
                            {formatCurrency(balance.balance)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                            {balance.type}
                          </div>
                        </PremiumTableCell>
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Edit2 size={16} />}
                              onClick={() => {
                                setSelectedRowIndex(index);
                                openEdit(party);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={deleteLoading === party.id}
                              className="text-red-600 dark:text-red-400"
                              icon={<Trash2 size={16} />}
                              onClick={() => {
                                setSelectedRowIndex(index);
                                handleDeleteParty(party.id);
                              }}
                            />
                          </div>
                        </PremiumTableCell>
                      </PremiumTableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Party Modal */}
        <PremiumModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editParty ? "Edit Party" : "Add Party"}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button loading={saveLoading} onClick={handleSave}>
                {editParty ? "Update Party" : "Create Party"}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumInput
                label="Party Name *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                error={
                  !formName && formName !== ""
                    ? "Party name is required"
                    : undefined
                }
                placeholder="Enter party name"
              />
              <PremiumInput
                label="Phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="10-digit phone number"
              />

              <PremiumInput
                label="Email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="party@example.com"
              />
              <PremiumInput
                label="GST Number"
                value={formGstin}
                onChange={(e) => setFormGstin(e.target.value)}
                placeholder="15-digit GST ID"
              />

              <PremiumInput
                label="City"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="City name"
              />
              <PremiumInput
                label="State"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                placeholder="State name"
              />
            </div>

            <PremiumTextarea
              label="Address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="Complete address"
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PremiumSelect
                label="Balance Type"
                value={formBalType}
                onChange={(e) => setFormBalType(e.target.value as LedgerType)}
                options={[
                  { value: "debit", label: "Debit (We receive)" },
                  { value: "credit", label: "Credit (They receive)" },
                ]}
              />

              <PremiumInput
                label="Opening Balance"
                type="number"
                value={formOpenBal}
                onChange={(e) =>
                  setFormOpenBal(parseFloat(e.target.value) || 0)
                }
                placeholder="₹ 0.00"
              />

              <PremiumInput
                label="Commission %"
                type="number"
                value={formComm}
                onChange={(e) => setFormComm(parseFloat(e.target.value) || 0)}
                placeholder="3%"
              />
            </div>

            <PremiumTextarea
              label="Notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Additional notes or remarks"
              rows={2}
            />
          </div>
        </PremiumModal>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </PageTransition>
  );
}
