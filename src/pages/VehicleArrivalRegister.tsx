import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, todayStr } from "@/utils/formatters";
import * as db from "@/db/db";
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  Filter,
  PackageCheck,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  partyId: string;
  partyName: string;
  fruitName: string;
  vakkal: string;
  carat: number;
  weight: number;
  rate: number;
  commission: number;
  hamali: number;
  remarks: string;
  inventoryItemId?: string;
};

const blank = (id: string): Row => ({
  id,
  partyId: "",
  partyName: "",
  fruitName: "",
  vakkal: "",
  carat: 0,
  weight: 0,
  rate: 0,
  commission: 0,
  hamali: 0,
  remarks: "",
  inventoryItemId: undefined,
});

const cols: {
  key: keyof Row;
  label: string;
  guj: string;
  numeric?: boolean;
}[] = [
  { key: "partyName", label: "Party Name", guj: "પાર્ટી નામ" },
  { key: "fruitName", label: "Fruit Item", guj: "ફલ", numeric: false },
  { key: "vakkal", label: "Vakkal", guj: "વક્કલ" },
  { key: "carat", label: "Carat", guj: "કેરેટ", numeric: true },
  { key: "weight", label: "Weight (kg)", guj: "વજન", numeric: true },
  { key: "rate", label: "Rate (₹)", guj: "ભાવ", numeric: true },
  { key: "commission", label: "Commission", guj: "કમીશન", numeric: true },
  { key: "hamali", label: "Hamali", guj: "હમાલી", numeric: true },
  { key: "remarks", label: "Remarks", guj: "નોંધ" },
];

