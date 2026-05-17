import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/formatters";
import * as db from "@/db/db";
import { Search, Plus, Edit2, Trash2, Phone, Mail } from "lucide-react";
import type { Supplier, LedgerType } from "@/db/schema";
import { useShortcutAction } from "@/keyboard/shortcutManager";
import { PageTransition, Section } from "@/components";

export function SuppliersPage() {
  const { t } = useTranslation();
  const { suppliers, currentCompanyId, loadSuppliers, showNotification } =
    useAppStore();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fCity, setFCity] = useState("");
  const [fState, setFState] = useState("");
  const [fOpenBal, setFOpenBal] = useState(0);
  const [fBalType, setFBalType] = useState<LedgerType>("credit");
  const [fComm, setFComm] = useState(3);
  const [fNotes, setFNotes] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search),
  );

  const resetForm = () => {
    setFName("");
    setFPhone("");
    setFEmail("");
    setFAddress("");
    setFCity("");
    setFState("");
    setFOpenBal(0);
    setFBalType("credit");
    setFComm(3);
    setFNotes("");
  };

  const openNew = () => {
    setEditSupplier(null);
    resetForm();
    setModalOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setFName(s.name);
    setFPhone(s.phone);
    setFEmail(s.email);
    setFAddress(s.address);
    setFCity(s.city);
    setFState(s.state);
    setFOpenBal(s.openingBalance);
    setFBalType(s.balanceType);
    setFComm(s.commissionPercent);
    setFNotes(s.notes);
    setModalOpen(true);
  };

  const save = () => {
    if (!fName.trim()) return;
    if (editSupplier) {
      db.updateSupplier(editSupplier.id, {
        name: fName,
        phone: fPhone,
        email: fEmail,
        address: fAddress,
        city: fCity,
        state: fState,
        openingBalance: fOpenBal,
        balanceType: fBalType,
        commissionPercent: fComm,
        notes: fNotes,
      });
      showNotification(t("messages.supplierUpdated"), "success");
    } else {
      if (!currentCompanyId) {
        showNotification("No company selected", "error");
        return;
      }
      db.createSupplier({
        name: fName,
        phone: fPhone,
        email: fEmail,
        address: fAddress,
        city: fCity,
        state: fState,
        openingBalance: fOpenBal,
        balanceType: fBalType,
        commissionPercent: fComm,
        notes: fNotes,
        companyId: currentCompanyId,
      });
      showNotification(t("messages.supplierCreated"), "success");
    }
    setModalOpen(false);
    loadSuppliers();
  };

  const deleteSupplierById = (id: string) => {
    if (confirm("Delete this supplier?")) {
      db.deleteSupplier(id);
      showNotification("Supplier deleted", "info");
      loadSuppliers();
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
    if (!activeElement?.closest('[data-entry-surface="suppliers"]')) return;
    openNew();
  });

  useShortcutAction("save", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="suppliers"]')) return;
    if (!modalOpen) return;
    save();
  });

  useShortcutAction("delete-row", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="suppliers"]')) return;
    if (modalOpen) return;
    const selected = filtered[selectedRowIndex];
    if (!selected) return;
    deleteSupplierById(selected.id);
  });

  useEffect(() => {
    const onHistoryKeyDown = (event: KeyboardEvent) => {
      if (modalOpen) return;
      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement?.closest('[data-entry-surface="suppliers"]')) return;
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
      <div data-entry-surface="suppliers">
        <Section>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-[#2a3550] rounded-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
              />
            </div>
            <Button icon={<Plus size={16} />} onClick={openNew}>
              Add Supplier
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {filtered.length} suppliers found
          </p>
        </Section>

        <Section title="All Suppliers">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No suppliers found
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#2a3550] rounded-xl overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#22304a]">
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">
                      Phone
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">
                      City
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">
                      Commission
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">
                      Balance
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-[0.06em] text-[10px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a43]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-slate-400"
                      >
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s, index) => {
                      const balance = db.getPartyBalance(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50 dark:hover:bg-[#172036] transition-colors ${index === selectedRowIndex ? "bg-blue-50/70 dark:bg-blue-950/20" : ""}`}
                        >
                          <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                            {s.name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500">
                            {s.phone || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500">
                            {s.city}
                            {s.state ? `, ${s.state}` : ""}
                          </td>
                          <td className="px-4 py-2.5 text-right tabnum text-slate-600 dark:text-slate-400">
                            {s.commissionPercent}%
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right tabnum font-semibold ${balance.type === "receivable" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {formatCurrency(balance.balance)}
                            <span className="text-[10px] font-normal ml-1 text-slate-400">
                              {balance.type === "receivable" ? "Dr" : "Cr"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#1b2335] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                onClick={() => {
                                  setSelectedRowIndex(index);
                                  openEdit(s);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"
                                onClick={() => {
                                  setSelectedRowIndex(index);
                                  deleteSupplierById(s.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editSupplier ? "Edit Supplier" : "Add Supplier"}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Name *"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder="Enter supplier name"
            />
            <Input
              label="Phone"
              value={fPhone}
              onChange={(e) => setFPhone(e.target.value)}
            />
            <Input
              label="Email"
              value={fEmail}
              onChange={(e) => setFEmail(e.target.value)}
            />
            <TextArea
              label="Address"
              value={fAddress}
              onChange={(e) => setFAddress(e.target.value)}
            />
            <Input
              label="City"
              value={fCity}
              onChange={(e) => setFCity(e.target.value)}
            />
            <Input
              label="State"
              value={fState}
              onChange={(e) => setFState(e.target.value)}
            />
            <Select
              label="Balance Type"
              value={fBalType}
              onChange={(e) => setFBalType(e.target.value as LedgerType)}
              options={[
                { value: "debit", label: "Debit (They owe us)" },
                { value: "credit", label: "Credit (We owe them)" },
              ]}
            />
            <Input
              label="Opening Balance"
              type="number"
              value={fOpenBal}
              onChange={(e) => setFOpenBal(parseFloat(e.target.value) || 0)}
              prefix="₹"
            />
            <Input
              label="Commission %"
              type="number"
              value={fComm}
              onChange={(e) => setFComm(parseFloat(e.target.value) || 0)}
              suffix="%"
            />
            <TextArea
              label="Notes"
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editSupplier ? "Update" : "Create"}</Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
