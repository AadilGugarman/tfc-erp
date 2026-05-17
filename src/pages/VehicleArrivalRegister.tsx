import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { formatCurrency, todayStr } from "@/utils/formatters";
import * as db from "@/db/db";
import {
  CalendarDays,
  Plus,
  Trash2,
  Truck,
  Search,
  ArrowLeft,
  Clipboard,
  Save,
  Clock,
  Scale,
  Layers,
  X,
  RotateCcw,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

type Row = {
  id: string;
  partyId: string;
  partyName: string;
  fruitName: string; // Added fruitName
  lotNo: string;
  vakkal: string;
  boxes: number;
  carat: number;
  weight: number;
  rate: number;
  commission: number;
  hamali: number;
  total: number;
  remarks: string;
};

const blank = (id: string): Row => ({
  id,
  partyId: "",
  partyName: "",
  fruitName: "",
  lotNo: "",
  vakkal: "",
  boxes: 0,
  carat: 0,
  weight: 0,
  rate: 0,
  commission: 0,
  hamali: 0,
  total: 0,
  remarks: "",
});

const StringWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{String(children || "")}</>;
};

export function VehicleArrivalRegisterPage() {
  const { t } = useTranslation();
  const { parties, loadParties, currentCompanyId } = useAppStore();

  const [view, setView] = useState<"list" | "form">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [registers, setRegisters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<any>(null);

  // Form State
  const [date, setDate] = useState(todayStr());
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [scaleWeight, setScaleWeight] = useState<number>(0);
  const [fruitTypeCategory, setFruitTypeCategory] = useState("Mango");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([blank("1")]);

  useEffect(() => {
    loadParties();
    loadRegisters();
  }, [loadParties]);

  const loadRegisters = async () => {
    if (!currentCompanyId) return;
    try {
      const data = await db.getVehicleRegistersByCompany(currentCompanyId);
      setRegisters(data);
    } catch (error) {
      console.error("Failed to load registers:", error);
    }
  };

  const dayOfWeek = useMemo(() => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
      new Date(date),
    );
  }, [date]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.weight += Number(row.weight || 0);
        acc.boxes += Number(row.boxes || 0);
        acc.carat += Number(row.carat || 0);
        acc.cost += Number(row.total || 0);
        return acc;
      },
      { weight: 0, boxes: 0, carat: 0, cost: 0 },
    );
  }, [rows]);

  const updateRow = (i: number, k: keyof Row, v: any) => {
    setRows((prev) => {
      const n = [...prev];
      const row = { ...n[i] };

      if (k === "partyId") {
        const party = parties.find((p) => p.id === String(v));
        row.partyName = party?.name || "";
        row.partyId = v;
      } else {
        (row as any)[k] = v;
      }

      // Recalculate total if weight or rate changes
      if (k === "weight" || k === "rate") {
        const w = k === "weight" ? Number(v) : row.weight;
        const r = k === "rate" ? Number(v) : row.rate;
        row.total = w * r;
      }

      n[i] = row;
      return n;
    });
  };

  const addRow = () => {
    setRows((p) => [...p, blank(Date.now().toString())]);
  };

  const delRow = (i: number) => {
    if (rows.length > 1) {
      setRows((p) => p.filter((_, idx) => idx !== i));
    } else {
      setRows([blank(Date.now().toString())]);
    }
  };

  const saveVehicleRegister = async () => {
    if (!vehicleNumber.trim()) {
      toast.error(
        t(
          "vehicleArrival.validation.vehicleNoRequired",
          "Vehicle number is required",
        ),
      );
      return;
    }

    const validRows = rows.filter(
      (row) => row.partyName.trim() && row.weight > 0 && row.rate > 0,
    );
    if (validRows.length === 0) {
      toast.error(
        t(
          "vehicleArrival.validation.atLeastOneRow",
          "Add at least one valid row with party, weight and rate",
        ),
      );
      return;
    }

    if (!currentCompanyId) {
      toast.error("No company selected");
      return;
    }

    setIsLoading(true);
    try {
      await db.createVehicleRegister({
        date,
        dayOfWeek,
        vehicleNumber,
        driverName,
        brokerName,
        arrivalTime,
        vehicleDescription,
        scaleWeight,
        fruitTypeCategory,
        status: "posted",
        rows: validRows.map((row) => ({
          partyId: row.partyId,
          partyName: row.partyName,
          fruitName: row.fruitName || fruitTypeCategory, // Ensure fruitName is set
          lotNo: row.lotNo,
          vakkal: row.vakkal,
          boxes: row.boxes,
          carat: row.carat,
          weight: row.weight,
          rate: row.rate,
          commission: row.commission,
          hamali: row.hamali,
          total: row.total,
          remarks: row.remarks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        totalRows: validRows.length,
        totalWeight: totals.weight,
        totalBoxes: totals.boxes,
        totalCarats: totals.carat,
        grandTotal: totals.cost,
        pendingAmount: totals.cost,
        outstandingBalance: totals.cost,
        notes,
        companyId: currentCompanyId,
      });

      toast.success(
        t(
          "vehicleArrival.messages.saveSuccess",
          "Vehicle arrival recorded successfully",
        ),
      );
      resetForm();
      setView("list");
      loadRegisters();
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to save vehicle register",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDate(todayStr());
    setVehicleNumber("");
    setDriverName("");
    setBrokerName("");
    setArrivalTime("");
    setVehicleDescription("");
    setScaleWeight(0);
    setFruitTypeCategory("Mango");
    setNotes("");
    setRows([blank("1")]);
  };

  const handlePasteFromExcel = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) return;

      const newRows = lines.map((line, idx) => {
        const parts = line.split("\t");
        return {
          ...blank(`pasted-${Date.now()}-${idx}`),
          partyName: parts[0] || "",
          vakkal: parts[1] || "",
          fruitName: fruitTypeCategory, // Set fruitName from category
          carat: Number(parts[2]) || 0,
          weight: Number(parts[3]) || 0,
          rate: Number(parts[4]) || 0,
          total: (Number(parts[3]) || 0) * (Number(parts[4]) || 0),
          remarks: parts[5] || "",
        };
      });

      setRows((prev) => {
        const filtered = prev.filter((r) => r.partyName || r.weight || r.rate);
        return [...filtered, ...newRows];
      });
      toast.success("Data pasted from Excel");
    } catch (error) {
      toast.error("Failed to read clipboard");
    }
  };

  const filteredRegisters = useMemo(() => {
    if (!searchQuery.trim()) return registers;
    const q = searchQuery.toLowerCase();
    return registers.filter(
      (r) =>
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q),
    );
  }, [registers, searchQuery]);

  const renderCellContent = (content: string | number | null | undefined) => {
    return String(content || "-");
  };

  if (view === "list") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("vehicleArrival.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("vehicleArrival.description")}
            </p>
          </div>
          <Button
            variant="mandi"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setView("form")}
          >
            {t("vehicleArrival.newVehicleEntry")}
          </Button>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("vehicleArrival.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {t("vehicleArrival.fruitFilter")}:
              </span>
              <Select
                value=""
                onChange={() => {}}
                options={[
                  { value: "all", label: t("vehicleArrival.allFruits") },
                ]} // Use custom Select
                className="w-full sm:w-40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Vehicle No</th>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Fruit</th>
                  <th className="px-6 py-4">Total Weight</th>
                  <th className="px-6 py-4">Consignment Value</th>
                  <th className="px-6 py-4">Suppliers Involved</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRegisters.length > 0 ? (
                  filteredRegisters.map((reg) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                        {reg.date}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {reg.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {reg.dayOfWeek || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <StringWrapper>
                          {renderCellContent(reg.fruitTypeCategory)}
                        </StringWrapper>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {reg.totalWeight?.toLocaleString()} kg
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatCurrency(reg.grandTotal)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        <StringWrapper>
                          {String(
                            reg.rows?.map((r: any) => r.partyName).join(", "),
                          )}
                        </StringWrapper>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="mandi"
                          size="sm"
                          icon={<Clock className="w-3 h-3" />}
                          onClick={() => setSelectedRegister(reg)}
                        >
                          {t("vehicleArrival.viewGrid")}
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
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Vehicle Detail Modal */}
        {selectedRegister && (
          <VehicleDetailModal
            register={selectedRegister}
            onClose={() => setSelectedRegister(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("vehicleArrival.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("vehicleArrival.description")}
          </p>
        </div>
        <Button
          variant="soft"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => setView("list")}
        >
          {t("vehicleArrival.backToLog")}
        </Button>
      </div>

      {/* Header Details */}
      <Card className="p-6 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <Truck className="w-5 h-5 text-[#facc15]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {t("vehicleArrival.headerDetails")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Input
            label={t("vehicleArrival.arrivalDate")}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            prefix={<CalendarDays className="w-4 h-4" />}
          />
          <Input
            label={t("vehicleArrival.dayOfWeek")}
            value={dayOfWeek}
            readOnly
            className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
          />
          <Input
            label={t("vehicleArrival.vehicleNumber") + " *"}
            placeholder="GJ06AB1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
          <Select
            label={t("vehicleArrival.fruitTypeCategory")}
            value={fruitTypeCategory}
            onChange={(e) => setFruitTypeCategory(e.target.value)}
            options={[
              { value: "Mango", label: "Mango" },
              { value: "Apple", label: "Apple" },
              { value: "Banana", label: "Banana" },
            ]}
          />
          <Input
            label={t("vehicleArrival.driverName")}
            placeholder="Sukhdev Singh"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          />
          <Input
            label={t("vehicleArrival.scaleWeight")}
            type="number"
            value={scaleWeight}
            onChange={(e) => setScaleWeight(Number(e.target.value))}
            prefix={<Scale className="w-4 h-4" />}
          />
          <Input
            label={t("vehicleArrival.vehicleDescription")}
            placeholder="Eicher Pro 10-Tonne (Optional)"
            className="lg:col-span-2"
            value={vehicleDescription}
            onChange={(e) => setVehicleDescription(e.target.value)}
          />
        </div>
      </Card>

      {/* Ledger Grid */}
      <Card className="p-0 border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#facc15]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("vehicleArrival.ledgerGrid")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Clipboard className="w-4 h-4" />}
              onClick={handlePasteFromExcel}
            >
              {t("vehicleArrival.pasteFromExcel")}
            </Button>
            <Button
              variant="mandi"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={addRow}
            >
              {t("vehicleArrival.addRow")}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 w-12 text-center border-r border-slate-200 dark:border-slate-800">
                  #
                </th>
                <th className="px-4 py-3 min-w-[200px] border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.supplierName")}
                </th>
                <th className="px-4 py-3 min-w-[150px] border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.variety")}
                </th>
                <th className="px-4 py-3 w-28 text-center border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.caratQty")}
                </th>
                <th className="px-4 py-3 w-32 text-center border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.totalWt")}
                </th>
                <th className="px-4 py-3 w-32 text-center border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.rate")}
                </th>
                <th className="px-4 py-3 w-36 text-right border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.totalCost")}
                </th>
                <th className="px-4 py-3 min-w-[200px] border-r border-slate-200 dark:border-slate-800">
                  {t("vehicleArrival.qualityDetails")}
                </th>
                <th className="px-4 py-3 w-20 text-center">
                  {t("vehicleArrival.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <td className="px-4 py-2 text-center font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <PartySelect
                      value={row.partyId}
                      parties={parties}
                      onChange={(v) => updateRow(idx, "partyId", v)}
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      className="w-full h-11 px-4 bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50 inset-0"
                      value={row.vakkal}
                      onChange={(e) => updateRow(idx, "vakkal", e.target.value)}
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      className="w-full h-11 px-4 bg-transparent outline-none text-center focus:ring-2 focus:ring-blue-500/50"
                      value={row.carat || ""}
                      onChange={(e) =>
                        updateRow(idx, "carat", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      className="w-full h-11 px-4 bg-transparent outline-none text-center focus:ring-2 focus:ring-blue-500/50"
                      value={row.weight || ""}
                      onChange={(e) =>
                        updateRow(idx, "weight", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      className="w-full h-11 px-4 bg-transparent outline-none text-center focus:ring-2 focus:ring-blue-500/50"
                      value={row.rate || ""}
                      onChange={(e) =>
                        updateRow(idx, "rate", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    ₹{row.total.toLocaleString()}
                  </td>
                  <td className="px-0 py-0 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder={t("vehicleArrival.qualityDetails")}
                      className="w-full h-11 px-4 bg-transparent outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={row.remarks}
                      onChange={(e) =>
                        updateRow(idx, "remarks", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => delRow(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
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
                  className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest"
                >
                  {t("vehicleArrival.totals")}:
                </td>
                <td className="px-4 py-4 text-center text-slate-900 dark:text-white">
                  {totals.carat} C
                </td>
                <td className="px-4 py-4 text-center text-slate-900 dark:text-white">
                  {totals.weight.toLocaleString()} kg
                </td>
                <td className="border-r border-slate-200 dark:border-slate-800"></td>
                <td className="px-4 py-4 text-right text-[#facc15] text-lg">
                  ₹{totals.cost.toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-10 flex items-center justify-end gap-4 shadow-2xl">
        <Button variant="ghost" onClick={() => setView("list")}>
          {t("vehicleArrival.cancelDiscard")}
        </Button>
        <Button
          variant="mandi"
          icon={<Save className="w-4 h-4" />}
          loading={isLoading}
          onClick={saveVehicleRegister}
        >
          {t("vehicleArrival.commitSave")}
        </Button>
      </div>
    </div>
  );
}

function VehicleDetailModal({
  register,
  onClose,
}: {
  register: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#facc15]/10 rounded-2xl">
              <Truck className="w-6 h-6 text-[#facc15]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Vehicle Detail:{" "}
                <span className="text-[#facc15]">{register.vehicleNumber}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recorded on {register.date} ({register.dayOfWeek}) • Fruit:{" "}
                <span className="text-[#facc15] font-medium">
                  {register.fruitTypeCategory}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Driver Name
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {register.driverName}
              </p>
            </div>
            <div className="text-center border-l border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Total Weight
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {register.totalWeight?.toLocaleString()} kg
              </p>
            </div>
            <div className="text-center border-l border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Rows Recorded
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {register.totalRows} rows
              </p>
            </div>
            <div className="text-center border-l border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Consignment Value
              </span>
              <p className="text-sm font-bold text-[#facc15] mt-1">
                {formatCurrency(register.grandTotal)}
              </p>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Consignment Breakdown
            </h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/30">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-800">
                      Supplier Name
                    </th>
                    <th className="px-4 py-3 border-r border-slate-800">
                      Variety
                    </th>
                    <th className="px-4 py-3 text-center border-r border-slate-800">
                      Carets
                    </th>
                    <th className="px-4 py-3 text-center border-r border-slate-800">
                      Weight (kg)
                    </th>
                    <th className="px-4 py-3 text-center border-r border-slate-800">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right border-r border-slate-800">
                      Amount
                    </th>
                    <th className="px-4 py-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {register.rows?.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-white border-r border-slate-800">
                        {row.partyName}
                      </td>
                      <td className="px-4 py-3 text-slate-300 border-r border-slate-800">
                        {row.vakkal}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 border-r border-slate-800">
                        {row.carat} C
                      </td>
                      <td className="px-4 py-3 text-center text-white font-medium border-r border-slate-800">
                        {row.weight?.toLocaleString()} kg
                      </td>
                      <td className="px-4 py-3 text-center text-[#facc15] border-r border-slate-800">
                        ₹{row.rate}/kg
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white border-r border-slate-800">
                        ₹{row.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic">
                        {row.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operator Notes */}
          <div className="p-4 bg-[#facc15]/5 border border-[#facc15]/20 rounded-2xl">
            <span className="text-[10px] font-bold text-[#facc15] uppercase tracking-widest">
              Operator Notes:
            </span>
            <p className="text-sm text-slate-400 mt-1">
              {register.notes || "No notes provided"}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/30">
          <Button
            variant="outline"
            icon={<RotateCcw className="w-4 h-4" />}
            className="text-red-400 border-red-900/50 hover:bg-red-950/30"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to rollback this entry? This will revert stock and ledger balances.",
                )
              ) {
                toast.info("Rollback feature coming soon");
              }
            }}
          >
            Rollback Entry (Revert Stock/Ledger)
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={<Printer className="w-4 h-4" />}
              className="text-slate-400 border-slate-800"
              onClick={() => toast.info("Printing statement...")}
            >
              Print Statement
            </Button>
            <Button
              variant="mandi"
              className="bg-white hover:bg-slate-200 text-slate-900 border-none font-bold"
              onClick={onClose}
            >
              Close Detail Grid
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartySelect({
  value,
  parties,
  onChange,
}: {
  value: string;
  parties: any[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parties.find((p) => p.id === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return parties.slice(0, 10);
    return parties
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 10);
  }, [parties, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-11 px-4 text-left text-sm outline-none transition-all",
          selected
            ? "text-slate-900 dark:text-white font-medium"
            : "text-slate-400",
          open && "ring-2 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20",
        )}
      >
        {selected ? selected.name : "-- Select Supplier --"}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                placeholder="Search party..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                className="w-full px-4 py-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span>{p.name}</span>
                {p.city && (
                  <span className="text-[10px] text-slate-400">{p.city}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
