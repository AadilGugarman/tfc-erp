import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User,
  ExternalLink,
} from "lucide-react";
import type { Party, LedgerType, PartyType } from "@/db/schema";
import { useShortcutAction } from "@/keyboard/shortcutManager";
import { cn } from "@/utils/cn";

export function PartiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { parties, currentCompanyId, loadParties } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "customer" | "supplier" | "both"
  >("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formShippingAddress, setFormShippingAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formOpenBal, setFormOpenBal] = useState(0);
  const [formBalType, setFormBalType] = useState<LedgerType>("debit");
  const [formComm, setFormComm] = useState(3);
  const [formCreditLimit, setFormCreditLimit] = useState(0);
  const [formPartyType, setFormPartyType] = useState<PartyType>("customer");
  const [formNotes, setFormNotes] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  useEffect(() => {
    loadParties();
  }, []);

  const filtered = parties.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || "").includes(search);
    const matchesTab = activeTab === "all" || p.partyType === activeTab;
    return matchesSearch && matchesTab;
  });

  const openNew = () => {
    setEditParty(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormGstin("");
    setFormAddress("");
    setFormShippingAddress("");
    setFormCity("");
    setFormState("");
    setFormOpenBal(0);
    setFormBalType("debit");
    setFormComm(3);
    setFormCreditLimit(0);
    setFormPartyType("customer");
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
    setFormShippingAddress(party.shippingAddress || "");
    setFormCity(party.city);
    setFormState(party.state);
    setFormOpenBal(party.openingBalance);
    setFormBalType(party.balanceType);
    setFormComm(party.commissionPercent);
    setFormCreditLimit(party.creditLimit || 0);
    setFormPartyType(party.partyType || "customer");
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
      const partyData = {
        name: formName,
        phone: formPhone,
        email: formEmail,
        gstin: formGstin,
        address: formAddress,
        shippingAddress: formShippingAddress,
        city: formCity,
        state: formState,
        openingBalance: formOpenBal,
        balanceType: formBalType,
        commissionPercent: formComm,
        creditLimit: formCreditLimit,
        partyType: formPartyType,
        notes: formNotes,
      };

      if (editParty) {
        db.updateParty(editParty.id, partyData);
        success("Party Updated", "Party information updated successfully");
      } else {
        if (!currentCompanyId) {
          error("Validation Error", "No company selected");
          setSaveLoading(false);
          return;
        }
        db.createParty({
          ...partyData,
          companyId: currentCompanyId,
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
        {/* Header & Tabs */}
        <Section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t("parties.title")}
              </h1>
            </div>
            <Button icon={<Plus size={16} />} onClick={openNew}>
              {t("parties.addParty")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
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

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg self-start">
              {[
                { id: "all", label: t("parties.allParties") },
                { id: "customer", label: t("parties.customers") },
                { id: "supplier", label: t("parties.suppliers") },
                { id: "both", label: t("parties.customerSupplier") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {filtered.length} {t("parties.title").toLowerCase()} found
          </p>
        </Section>

        {/* Parties Table */}
        <Section>
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
                    <PremiumTableHeader>Type</PremiumTableHeader>
                    <PremiumTableHeader>Contact</PremiumTableHeader>
                    <PremiumTableHeader>City</PremiumTableHeader>
                    <PremiumTableHeader numeric>Balance</PremiumTableHeader>
                    <PremiumTableHeader>Actions</PremiumTableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((party, index) => {
                    const balance = db.getPartyBalance(
                      currentCompanyId || "",
                      party.id,
                    );
                    return (
                      <PremiumTableRow
                        key={party.id}
                        onClick={() =>
                          navigate(`/app/${companyId}/parties/${party.id}`)
                        }
                        className="cursor-pointer group"
                      >
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {party.name}
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                          {party.gstin && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {party.gstin}
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
                          <Badge
                            variant="soft"
                            className={cn(
                              "capitalize text-[10px] px-1.5 py-0",
                              party.partyType === "customer"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : party.partyType === "supplier"
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                                  : "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                            )}
                          >
                            {party.partyType === "both"
                              ? t("parties.customerSupplier")
                              : t(`parties.${party.partyType}`)}
                          </Badge>
                        </PremiumTableCell>
                        <PremiumTableCell
                          className={
                            index === selectedRowIndex
                              ? "bg-blue-50/60 dark:bg-blue-950/20"
                              : ""
                          }
                        >
                          <div className="text-slate-600 dark:text-slate-400">
                            {party.phone || "—"}
                          </div>
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
                          numeric
                          className={`${
                            balance.type === "receivable"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                          } ${index === selectedRowIndex ? "bg-blue-50/60 dark:bg-blue-950/20" : ""}`}
                        >
                          <div className="font-semibold">
                            {formatCurrency(balance.balance)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider opacity-70">
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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Edit2 size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRowIndex(index);
                                openEdit(party);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={deleteLoading === party.id}
                              className="text-red-500 hover:text-red-600 dark:text-red-400/80"
                              icon={<Trash2 size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
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
          title={editParty ? t("parties.editParty") : t("parties.addParty")}
          size="xl"
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PremiumInput
                    label={t("parties.partyName") + " *"}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter party name"
                  />
                  <PremiumInput
                    label={t("parties.phone")}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="10-digit phone number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PremiumInput
                    label={t("parties.email")}
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="party@example.com"
                  />
                  <PremiumInput
                    label={t("parties.gstin")}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="15-digit GST ID"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PremiumTextarea
                    label={t("parties.address")}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Billing address"
                    rows={3}
                  />
                  <PremiumTextarea
                    label={t("parties.shippingAddress")}
                    value={formShippingAddress}
                    onChange={(e) => setFormShippingAddress(e.target.value)}
                    placeholder="Shipping address (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Business Settings */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  {t("parties.partyType")}
                </h3>

                <PremiumSelect
                  label={t("parties.partyType") + " *"}
                  value={formPartyType}
                  onChange={(e) =>
                    setFormPartyType(e.target.value as PartyType)
                  }
                  options={[
                    { value: "customer", label: t("parties.customer") },
                    { value: "supplier", label: t("parties.supplier") },
                    { value: "both", label: t("parties.both") },
                  ]}
                />

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <PremiumSelect
                    label={t("parties.type") + " (Opening)"}
                    value={formBalType}
                    onChange={(e) =>
                      setFormBalType(e.target.value as LedgerType)
                    }
                    options={[
                      { value: "debit", label: "Debit (We receive)" },
                      { value: "credit", label: "Credit (They receive)" },
                    ]}
                  />

                  <PremiumInput
                    label={t("parties.openingBalance")}
                    type="number"
                    value={formOpenBal}
                    onChange={(e) =>
                      setFormOpenBal(parseFloat(e.target.value) || 0)
                    }
                    placeholder="₹ 0.00"
                  />

                  <PremiumInput
                    label={t("parties.creditLimit")}
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) =>
                      setFormCreditLimit(parseFloat(e.target.value) || 0)
                    }
                    placeholder="₹ 0.00"
                  />

                  <PremiumInput
                    label="Commission %"
                    type="number"
                    value={formComm}
                    onChange={(e) =>
                      setFormComm(parseFloat(e.target.value) || 0)
                    }
                    placeholder="3%"
                  />
                </div>
              </div>
            </div>

            <PremiumTextarea
              label={t("parties.notes")}
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