export function VehicleArrivalRegisterPage() {
  const {
    parties,
    inventoryItems,
    vehicleRegisters,
    loadParties,
    loadInventory,
    loadVehicleRegisters,
    showNotification,
  } = useAppStore();

  const [tab, setTab] = useState<"register" | "inventory" | "reports">(
    "register",
  );
  const [date, setDate] = useState(todayStr());
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Draft");
  const [rows, setRows] = useState<Row[]>([blank("1")]);
  const gridRef = useRef<HTMLDivElement>(null);

  const entryTotal = useMemo(() => {
    return rows.reduce((sum, row) => {
      const base = row.carat * row.weight * row.rate;
      return sum + base + row.commission + row.hamali;
    }, 0);
  }, [rows]);

  const entryWeight = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.weight || 0), 0);
  }, [rows]);

  const nextEntryNo = useMemo(
    () => db.getNextVehicleEntryNo(),
    [vehicleRegisters],
  );

  useEffect(() => {
    loadParties();
    loadInventory();
    loadVehicleRegisters();
  }, []);

  const updateRow = (i: number, k: keyof Row, v: string | number) => {
    setRows((prev) => {
      const n = [...prev];
      if (k === "partyId") {
        const party = parties.find((p) => p.id === String(v));
        (n[i] as any).partyName = party?.name || "";
        (n[i] as any)[k] = v;
      } else if (k === "inventoryItemId") {
        const item = inventoryItems.find((i) => i.id === String(v));
        if (item) {
          (n[i] as any).fruitName = item.name;
        }
        (n[i] as any)[k] = v;
      } else {
        (n[i] as any)[k] = cols.find((c) => c.key === k)?.numeric
          ? Number(v)
          : v;
      }
      return n;
    });
  };

  const addRow = () => {
    setRows((p) => [...p, blank(Date.now().toString())]);
    setTimeout(() => focus(rows.length, 0), 30);
  };

  const delRow = (i: number) => setRows((p) => p.filter((_, idx) => idx !== i));

  const focus = (r: number, c: number) => {
    const el = gridRef.current?.querySelector<HTMLInputElement>(
      `[data-r="${r}"][data-c="${c}"]`,
    );
    el?.focus();
    el?.select();
  };

  const onKey = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const lastC = c === cols.length - 1,
        lastR = r === rows.length - 1;
      if (lastC && lastR) {
        addRow();
        return;
      }
      focus(lastC ? r + 1 : r, lastC ? 0 : c + 1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focus(Math.min(r + 1, rows.length - 1), c);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focus(Math.max(r - 1, 0), c);
    }
  };

  const saveVehicleRegister = () => {
    if (!vehicleNumber.trim()) {
      showNotification("Vehicle number is required", "error");
      toast.error("Vehicle number is required");
      return;
    }

    const validRows = rows.filter(
      (row) => row.fruitName.trim() && row.weight > 0 && row.rate > 0,
    );
    if (validRows.length === 0) {
      showNotification(
        "Add at least one valid row with item, weight and rate",
        "error",
      );
      toast.error("Add at least one valid row with item, weight and rate");
      return;
    }

    try {
      const saved = db.createVehicleRegister({
        date,
        vehicleNumber,
        driverName,
        brokerName,
        arrivalTime,
        status: "posted",
        rows: validRows.map((row) => ({
          lotNo: "",
          partyId: row.partyId || undefined,
          partyName: row.partyName,
          fruitName: row.fruitName,
          vakkal: row.vakkal,
          boxes: 0,
          carat: row.carat,
          weight: row.weight,
          rate: row.rate,
          commission: row.commission,
          hamali: row.hamali,
          remarks: row.remarks,
          inventoryItemId: row.inventoryItemId,
        })),
        pendingAmount: entryTotal,
        outstandingBalance: entryTotal,
        notes,
      });

      setStatus("Saved");
      toast.success(`Vehicle entry ${saved.entryNo} saved!`);
      showNotification(`Vehicle entry ${saved.entryNo} saved`, "success");
      loadVehicleRegisters();
      loadInventory();
      resetForm();
    } catch (error) {
      const msg = (error as Error).message || "Failed to save vehicle register";
      showNotification(msg, "error");
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setDate(todayStr());
    setVehicleNumber("");
    setDriverName("");
    setBrokerName("");
    setArrivalTime("");
    setNotes("");
    setStatus("Draft");
    setRows([blank("1")]);
  };

  const fmt = (n: number) => formatCurrency(n);

  const tabs: [typeof tab, string][] = [
    ["register", "📋 Register Entry"],
    ["inventory", "📦 Inventory Link"],
    ["reports", "📊 Vehicle Report"],
  ];

  return (
    <div className="space-y-3">
      {/* ── TABS ── */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition
              ${
                tab === k
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── REGISTER ── */}
      {tab === "register" && (
        <div className="space-y-4">
          {/* Header fields */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <HeaderField
              icon={<CalendarDays className="w-4 h-4" />}
              label="Date"
              guj="તારીખ"
              type="date"
              value={date}
              onChange={setDate}
            />
            <HeaderField
              icon={<Truck className="w-4 h-4" />}
              label="Vehicle Number"
              guj="વાહન નંબર"
              value={vehicleNumber}
              onChange={setVehicleNumber}
            />
            <HeaderField
              icon={<Users className="w-4 h-4" />}
              label="Driver Name"
              guj="ડ્રાઇવર"
              value={driverName}
              onChange={setDriverName}
            />
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-400">
                Entry Number
              </p>
              <div className="mt-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2">
                <span className="font-extrabold text-blue-700 dark:text-blue-300">
                  {nextEntryNo}
                </span>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    status === "Saved"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="font-bold text-base">Digital Register Page</h2>
                <p className="text-xs text-gray-400">
                  Tab / Enter → next cell · Last cell → new row · Arrow keys ↑↓
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" /> Add Row
                </button>
                <button
                  onClick={saveVehicleRegister}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow"
                >
                  <Save className="w-4 h-4" /> Save Entry
                </button>
              </div>
            </div>

            <div
              ref={gridRef}
              className="overflow-auto"
              style={{ maxHeight: "52vh" }}
            >
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left w-10">
                      #
                    </th>
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        className="border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left min-w-[100px]"
                      >
                        {c.label}{" "}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">
                          {c.guj}
                        </span>
                      </th>
                    ))}
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-right min-w-[110px]">
                      Total
                    </th>
                    <th className="border border-gray-200 dark:border-gray-700 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr
                      key={row.id}
                      className={
                        ri % 2 === 0
                          ? "bg-white dark:bg-gray-800"
                          : "bg-gray-50/70 dark:bg-gray-800/60"
                      }
                    >
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-1 text-gray-400 text-center font-mono text-xs">
                        {ri + 1}
                      </td>
                      {cols.map((c, ci) => (
                        <td
                          key={c.key}
                          className="border border-gray-200 dark:border-gray-700 p-0"
                        >
                          {c.key === "partyName" ? (
                            <PartySelect
                              value={row.partyId}
                              parties={parties}
                              onChange={(v) => updateRow(ri, "partyId", v)}
                              onKeyDown={(e) => onKey(e, ri, ci)}
                              dataR={ri}
                              dataC={ci}
                            />
                          ) : c.key === "fruitName" ? (
                            <FruitSelect
                              value={row.inventoryItemId || ""}
                              items={inventoryItems}
                              onChange={(v) =>
                                updateRow(ri, "inventoryItemId", v)
                              }
                              onKeyDown={(e) => onKey(e, ri, ci)}
                              dataR={ri}
                              dataC={ci}
                            />
                          ) : (
                            <input
                              data-r={ri}
                              data-c={ci}
                              type={c.numeric ? "number" : "text"}
                              value={row[c.key]}
                              onChange={(e) =>
                                updateRow(ri, c.key, e.target.value)
                              }
                              onKeyDown={(e) => onKey(e, ri, ci)}
                              className="w-full h-11 px-3 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                              style={{
                                minWidth: c.key === "remarks" ? 150 : 90,
                              }}
                            />
                          )}
                        </td>
                      ))}
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-1 text-right font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        {fmt(
                          row.weight * row.rate + row.commission + row.hamali,
                        )}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-1 text-center">
                        <button
                          onClick={() => delRow(ri)}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary footer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <SummaryCard
                label="Total Weight"
                value={entryWeight.toLocaleString("en-IN") + " kg"}
              />
              <SummaryCard label="Total Rows" value={String(rows.length)} />
              <SummaryCard label="Grand Total" value={fmt(entryTotal)} accent />
              <SummaryCard
                label="Pending"
                value={fmt(entryTotal * 0.28)}
                warn
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-xs font-bold uppercase text-gray-400">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this vehicle entry..."
              className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* ── INVENTORY ── */}
      {tab === "inventory" && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3 mb-5">
              <PackageCheck className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold">Inventory Integration</h2>
                <p className="text-xs text-gray-400">
                  Vehicle entry auto-maps stock inward/outward.
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    {["Item", "Available", "Vehicle Deduct", "Balance"].map(
                      (h) => (
                        <th key={h} className="p-3 text-left font-semibold">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inventoryItems.map((item) => {
                    const deducted = rows
                      .filter((r) => r.inventoryItemId === item.id)
                      .reduce((s, r) => s + r.weight, 0);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3 text-right">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right text-red-600 font-semibold">
                          −{deducted.toFixed(2)} {item.unit}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {(item.quantity - deducted).toFixed(2)} {item.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-bold">Linked Vehicle</h3>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
              {vehicleNumber || "N/A"}
            </p>
            <SummaryCard
              label="Stock Movement"
              value={entryWeight.toLocaleString("en-IN") + " kg"}
            />
            <SummaryCard label="Inventory Value" value={fmt(entryTotal)} />
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-700 dark:text-green-300 font-medium">
              ✅ Auto deduction is enabled after you click "Save Entry".
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === "reports" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold">Vehicle-wise Report</h2>
              <p className="text-xs text-gray-400">
                Daily/monthly vehicle summary with export.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-semibold">
                <Filter className="inline w-4 h-4 mr-1" />
                Filter
              </button>
              <button className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold">
                <Download className="inline w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  {["Entry", "Vehicle", "Weight", "Amount", "Status"].map(
                    (h) => (
                      <th key={h} className="p-3 text-left font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {vehicleRegisters
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="p-3 font-mono text-xs">{e.entryNo}</td>
                      <td className="p-3 font-bold">{e.vehicleNumber}</td>
                      <td className="p-3">
                        {e.rows.reduce((s, r) => s + r.weight, 0).toFixed(2)} kg
                      </td>
                      <td className="p-3 font-bold text-blue-700 dark:text-blue-300">
                        {fmt(e.grandTotal)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            e.status === "posted"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── small components ── */
function HeaderField({
  icon,
  label,
  guj,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  guj: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="text-[11px] font-bold uppercase text-gray-400">
        {label}
      </span>
      <span className="ml-1.5 text-[10px] text-gray-300">{guj}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
        <span className="text-gray-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <p className="text-[11px] font-bold uppercase text-gray-400">{label}</p>
      <p
        className={`mt-0.5 text-lg font-extrabold ${
          accent
            ? "text-blue-700 dark:text-blue-300"
            : warn
              ? "text-amber-600"
              : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PartySelect({
  value,
  parties,
  onChange,
  onKeyDown,
  dataR,
  dataC,
}: {
  value: string;
  parties: any[];
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  dataR: number;
  dataC: number;
}) {
  return (
    <select
      data-r={dataR}
      data-c={dataC}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="w-full h-11 px-3 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:ring-2 focus:ring-inset focus:ring-blue-500"
    >
      <option value="">-- Select Party --</option>
      {parties.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

function FruitSelect({
  value,
  items,
  onChange,
  onKeyDown,
  dataR,
  dataC,
}: {
  value: string;
  items: any[];
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  dataR: number;
  dataC: number;
}) {
  return (
    <select
      data-r={dataR}
      data-c={dataC}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="w-full h-11 px-3 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:ring-2 focus:ring-inset focus:ring-blue-500"
    >
      <option value="">-- Select Item --</option>
      {items.map((i) => (
        <option key={i.id} value={i.id}>
          {i.name}
        </option>
      ))}
    </select>
  );
}
