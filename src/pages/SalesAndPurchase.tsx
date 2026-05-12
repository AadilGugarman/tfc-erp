import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, todayStr } from "@/utils/formatters";
import type { Bill, BillItem, Purchase, PurchaseItem } from "@/db/schema";
import { Plus, Trash2, Printer, Eye, X, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import * as db from "@/db/db";

type TabType = "sales" | "purchase";
type ViewMode = "list" | "form";

interface LineItem {
  id: string;
  itemName: string;
  lotNo: string;
  crate: number;
  weight: number;
  rate: number;
  amount: number;
}

interface FormData {
  invoiceNo: string;
  date: string;
  partyId: string;
  vehicleNo: string;
  lrNo: string;
  paymentType: "cash" | "credit" | "bank" | "upi";
  items: LineItem[];
  previousBalance: number;
  notes: string;
}

function getNextInvoiceNo(isSales: boolean): string {
  if (isSales) {
    return db.getNextBillNo?.() || `BILL-${Date.now()}`;
  }
  return db.getNextPurchaseNo?.() || `PO-${Date.now()}`;
}

function createEmptyLineItem(
  id = `item-${Date.now()}-${Math.random()}`,
): LineItem {
  return {
    id,
    itemName: "",
    lotNo: "",
    crate: 0,
    weight: 0,
    rate: 0,
    amount: 0,
  };
}

export function SalesAndPurchasePage() {
  const {
    parties,
    suppliers,
    bills,
    purchases,
    loadParties,
    loadSuppliers,
    loadBills,
    loadPurchases,
    invoiceCreationMode,
    setInvoiceCreationMode,
    showNotification,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>("sales");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    invoiceNo: getNextInvoiceNo(true),
    date: todayStr(),
    partyId: "",
    vehicleNo: "",
    lrNo: "",
    paymentType: "cash",
    items: [createEmptyLineItem()],
    previousBalance: 0,
    notes: "",
  });

  // Initialize data
  useEffect(() => {
    loadParties();
    loadSuppliers();
    loadBills();
    loadPurchases();

    // Check if a specific mode was requested from QuickActions
    if (invoiceCreationMode) {
      setActiveTab(invoiceCreationMode as TabType);
      setViewMode("form");
      setInvoiceCreationMode(null); // Clear the mode after use
    }
  }, [invoiceCreationMode]);

  // Get current party/supplier
  const currentPartyList = activeTab === "sales" ? parties : suppliers;
  const selectedParty = currentPartyList.find((p) => p.id === formData.partyId);

  // Filter parties based on search
  const filteredParties = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return currentPartyList.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q),
    );
  }, [searchTerm, currentPartyList]);

  // Calculate totals
  const itemsTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = itemsTotal;
  const netBalance = (selectedParty?.openingBalance || 0) + grandTotal;

  // Handle party selection
  const handlePartySelect = (partyId: string) => {
    setFormData((prev) => ({ ...prev, partyId }));
    setShowPartyDropdown(false);
    setSearchTerm("");
  };

  // Handle line item change
  const handleItemChange = (
    itemId: string,
    field: keyof LineItem,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const updated = {
          ...item,
          [field]:
            field === "itemName" || field === "lotNo"
              ? value
              : parseFloat(value) || 0,
        };

        // Auto-calculate amount when weight or rate changes
        if (field === "weight" || field === "rate") {
          updated.amount = updated.weight * updated.rate;
        }

        return updated;
      }),
    }));
  };

  // Add line item
  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyLineItem()],
    }));
  };

  // Remove line item
  const removeLineItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Save bill/purchase
  const handleSave = (mode: "draft" | "save" | "print") => {
    if (!formData.partyId) {
      showNotification("Please select a party/supplier", "error");
      return;
    }

    if (formData.items.some((item) => !item.itemName || item.amount <= 0)) {
      showNotification("Please fill all items correctly", "error");
      return;
    }

    if (activeTab === "sales") {
      const billItems: BillItem[] = formData.items.map((item) => ({
        id: item.id,
        fruitName: item.itemName,
        grade: "A",
        boxCount: Math.round(item.crate),
        weightPerBox: item.weight / Math.max(item.crate, 1),
        totalWeight: item.weight,
        rate: item.rate,
        amount: item.amount,
        lotNo: item.lotNo,
      }));

      const billData: Omit<Bill, "id" | "billNo" | "createdAt" | "updatedAt"> =
        {
          date: formData.date,
          partyId: formData.partyId,
          partyName: selectedParty?.name || "",
          items: billItems,
          subtotal: itemsTotal,
          commission: 0,
          taxAmount: 0,
          taxPercent: 0,
          total: grandTotal,
          previousBalance: selectedParty?.openingBalance || 0,
          paidAmount: 0,
          netBalance: netBalance,
          notes: formData.notes,
          status: "unpaid",
        };

      const result = db.createBill(billData);
      showNotification("Bill saved successfully!", "success");

      if (mode === "print") {
        handlePrint(result.bill);
      }
    } else {
      const purchaseItems: PurchaseItem[] = formData.items.map((item) => ({
        id: item.id,
        fruitName: item.itemName,
        grade: "A",
        quantity: item.weight,
        unit: "kg",
        rate: item.rate,
        amount: item.amount,
        lotNo: item.lotNo,
      }));

      const purchaseData: Omit<
        Purchase,
        "id" | "purchaseNo" | "createdAt" | "updatedAt"
      > = {
        date: formData.date,
        supplierId: formData.partyId,
        supplierName: selectedParty?.name || "",
        items: purchaseItems,
        subtotal: itemsTotal,
        taxAmount: 0,
        total: grandTotal,
        paidAmount: 0,
        netBalance: netBalance,
        notes: formData.notes,
        status: "unpaid",
      };

      const result = db.createPurchase(purchaseData);
      showNotification("Purchase order saved successfully!", "success");

      if (mode === "print") {
        handlePrint(result.purchase);
      }
    }

    // Reset form
    setFormData({
      invoiceNo: getNextInvoiceNo(activeTab === "sales"),
      date: todayStr(),
      partyId: "",
      vehicleNo: "",
      lrNo: "",
      paymentType: "cash",
      items: [createEmptyLineItem()],
      previousBalance: 0,
      notes: "",
    });

    loadBills();
    loadPurchases();
    setViewMode("list");
  };

  // Print bill
  const handlePrint = (bill: Bill | Purchase) => {
    const isBill = "partyName" in bill;
    const w = window.open("", "_blank", "width=960,height=720");
    if (!w) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${isBill ? (bill as Bill).billNo : (bill as Purchase).purchaseNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 15px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .info-row { display: flex; gap: 40px; margin-bottom: 20px; font-size: 13px; }
          .info-col { flex: 1; }
          .info-col strong { display: block; color: #333; margin-bottom: 3px; }
          .info-col span { color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
          table th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
          table td { padding: 10px; border: 1px solid #ddd; }
          table tr:nth-child(even) { background: #fafafa; }
          .totals { text-align: right; margin-top: 20px; font-size: 14px; }
          .totals p { margin: 8px 0; }
          .totals .grand { font-size: 18px; font-weight: bold; padding-top: 10px; border-top: 2px solid #333; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
          @media print { body { background: white; } .container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isBill ? "SALES BILL" : "PURCHASE ORDER"}</h1>
            <p>Talha Fruit Co. - Mandi Operations</p>
          </div>

          <div class="info-row">
            <div class="info-col">
              <strong>Invoice No:</strong>
              <span>${isBill ? (bill as Bill).billNo : (bill as Purchase).purchaseNo}</span>
            </div>
            <div class="info-col">
              <strong>Date:</strong>
              <span>${formatDate(bill.date)}</span>
            </div>
            <div class="info-col">
              <strong>Party:</strong>
              <span>${isBill ? (bill as Bill).partyName : (bill as Purchase).supplierName}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Lot No</th>
                <th style="text-align: right;">Weight (kg)</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map((item) => {
                  const weight =
                    "totalWeight" in item
                      ? (item as BillItem).totalWeight
                      : (item as PurchaseItem).quantity || 0;
                  return `
                <tr>
                  <td>${item.fruitName}</td>
                  <td>${item.lotNo}</td>
                  <td style="text-align: right;">${weight.toFixed(2)}</td>
                  <td style="text-align: right;">${formatCurrency(item.rate)}</td>
                  <td style="text-align: right;">${formatCurrency(item.amount)}</td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <p><strong>Total Amount:</strong> ${formatCurrency(bill.total)}</p>
            ${(bill as any).previousBalance ? `<p><strong>Previous Balance:</strong> ${formatCurrency((bill as any).previousBalance)}</p>` : ""}
            <p class="grand"><strong>Net Balance:</strong> ${formatCurrency(bill.netBalance)}</p>
          </div>

          ${bill.notes ? `<p style="margin-top: 20px; font-size: 12px;"><strong>Notes:</strong> ${bill.notes}</p>` : ""}

          <div class="footer">
            <p>Generated from ERP System</p>
            <p>This is a computer-generated bill</p>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    w.document.write(content);
    w.document.close();
  };

  // Listing view
  const currentList = activeTab === "sales" ? bills : purchases;
  const filteredList = currentList.filter((item) => {
    const q = searchTerm.toLowerCase();
    const no =
      activeTab === "sales"
        ? (item as Bill).billNo
        : (item as Purchase).purchaseNo;
    const party =
      activeTab === "sales"
        ? (item as Bill).partyName
        : (item as Purchase).supplierName;
    return no.toLowerCase().includes(q) || party.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {viewMode === "list" ? (
        // LIST VIEW
        <div className="space-y-4">
          {/* Tabs & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab("sales");
                  setSearchTerm("");
                }}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === "sales"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300",
                )}
              >
                Sales Bills
              </button>
              <button
                onClick={() => {
                  setActiveTab("purchase");
                  setSearchTerm("");
                }}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === "purchase"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300",
                )}
              >
                Purchase Orders
              </button>
            </div>

            <Button
              onClick={() => {
                setViewMode("form");
                setFormData({
                  ...formData,
                  invoiceNo: getNextInvoiceNo(activeTab === "sales"),
                });
              }}
            >
              <Plus className="h-4 w-4" /> New{" "}
              {activeTab === "sales" ? "Sale" : "Purchase"}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number or party name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-semibold">
                    Invoice No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Party</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Vehicle No
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Payment Type
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No{" "}
                      {activeTab === "sales"
                        ? "sales bills"
                        : "purchase orders"}{" "}
                      found
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const isBill = activeTab === "sales";
                    const invoiceNo = isBill
                      ? (item as Bill).billNo
                      : (item as Purchase).purchaseNo;
                    const partyName = isBill
                      ? (item as Bill).partyName
                      : (item as Purchase).supplierName;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-semibold">
                          {invoiceNo}
                        </td>
                        <td className="px-4 py-3">{formatDate(item.date)}</td>
                        <td className="px-4 py-3">{partyName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          -
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">Cash</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              item.status === "paid"
                                ? "success"
                                : item.status === "partial"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handlePrint(item as any)}
                              title="Print"
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                            >
                              <Printer className="h-4 w-4 text-blue-600" />
                            </button>
                            <button
                              title="View"
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors opacity-50 cursor-not-allowed"
                            >
                              <Eye className="h-4 w-4" />
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
        </div>
      ) : (
        // FORM VIEW
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <X className="h-4 w-4" /> Back to List
          </button>

          {/* Invoice Header */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-xl font-bold">
              New {activeTab === "sales" ? "Sales Bill" : "Purchase Order"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            {/* Party Selection */}
            <div className="relative">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {activeTab === "sales" ? "Customer" : "Supplier"} *
              </label>
              <div className="mt-1 relative">
                <div
                  onClick={() => setShowPartyDropdown(!showPartyDropdown)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 cursor-pointer flex items-center justify-between"
                >
                  <span>{selectedParty?.name || "Select a party..."}</span>
                </div>

                {showPartyDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50">
                    <input
                      type="text"
                      placeholder="Search party..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border-b border-slate-300 dark:border-slate-600"
                      autoFocus
                    />
                    <div className="max-h-48 overflow-y-auto">
                      {filteredParties.map((party) => (
                        <div
                          key={party.id}
                          onClick={() => handlePartySelect(party.id)}
                          className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer border-b border-slate-200 dark:border-slate-700"
                        >
                          <div className="font-medium">{party.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {party.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Party Details */}
              {selectedParty && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm space-y-1">
                  <div>
                    <strong>Phone:</strong> {selectedParty.phone}
                  </div>
                  <div>
                    <strong>City:</strong> {selectedParty.city}
                  </div>
                  <div>
                    <strong>GST:</strong>{" "}
                    {(selectedParty as any).gstin || "N/A"}
                  </div>
                  <div>
                    <strong>Balance:</strong>{" "}
                    {formatCurrency(selectedParty.openingBalance)}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehicleNo: e.target.value,
                    }))
                  }
                  placeholder="e.g., GJ-01-AB-1234"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  LR Number
                </label>
                <input
                  type="text"
                  value={formData.lrNo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lrNo: e.target.value }))
                  }
                  placeholder="Lorry Receipt No"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Payment Type
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentType: e.target.value as any,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="bank">Bank</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button size="sm" onClick={addLineItem}>
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                    <th className="px-3 py-2 text-left">Item Name</th>
                    <th className="px-3 py-2 text-left">Lot No</th>
                    <th className="px-3 py-2 text-right">Crate</th>
                    <th className="px-3 py-2 text-right">Weight (kg)</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "itemName",
                              e.target.value,
                            )
                          }
                          placeholder="Mango, Apple, etc"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.lotNo}
                          onChange={(e) =>
                            handleItemChange(item.id, "lotNo", e.target.value)
                          }
                          placeholder="Lot"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.crate || ""}
                          onChange={(e) =>
                            handleItemChange(item.id, "crate", e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.weight || ""}
                          onChange={(e) =>
                            handleItemChange(item.id, "weight", e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) =>
                            handleItemChange(item.id, "rate", e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes */}
          <div className="grid grid-cols-2 gap-4">
            {/* Notes */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any additional notes..."
                rows={4}
                className="w-full mt-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>

            {/* Totals */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>

              <div className="flex justify-between items-center pb-2 border-b border-slate-300 dark:border-slate-600">
                <span className="text-slate-600 dark:text-slate-400">
                  Items Total:
                </span>
                <span className="font-mono text-lg">
                  {formatCurrency(itemsTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-300 dark:border-slate-600">
                <span className="text-slate-600 dark:text-slate-400">
                  Previous Balance:
                </span>
                <span className="font-mono">
                  {formatCurrency(selectedParty?.openingBalance || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t-2 border-slate-300 dark:border-slate-600">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t-2 border-slate-300 dark:border-slate-600">
                <span>Net Balance:</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  {formatCurrency(netBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setViewMode("list")}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleSave("draft")}>
              Save Draft
            </Button>
            <Button onClick={() => handleSave("save")}>Save Bill</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleSave("print")}
            >
              Save & Print
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
