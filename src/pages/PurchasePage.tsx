import { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { PartySelect } from "@/components/PartySelect";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, todayStr } from "@/utils/formatters";
import type { Purchase, PurchaseItem, Party } from "@/db/schema";
import {
  Plus,
  Trash2,
  Printer,
  Eye,
  X,
  Search,
  ArrowLeft,
  Save,
  Clipboard,
  ShoppingCart,
  Receipt,
  User,
  Calendar,
  Layers,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/utils/cn";
import * as db from "@/db/db";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  PremiumModal,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
} from "@/components";
import type { LedgerType, PartyType } from "@/db/schema";
import { CreatePartyModal } from "@/components/CreatePartyModal";

type ViewMode = "list" | "form";

interface LineItem {
  id: string;
  fruitName: string;
  vakkal: string;
  carat: number;
  weight: number;
  rate: number;
  amount: number;
  lotNo: string;
}

const createEmptyLineItem = (id = Date.now().toString()): LineItem => ({
  id,
  fruitName: "",
  vakkal: "",
  carat: 0,
  weight: 0,
  rate: 0,
  amount: 0,
  lotNo: "",
});

export function PurchasePage() {
  const { t } = useTranslation();
  const {
    parties,
    purchases,
    currentCompanyId,
    loadParties,
    loadPurchases,
    showNotification,
    openModal,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePartyModalOpen, setIsCreatePartyModalOpen] = useState(false);

  // Form State
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [items, setItems] = useState<LineItem[]>([createEmptyLineItem()]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Credit");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadParties();
    loadPurchases();
  }, []);

  const suppliers = useMemo(() => {
    return parties.filter(
      (p) => p.partyType === "supplier" || p.partyType === "both",
    );
  }, [parties]);

  const selectedSupplier = useMemo(
    () => suppliers.find((p) => p.id === selectedSupplierId),
    [suppliers, selectedSupplierId],
  );

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.carats += Number(item.carat || 0);
        acc.weight += Number(item.weight || 0);
        acc.value += Number(item.amount || 0);
        return acc;
      },
      { carats: 0, weight: 0, value: 0 },
    );
  }, [items]);

  const finalBalance = useMemo(() => {
    const prev = selectedSupplier?.openingBalance || 0;
    return prev + totals.value - amountPaid;
  }, [selectedSupplier, totals.value, amountPaid]);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "weight" || field === "rate") {
          updated.amount =
            (Number(updated.weight) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }),
    );
  };

  const handleSave = async () => {
    if (!selectedSupplierId) {
      toast.error(t("purchaseBilling.validation.supplierRequired"));
      return;
    }

    const validItems = items.filter(
      (i) => i.fruitName.trim() && i.weight > 0 && i.rate > 0,
    );

    if (validItems.length === 0) {
      toast.error(t("purchaseBilling.validation.atLeastOneRow"));
      return;
    }

    if (!currentCompanyId) {
      toast.error("No company selected");
      return;
    }

    setIsLoading(true);
    try {
      const purchaseData: Omit<
        Purchase,
        "id" | "purchaseNo" | "createdAt" | "updatedAt"
      > = {
        date: invoiceDate,
        supplierId: selectedSupplierId,
        supplierName: selectedSupplier?.name || "",
        items: validItems.map((item) => ({
          ...item,
          id: item.id,
          grade: "A",
          boxCount: item.carat,
          weightPerBox: item.weight / (item.carat || 1),
          totalWeight: item.weight,
        })),
        subtotal: totals.value,
        commission: 0,
        taxAmount: 0,
        taxPercent: 0,
        total: totals.value,
        previousBalance: selectedSupplier?.openingBalance || 0,
        paidAmount: amountPaid,
        netBalance: finalBalance,
        notes,
        status:
          amountPaid >= totals.value
            ? "paid"
            : amountPaid > 0
              ? "partial"
              : "unpaid",
        companyId: currentCompanyId,
      };

      await db.createPurchase(purchaseData);
      toast.success(t("purchaseBilling.messages.saveSuccess"));
      setViewMode("list");
      loadPurchases();
      resetForm();
    } catch (error) {
      toast.error("Failed to save purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setInvoiceDate(todayStr());
    setSelectedSupplierId("");
    setItems([createEmptyLineItem()]);
    setAmountPaid(0);
    setPaymentMode("Credit");
    setNotes("");
  };

  const filteredPurchases = useMemo(() => {
    if (!searchTerm.trim()) return purchases;
    const q = searchTerm.toLowerCase();
    return purchases.filter(
      (b) =>
        b.purchaseNo.toLowerCase().includes(q) ||
        b.supplierName.toLowerCase().includes(q),
    );
  }, [purchases, searchTerm]);

  if (viewMode === "list") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Billing & Invoicing
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("purchaseBilling.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("purchaseBilling.description")}
            </p>
          </div>
          <Button
            variant="mandi"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setViewMode("form")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5)]"
          >
            {t("purchaseBilling.newPurchase")}
          </Button>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("purchaseBilling.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">
                    {t("purchaseBilling.purchaseNo")}
                  </th>
                  <th className="px-6 py-4">{t("purchaseBilling.date")}</th>
                  <th className="px-6 py-4">
                    {t("purchaseBilling.supplierName")}
                  </th>
                  <th className="px-6 py-4">
                    {t("purchaseBilling.purchaseValue")}
                  </th>
                  <th className="px-6 py-4">
                    {t("purchaseBilling.cashPaidToday")}
                  </th>
                  <th className="px-6 py-4">
                    {t("purchaseBilling.finalPayable")}
                  </th>
                  <th className="px-6 py-4">
                    {t("purchaseBilling.paymentMode")}
                  </th>
                  <th className="px-6 py-4 text-right">
                    {t("purchaseBilling.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {purchase.purchaseNo}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                        {purchase.date}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {purchase.supplierName}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatCurrency(purchase.total)}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-500">
                        {formatCurrency(purchase.paidAmount)}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatCurrency(purchase.netBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-500 font-bold text-[10px] uppercase">
                          {purchase.notes?.includes("Paid via")
                            ? purchase.notes.split("via ")[1]
                            : "Credit"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="soft"
                          size="sm"
                          icon={<Printer className="w-3 h-3" />}
                          className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50"
                          onClick={() =>
                            openModal("PurchaseViewer", {
                              purchase: purchase,
                              title: `Purchase Control: ${purchase.purchaseNo}`,
                              size: "xl",
                            })
                          }
                        >
                          {t("purchaseBilling.printShare")}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No purchases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Billing & Invoicing
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("purchaseBilling.title")}
          </h1>
        </div>
        <Button
          variant="soft"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => setViewMode("list")}
        >
          {t("purchaseBilling.backToLogs")}
        </Button>
      </div>

      {/* 1. Supplier Details */}
      <Card className="p-6 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <Receipt className="w-5 h-5 text-emerald-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {t("purchaseBilling.supplierPurchaseDetails")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label={t("purchaseBilling.invoiceDate")}
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            prefix={<Calendar className="w-4 h-4" />}
          />
          <div className="md:col-span-1">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-1.5">
              {t("purchaseBilling.searchSupplier")}
            </label>
            <PartySelect
              value={selectedSupplierId}
              parties={suppliers}
              onChange={setSelectedSupplierId}
              placeholder={t("purchaseBilling.selectSupplier")}
              onCreateNew={() => setIsCreatePartyModalOpen(true)}
              createLabel="+ Create Supplier"
            />
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t("purchaseBilling.previousOutstanding")}
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {selectedSupplier
                ? formatCurrency(selectedSupplier.openingBalance)
                : t("purchaseBilling.noSupplierSelected")}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Dispatch Grid */}
      <Card className="p-0 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("purchaseBilling.dispatchGrid")}
            </h2>
          </div>
          <Button
            variant="mandi"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setItems([...items, createEmptyLineItem()])}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {t("purchaseBilling.addRow")}
          </Button>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 w-12 text-center border-r border-slate-200 dark:border-slate-800">
                  #
                </th>
                <th className="px-4 py-3 min-w-[150px] border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.fruitType")}
                </th>
                <th className="px-4 py-3 min-w-[150px] border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.variety")}
                </th>
                <th className="px-4 py-3 w-24 text-center border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.caratQty")}
                </th>
                <th className="px-4 py-3 w-32 text-center border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.totalWt")}
                </th>
                <th className="px-4 py-3 w-32 text-center border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.rate")}
                </th>
                <th className="px-4 py-3 w-36 text-right border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.rowValue")}
                </th>
                <th className="px-4 py-3 min-w-[200px] border-r border-slate-200 dark:border-slate-800">
                  {t("purchaseBilling.lotDetails")}
                </th>
                <th className="px-4 py-3 w-16 text-center">
                  {t("purchaseBilling.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/5 transition-colors"
                >
                  <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-transparent outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={item.fruitName}
                      onChange={(e) =>
                        updateItem(item.id, "fruitName", e.target.value)
                      }
                      placeholder="e.g. Mango"
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-transparent outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={item.vakkal}
                      onChange={(e) =>
                        updateItem(item.id, "vakkal", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      className="w-full h-11 px-4 bg-transparent outline-none text-center focus:ring-1 focus:ring-emerald-500/50"
                      value={item.carat || ""}
                      onChange={(e) =>
                        updateItem(item.id, "carat", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      className="w-full h-11 px-4 bg-transparent outline-none text-center focus:ring-1 focus:ring-emerald-500/50"
                      value={item.weight || ""}
                      onChange={(e) =>
                        updateItem(item.id, "weight", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      className="w-full h-11 px-4 bg-transparent outline-none text-center focus:ring-1 focus:ring-emerald-500/50"
                      value={item.rate || ""}
                      onChange={(e) =>
                        updateItem(item.id, "rate", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    ₹{item.amount.toLocaleString()}
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-transparent outline-none focus:ring-1 focus:ring-emerald-500/50"
                      value={item.lotNo}
                      onChange={(e) =>
                        updateItem(item.id, "lotNo", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() =>
                        setItems(items.filter((i) => i.id !== item.id))
                      }
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/50 dark:bg-slate-900/50 font-bold border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-right text-slate-500 uppercase text-[10px] tracking-widest"
                >
                  {t("purchaseBilling.invoiceTotals")}
                </td>
                <td className="px-4 py-4 text-center">{totals.carats} C</td>
                <td className="px-4 py-4 text-center">
                  {totals.weight.toLocaleString()} kg
                </td>
                <td className="border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-4 py-4 text-right text-emerald-500 text-lg">
                  ₹{totals.value.toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 3. Financial Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("purchaseBilling.financialReconciliation")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t("purchaseBilling.prevOutstandingLabel")}
              </span>
              <p className="text-lg font-bold mt-1">
                ₹{(selectedSupplier?.openingBalance || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                {t("purchaseBilling.todayPurchaseValue")}
              </span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{totals.value.toLocaleString()}
              </p>
            </div>
            <div className="p-1">
              <Input
                label={t("purchaseBilling.amountPaidNow")}
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="text-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label={t("purchaseBilling.receiptPaymentMode")}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { value: "Credit", label: "Credit (Record on Ledger)" },
                { value: "Cash", label: "Cash" },
                { value: "UPI", label: "UPI / Digital" },
                { value: "Bank", label: "Bank Transfer" },
              ]}
            />
            <Input
              label={t("purchaseBilling.invoiceRemarks")}
              placeholder={t("purchaseBilling.remarksPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              prefix={<FileText className="w-4 h-4" />}
            />
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex flex-col justify-center items-center text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-2">
            {t("purchaseBilling.finalBalanceDue")}
          </span>
          <span className="text-4xl font-black">
            ₹{finalBalance.toLocaleString()}
          </span>
          <div className="mt-6 w-full h-px bg-white/10 dark:bg-slate-200"></div>
          <p className="mt-4 text-[10px] uppercase tracking-widest opacity-40">
            Auto-calculated Ledger Balance
          </p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-10 flex items-center justify-end gap-4 shadow-2xl">
        <Button variant="ghost" onClick={() => setViewMode("list")}>
          {t("purchaseBilling.cancelDiscard")}
        </Button>
        <Button
          variant="mandi"
          icon={<Save className="w-4 h-4" />}
          loading={isLoading}
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {t("purchaseBilling.commitSave")}
        </Button>
      </div>

      <CreatePartyModal
        isOpen={isCreatePartyModalOpen}
        onClose={() => setIsCreatePartyModalOpen(false)}
        initialType="supplier"
        onSuccess={(p) => setSelectedSupplierId(p.id)}
      />
    </div>
  );
}
