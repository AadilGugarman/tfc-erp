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
import { formatCurrency, formatDate, todayStr } from "@/utils/formatters";
import * as db from "@/db/db";
import {
  Search,
  Plus,
  Edit2,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useShortcutAction } from "@/keyboard/shortcutManager";

export function InventoryPage() {
  const { t } = useTranslation();
  const { inventoryItems, loadInventory } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showInward, setShowInward] = useState(false);
  const [showTxn, setShowTxn] = useState(false);
  const [editItem, setEditItem] = useState<string | null>(null);
  const [txnItemId, setTxnItemId] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [inwardLoading, setInwardLoading] = useState(false);

  // Form state
  const [fName, setFName] = useState("");
  const [fGrade, setFGrade] = useState("A");
  const [fCategory, setFCategory] = useState("Fruits");
  const [fStock, setFStock] = useState(0);
  const [fUnit, setFUnit] = useState("kg");
  const [fThreshold, setFThreshold] = useState(50);
  const [fWarehouse, setFWarehouse] = useState("Main");

  // Inward state
  const [inwardItem, setInwardItem] = useState("");
  const [inwardQty, setInwardQty] = useState(0);
  const [inwardRate, setInwardRate] = useState(0);
  const [inwardNotes, setInwardNotes] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  const filtered = inventoryItems.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.grade.toLowerCase().includes(search.toLowerCase()) ||
      i.warehouse.toLowerCase().includes(search.toLowerCase()),
  );

  const statusCounts = {
    in_stock: inventoryItems.filter((i) => i.status === "in_stock").length,
    low_stock: inventoryItems.filter((i) => i.status === "low_stock").length,
    out_of_stock: inventoryItems.filter((i) => i.status === "out_of_stock")
      .length,
  };

  const openNew = () => {
    setEditItem(null);
    setFName("");
    setFGrade("A");
    setFCategory("Fruits");
    setFStock(0);
    setFUnit("kg");
    setFThreshold(50);
    setFWarehouse("Main");
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return;
    setEditItem(id);
    setFName(item.name);
    setFGrade(item.grade);
    setFCategory(item.category);
    setFStock(item.currentStock);
    setFUnit(item.unit);
    setFThreshold(item.lowStockThreshold);
    setFWarehouse(item.warehouse);
    setShowForm(true);
  };

  const handleSaveItem = async () => {
    if (!fName.trim()) {
      error("Validation Error", "Item name is required");
      return;
    }
    setSaveLoading(true);
    try {
      if (editItem) {
        db.updateInventoryItem(editItem, {
          name: fName,
          grade: fGrade,
          category: fCategory,
          currentStock: fStock,
          unit: fUnit,
          lowStockThreshold: fThreshold,
          warehouse: fWarehouse,
        });
        success("Item Updated", "Inventory item updated successfully");
      } else {
        db.createInventoryItem({
          name: fName,
          grade: fGrade,
          category: fCategory,
          currentStock: fStock,
          unit: fUnit,
          lowStockThreshold: fThreshold,
          warehouse: fWarehouse,
        });
        success("Item Created", "Inventory item added successfully");
      }
      setShowForm(false);
      loadInventory();
    } catch (err) {
      error("Error", (err as Error).message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDoInward = async () => {
    if (!inwardItem || inwardQty <= 0) {
      error("Validation Error", "Please select an item and enter a quantity");
      return;
    }
    setInwardLoading(true);
    try {
      db.addInventoryTransaction({
        itemId: inwardItem,
        itemName: inventoryItems.find((i) => i.id === inwardItem)?.name || "",
        type: "inward",
        quantity: inwardQty,
        rate: inwardRate,
        referenceType: "manual",
        referenceId: "",
        date: todayStr(),
        notes: inwardNotes,
      });
      success("Stock Added", `${inwardQty} units added to inventory`);
      setShowInward(false);
      setInwardItem("");
      setInwardQty(0);
      setInwardRate(0);
      setInwardNotes("");
      loadInventory();
    } catch (err) {
      error("Error", (err as Error).message);
    } finally {
      setInwardLoading(false);
    }
  };

  const handleOpenOutward = (itemId: string) => {
    const qty = parseFloat(prompt("Enter quantity to remove:") || "0");
    if (qty > 0) {
      const item = inventoryItems.find((i) => i.id === itemId);
      if (item) {
        try {
          db.addInventoryTransaction({
            itemId,
            itemName: item.name,
            type: "outward",
            quantity: qty,
            rate: 0,
            referenceType: "manual",
            referenceId: "",
            date: todayStr(),
            notes: "Manual outward",
          });
          success(
            "Stock Removed",
            `${qty} ${item.unit} removed from inventory`,
          );
          loadInventory();
        } catch (err) {
          error("Error", (err as Error).message);
        }
      }
    }
  };

  const txnData = txnItemId
    ? db.getInventoryTransactions(txnItemId)
    : db.getInventoryTransactions();

  useShortcutAction("new-entry", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="inventory"]')) return;
    openNew();
  });

  useShortcutAction("save", () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement?.closest('[data-entry-surface="inventory"]')) return;
    if (showForm) {
      handleSaveItem();
      return;
    }
    if (showInward) {
      handleDoInward();
    }
  });

  return (
    <PageTransition>
      <div data-entry-surface="inventory">
        <div className="space-y-3">
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    In Stock
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {statusCounts.in_stock}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <Package
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
                    Low Stock
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {statusCounts.low_stock}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <AlertCircle
                    size={24}
                    className="text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>
            </Section>

            <Section>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {statusCounts.out_of_stock}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <TrendingDown
                    size={24}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
              </div>
            </Section>
          </div>

          {/* Search */}
          <Section>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by item, grade, or warehouse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-[#2a3550] rounded-lg bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
              />
            </div>
          </Section>

          {/* Inventory Table */}
          <Section title="Items">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No inventory items found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <PremiumTableHeader>Item</PremiumTableHeader>
                      <PremiumTableHeader>Grade</PremiumTableHeader>
                      <PremiumTableHeader>Warehouse</PremiumTableHeader>
                      <PremiumTableHeader numeric>Stock</PremiumTableHeader>
                      <PremiumTableHeader>Status</PremiumTableHeader>
                      <PremiumTableHeader>Updated</PremiumTableHeader>
                      <PremiumTableHeader>Actions</PremiumTableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filtered.map((item) => (
                      <PremiumTableRow key={item.id}>
                        <PremiumTableCell className="font-medium">
                          {item.name}
                        </PremiumTableCell>
                        <PremiumTableCell>{item.grade}</PremiumTableCell>
                        <PremiumTableCell>{item.warehouse}</PremiumTableCell>
                        <PremiumTableCell numeric>
                          {item.currentStock.toLocaleString("en-IN")}{" "}
                          <span className="text-xs text-slate-500">
                            {item.unit}
                          </span>
                        </PremiumTableCell>
                        <PremiumTableCell>
                          <Badge
                            variant={
                              item.status === "in_stock"
                                ? "success"
                                : item.status === "low_stock"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {item.status === "in_stock"
                              ? "In Stock"
                              : item.status === "low_stock"
                                ? "Low"
                                : "Out"}
                          </Badge>
                        </PremiumTableCell>
                        <PremiumTableCell>
                          {formatDate(item.lastUpdated)}
                        </PremiumTableCell>
                        <PremiumTableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Edit2 size={16} />}
                              onClick={() => openEdit(item.id)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 dark:text-emerald-400"
                              icon={<ArrowUpCircle size={16} />}
                              onClick={() => {
                                setInwardItem(item.id);
                                setShowInward(true);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 dark:text-red-400"
                              icon={<ArrowDownCircle size={16} />}
                              onClick={() => handleOpenOutward(item.id)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<History size={16} />}
                              onClick={() => {
                                setTxnItemId(item.id);
                                setShowTxn(true);
                              }}
                            />
                          </div>
                        </PremiumTableCell>
                      </PremiumTableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* Add/Edit Item Modal */}
        <PremiumModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={editItem ? "Edit Item" : "Add Inventory Item"}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button loading={saveLoading} onClick={handleSaveItem}>
                {editItem ? "Update Item" : "Create Item"}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <PremiumInput
                label="Item Name *"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="e.g., કેળા"
              />
              <PremiumInput
                label="Grade"
                value={fGrade}
                onChange={(e) => setFGrade(e.target.value)}
                placeholder="A, B, C..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PremiumSelect
                label="Category"
                value={fCategory}
                onChange={(e) => setFCategory(e.target.value)}
                options={[
                  { value: "Fruits", label: "Fruits" },
                  { value: "Vegetables", label: "Vegetables" },
                  { value: "Dry Fruits", label: "Dry Fruits" },
                  { value: "Other", label: "Other" },
                ]}
              />

              <PremiumSelect
                label="Unit"
                value={fUnit}
                onChange={(e) => setFUnit(e.target.value)}
                options={[
                  { value: "kg", label: "Kg" },
                  { value: "pcs", label: "Pieces" },
                  { value: "box", label: "Box" },
                  { value: "dozen", label: "Dozen" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PremiumInput
                label="Current Stock"
                type="number"
                value={fStock}
                onChange={(e) => setFStock(parseFloat(e.target.value) || 0)}
              />
              <PremiumInput
                label="Low Stock Threshold"
                type="number"
                value={fThreshold}
                onChange={(e) => setFThreshold(parseFloat(e.target.value) || 0)}
              />
            </div>

            <PremiumInput
              label="Warehouse"
              value={fWarehouse}
              onChange={(e) => setFWarehouse(e.target.value)}
              placeholder="Main, Secondary, etc."
            />
          </div>
        </PremiumModal>

        {/* Stock Inward Modal */}
        <PremiumModal
          isOpen={showInward}
          onClose={() => setShowInward(false)}
          title="Add Stock Inward"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowInward(false)}>
                Cancel
              </Button>
              <Button loading={inwardLoading} onClick={handleDoInward}>
                Add Stock
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <PremiumSelect
              label="Item *"
              value={inwardItem}
              onChange={(e) => setInwardItem(e.target.value)}
              options={[
                { value: "", label: "Select Item..." },
                ...inventoryItems.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${i.grade}) - ${i.currentStock} ${i.unit}`,
                })),
              ]}
            />

            <PremiumInput
              label="Quantity *"
              type="number"
              value={inwardQty}
              onChange={(e) => setInwardQty(parseFloat(e.target.value) || 0)}
              error={
                inwardQty <= 0 && inwardQty !== 0
                  ? "Quantity must be greater than 0"
                  : undefined
              }
            />

            <PremiumInput
              label="Rate (per unit)"
              type="number"
              value={inwardRate}
              onChange={(e) => setInwardRate(parseFloat(e.target.value) || 0)}
              placeholder="₹ 0.00"
            />

            <PremiumTextarea
              label="Notes"
              value={inwardNotes}
              onChange={(e) => setInwardNotes(e.target.value)}
              placeholder="e.g., From which supplier or source"
              rows={3}
            />
          </div>
        </PremiumModal>

        {/* Transactions Modal */}
        <PremiumModal
          isOpen={showTxn}
          onClose={() => {
            setShowTxn(false);
            setTxnItemId("");
          }}
          title="Stock Transactions"
          size="lg"
        >
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {txnData.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No transactions
              </div>
            ) : (
              txnData
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          txn.type === "inward"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {txn.type === "inward" ? (
                          <ArrowUpCircle size={16} />
                        ) : (
                          <ArrowDownCircle size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {txn.itemName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(txn.date)} · {txn.referenceType}
                          {txn.notes ? ` · ${txn.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          txn.type === "inward"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {txn.type === "inward" ? "+" : "-"}
                        {txn.quantity}
                      </p>
                      <p className="text-xs text-slate-500">
                        @ {formatCurrency(txn.rate)}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </PremiumModal>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </PageTransition>
  );
}
