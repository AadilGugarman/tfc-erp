import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarRange,
  Check,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Package,
  PieChart,
  Printer,
  RefreshCw,
  Search,
  Send,
  Truck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import type {
  InventoryItem,
  InventoryTransaction,
  LedgerEntry,
  Payment,
  VehicleRegister,
} from '@/db/schema';

type ReportType =
  | 'daily'
  | 'monthly'
  | 'vehicle'
  | 'party-ledger'
  | 'inventory'
  | 'payment'
  | 'outstanding'
  | 'gst';

type QuickPreset = 'today' | 'last7' | 'last30' | 'thisMonth' | 'thisYear' | 'all';

type TableColumnKey =
  | 'module'
  | 'type'
  | 'reference'
  | 'date'
  | 'party'
  | 'item'
  | 'vehicle'
  | 'quantity'
  | 'gross'
  | 'net'
  | 'gst'
  | 'status'
  | 'warehouse';

type TableRow = {
  id: string;
  module: string;
  type: string;
  reference: string;
  date: string;
  party: string;
  item: string;
  vehicle: string;
  quantity: number;
  gross: number;
  net: number;
  gst: number;
  status: string;
  warehouse: string;
};

type AggregatedSnapshot = {
  payments: Payment[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  vehicleRegisters: VehicleRegister[];
  ledgerEntries: LedgerEntry[];
  settings: ReturnType<typeof db.getSettings>;
};

const REPORT_TYPES: Array<{ id: ReportType; label: string }> = [
  { id: 'daily', label: 'Daily Reports' },
  { id: 'monthly', label: 'Monthly Reports' },
  { id: 'vehicle', label: 'Vehicle-wise Reports' },
  { id: 'party-ledger', label: 'Party Ledger Reports' },
  { id: 'inventory', label: 'Inventory Reports' },
  { id: 'sales', label: 'Sales Reports' },
  { id: 'payment', label: 'Payment Reports' },
  { id: 'outstanding', label: 'Outstanding Reports' },
  { id: 'gst', label: 'GST Reports' },
];

const ALL_COLUMNS: Array<{ key: TableColumnKey; label: string }> = [
  { key: 'module', label: 'Module' },
  { key: 'type', label: 'Type' },
  { key: 'reference', label: 'Reference' },
  { key: 'date', label: 'Date' },
  { key: 'party', label: 'Party / Supplier' },
  { key: 'item', label: 'Item' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'gross', label: 'Gross Amount' },
  { key: 'net', label: 'Net / Outstanding' },
  { key: 'gst', label: 'GST' },
  { key: 'status', label: 'Status' },
  { key: 'warehouse', label: 'Warehouse' },
];

const KPI_ACCENTS = [
  {
    border: 'border-emerald-200/80 dark:border-emerald-700/40',
    strip: 'from-emerald-100/90 to-emerald-50/30 dark:from-emerald-900/35 dark:to-transparent',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-300',
    glow: 'from-emerald-500/25 to-transparent',
  },
  {
    border: 'border-sky-200/80 dark:border-sky-700/40',
    strip: 'from-sky-100/90 to-sky-50/30 dark:from-sky-900/35 dark:to-transparent',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/45 dark:text-sky-300',
    glow: 'from-sky-500/25 to-transparent',
  },
  {
    border: 'border-orange-200/80 dark:border-orange-700/40',
    strip: 'from-orange-100/90 to-orange-50/30 dark:from-orange-900/35 dark:to-transparent',
    icon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/45 dark:text-orange-300',
    glow: 'from-orange-500/25 to-transparent',
  },
  {
    border: 'border-cyan-200/80 dark:border-cyan-700/40',
    strip: 'from-cyan-100/90 to-cyan-50/30 dark:from-cyan-900/35 dark:to-transparent',
    icon: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/45 dark:text-cyan-300',
    glow: 'from-cyan-500/25 to-transparent',
  },
  {
    border: 'border-amber-200/80 dark:border-amber-700/40',
    strip: 'from-amber-100/90 to-amber-50/30 dark:from-amber-900/35 dark:to-transparent',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/45 dark:text-amber-300',
    glow: 'from-amber-500/25 to-transparent',
  },
  {
    border: 'border-teal-200/80 dark:border-teal-700/40',
    strip: 'from-teal-100/90 to-teal-50/30 dark:from-teal-900/35 dark:to-transparent',
    icon: 'bg-teal-100 text-teal-700 dark:bg-teal-900/45 dark:text-teal-300',
    glow: 'from-teal-500/25 to-transparent',
  },
  {
    border: 'border-rose-200/80 dark:border-rose-700/40',
    strip: 'from-rose-100/90 to-rose-50/30 dark:from-rose-900/35 dark:to-transparent',
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/45 dark:text-rose-300',
    glow: 'from-rose-500/25 to-transparent',
  },
  {
    border: 'border-indigo-200/80 dark:border-indigo-700/40',
    strip: 'from-indigo-100/90 to-indigo-50/30 dark:from-indigo-900/35 dark:to-transparent',
    icon: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/45 dark:text-indigo-300',
    glow: 'from-indigo-500/25 to-transparent',
  },
] as const;

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getStartOfYear(): string {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function readSnapshot(): AggregatedSnapshot {
  return {
    payments: db.getPayments(),
    inventoryItems: db.getInventoryItems(),
    inventoryTransactions: db.getInventoryTransactions(),
    vehicleRegisters: db.getVehicleRegisters(),
    ledgerEntries: db.getLedgerEntries(),
    settings: db.getSettings(),
  };
}

function toCsv(rows: TableRow[]): string {
  const header = ALL_COLUMNS.map((c) => c.label).join(',');
  const body = rows
    .map((r) =>
      [
        r.module,
        r.type,
        r.reference,
        r.date,
        r.party,
        r.item,
        r.vehicle,
        r.quantity,
        r.gross,
        r.net,
        r.gst,
        r.status,
        r.warehouse,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
  return `${header}\n${body}`;
}

function downloadBlob(content: BlobPart, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeStatus(value: string): string {
  return (value || '').toLowerCase();
}

function isInDateRange(date: string, from: string, to: string): boolean {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function TrendLineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data
    .map((d, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - (d.value / max) * 90;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-xl border border-sky-200/70 dark:border-sky-800/45 bg-gradient-to-br from-sky-50/85 via-white to-cyan-50/75 dark:from-[#0f182b] dark:via-[#111f34] dark:to-[#0f2433] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Sales Trend</p>
        <span className="text-xs text-slate-500 dark:text-slate-400">Line Chart</span>
      </div>
      <svg viewBox="0 0 100 100" className="h-40 w-full">
        <defs>
          <linearGradient id="salesTrendStroke" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="52%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="0.6" points="0,100 100,100" />
        <polyline
          fill="none"
          stroke="url(#salesTrendStroke)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        {data.slice(-4).map((d) => (
          <span key={d.label} className="rounded-md bg-slate-100 px-2 py-1 dark:bg-[#1b2438]">
            {d.label}: {formatCurrency(d.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarAnalyticsChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barPalette = [
    'from-blue-600 to-cyan-400',
    'from-emerald-600 to-teal-400',
    'from-orange-500 to-amber-400',
    'from-rose-600 to-pink-400',
    'from-indigo-600 to-sky-400',
    'from-teal-600 to-cyan-500',
  ];
  return (
    <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800/45 bg-gradient-to-br from-emerald-50/85 via-white to-teal-50/75 dark:from-[#0f182b] dark:via-[#112034] dark:to-[#102733] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Stock Movement</p>
        <span className="text-xs text-slate-500 dark:text-slate-400">Bar Chart</span>
      </div>
      <div className="space-y-2">
        {data.map((d, idx) => (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate">{d.label}</span>
              <span>{d.value.toLocaleString('en-IN')} kg</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#1b2438]">
              <div
                className={`h-2.5 rounded-full bg-gradient-to-r ${barPalette[idx % barPalette.length]}`}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieModeChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let cursor = 0;
  const colors = ['#2563eb', '#0f766e', '#d97706', '#be123c', '#0891b2'];

  const slices = data.map((d, idx) => {
    const frac = d.value / total;
    const angle = frac * Math.PI * 2;
    const x1 = 50 + 42 * Math.cos(cursor);
    const y1 = 50 + 42 * Math.sin(cursor);
    cursor += angle;
    const x2 = 50 + 42 * Math.cos(cursor);
    const y2 = 50 + 42 * Math.sin(cursor);
    const largeArc = frac > 0.5 ? 1 : 0;
    return {
      path: `M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[idx % colors.length],
      label: d.label,
      value: d.value,
    };
  });

  return (
    <div className="rounded-xl border border-amber-200/70 dark:border-amber-800/45 bg-gradient-to-br from-amber-50/85 via-white to-rose-50/75 dark:from-[#0f182b] dark:via-[#211d34] dark:to-[#2a1a2a] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Payment Mix</p>
        <span className="text-xs text-slate-500 dark:text-slate-400">Pie Chart</span>
      </div>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0">
          {slices.map((s) => (
            <path key={s.label} d={s.path} fill={s.color} stroke="white" strokeWidth="0.8" />
          ))}
        </svg>
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="capitalize">{s.label}</span>
              <span className="font-semibold">{formatCurrency(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [snapshot, setSnapshot] = useState<AggregatedSnapshot>(readSnapshot);
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dateFrom, setDateFrom] = useState(getStartOfMonth());
  const [dateTo, setDateTo] = useState(todayStr());
  const [partyFilter, setPartyFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [sortBy, setSortBy] = useState<TableColumnKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<TableColumnKey[]>([
    'module',
    'type',
    'reference',
    'date',
    'party',
    'item',
    'gross',
    'net',
    'status',
  ]);

  useEffect(() => {
    const refresh = () => setSnapshot(readSnapshot());
    const unsubscribe = db.subscribeDbChanges(refresh);
    window.addEventListener('storage', refresh);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const options = useMemo(() => {
    const parties = Array.from(
      new Set([
        ...snapshot.payments.map((p) => `${p.partyId}::${p.partyName}`),
        ...snapshot.vehicleRegisters.flatMap((v) =>
          v.rows.filter((r) => r.partyId).map((r) => `${r.partyId}::${r.partyName}`)
        ),
      ])
    )
      .map((raw) => {
        const [id, name] = raw.split('::');
        return { id, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const vehicles = Array.from(new Set(snapshot.vehicleRegisters.map((v) => v.vehicleNumber))).sort();
    const items = Array.from(
      new Set([
        ...snapshot.inventoryItems.map((i) => i.name),
        ...snapshot.vehicleRegisters.flatMap((v) => v.rows.map((r) => r.fruitName)),
      ])
    ).sort();
    const warehouses = Array.from(new Set(snapshot.inventoryItems.map((i) => i.warehouse))).sort();
    return { parties, vehicles, items, warehouses };
  }, [snapshot]);

  const filteredData = useMemo(() => {
    const filteredPayments = snapshot.payments.filter((p) => {
      const partyMatched = partyFilter === 'all' || p.partyId === partyFilter;
      const modeMatched = paymentTypeFilter === 'all' || p.mode === paymentTypeFilter;
      const statusMatched = statusFilter === 'all' || normalizeStatus(p.type) === normalizeStatus(statusFilter);
      return isInDateRange(p.date, dateFrom, dateTo) && partyMatched && modeMatched && statusMatched;
    });

    const filteredVehicles = snapshot.vehicleRegisters.filter((v) => {
      const vehicleMatched = vehicleFilter === 'all' || v.vehicleNumber === vehicleFilter;
      const statusMatched = statusFilter === 'all' || normalizeStatus(v.status) === normalizeStatus(statusFilter);
      const rowPartyMatched =
        partyFilter === 'all' || v.rows.some((r) => r.partyId === partyFilter || r.partyName.toLowerCase().includes(partyFilter.toLowerCase()));
      const rowItemMatched = itemFilter === 'all' || v.rows.some((r) => r.fruitName === itemFilter);
      return isInDateRange(v.date, dateFrom, dateTo) && vehicleMatched && statusMatched && rowPartyMatched && rowItemMatched;
    });

    const filteredInventory = snapshot.inventoryItems.filter((item) => {
      const itemMatched = itemFilter === 'all' || item.name === itemFilter;
      const warehouseMatched = warehouseFilter === 'all' || item.warehouse === warehouseFilter;
      const statusMatched = statusFilter === 'all' || normalizeStatus(item.status) === normalizeStatus(statusFilter);
      return itemMatched && warehouseMatched && statusMatched;
    });

    const inventoryMap = new Map(snapshot.inventoryItems.map((i) => [i.id, i]));

    const filteredInventoryTransactions = snapshot.inventoryTransactions.filter((txn) => {
      const itemMatched = itemFilter === 'all' || txn.itemName === itemFilter;
      const statusMatched = statusFilter === 'all' || normalizeStatus(txn.type) === normalizeStatus(statusFilter);
      const warehouseMatched =
        warehouseFilter === 'all' || inventoryMap.get(txn.itemId)?.warehouse === warehouseFilter;
      return isInDateRange(txn.date, dateFrom, dateTo) && itemMatched && statusMatched && warehouseMatched;
    });

    const filteredLedger = snapshot.ledgerEntries.filter((l) => {
      const partyMatched = partyFilter === 'all' || l.partyId === partyFilter;
      const statusMatched = statusFilter === 'all' || normalizeStatus(l.type) === normalizeStatus(statusFilter);
      return isInDateRange(l.date, dateFrom, dateTo) && partyMatched && statusMatched;
    });

    return {
      payments: filteredPayments,
      vehicles: filteredVehicles,
      inventoryItems: filteredInventory,
      inventoryTransactions: filteredInventoryTransactions,
      ledgerEntries: filteredLedger,
    };
  }, [
    snapshot,
    dateFrom,
    dateTo,
    partyFilter,
    vehicleFilter,
    itemFilter,
    statusFilter,
    paymentTypeFilter,
    warehouseFilter,
  ]);

  const kpis = useMemo(() => {
    const received = filteredData.payments
      .filter((p) => p.type === 'received')
      .reduce((sum, p) => sum + p.amount, 0);
    const paid = filteredData.payments.filter((p) => p.type === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const stockOnHand = filteredData.inventoryItems.reduce((sum, i) => sum + i.currentStock, 0);
    const stockInward = filteredData.inventoryTransactions
      .filter((t) => t.type === 'inward')
      .reduce((sum, t) => sum + t.quantity, 0);
    const stockOutward = filteredData.inventoryTransactions
      .filter((t) => t.type === 'outward')
      .reduce((sum, t) => sum + t.quantity, 0);
    const vehicleTrips = filteredData.vehicles.length;
    const vehicleWeight = filteredData.vehicles.reduce((sum, v) => sum + v.totalWeight, 0);

    return {
      received,
      paid,
      stockOnHand,
      stockInward,
      stockOutward,
      vehicleTrips,
      vehicleWeight,
      paymentsNet: received - paid,
    };
  }, [filteredData]);

  const tableRows = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = [];

    filteredData.payments.forEach((p) => {
      rows.push({
        id: `payment-${p.id}`,
        module: 'Payments',
        type: p.type,
        reference: p.referenceNo || p.id,
        date: p.date,
        party: p.partyName,
        item: '-',
        vehicle: '-',
        quantity: 0,
        gross: p.amount,
        net: p.amount,
        gst: 0,
        status: p.mode,
        warehouse: '-',
      });
    });

    filteredData.vehicles.forEach((v) => {
      rows.push({
        id: `vehicle-${v.id}`,
        module: 'Vehicle Register',
        type: 'Movement',
        reference: v.entryNo,
        date: v.date,
        party: v.rows.map((r) => r.partyName).filter(Boolean).slice(0, 2).join(', ') || '-',
        item: v.rows.map((r) => r.fruitName).slice(0, 3).join(', '),
        vehicle: v.vehicleNumber,
        quantity: v.totalWeight,
        gross: v.grandTotal,
        net: v.outstandingBalance,
        gst: 0,
        status: v.status,
        warehouse: '-',
      });
    });

    filteredData.inventoryTransactions.forEach((t) => {
      const warehouse = snapshot.inventoryItems.find((i) => i.id === t.itemId)?.warehouse || '-';
      rows.push({
        id: `inventory-txn-${t.id}`,
        module: 'Inventory',
        type: t.type,
        reference: t.referenceId,
        date: t.date,
        party: '-',
        item: t.itemName,
        vehicle: '-',
        quantity: t.quantity,
        gross: t.rate * t.quantity,
        net: t.rate * t.quantity,
        gst: 0,
        status: t.referenceType,
        warehouse,
      });
    });

    return rows;
  }, [filteredData, snapshot.inventoryItems]);

  const scopedRows = useMemo(() => {
    switch (reportType) {
      case 'daily':
        return tableRows.filter((r) => r.date === dateTo);
      case 'monthly':
        return tableRows.filter((r) => r.date.slice(0, 7) === dateTo.slice(0, 7));
      case 'vehicle':
        return tableRows.filter((r) => r.module === 'Vehicle Register');
      case 'party-ledger':
        return tableRows.filter((r) => ['Billing', 'Purchases', 'Payments'].includes(r.module));
      case 'inventory':
        return tableRows.filter((r) => r.module === 'Inventory');
      case 'sales':
        return tableRows.filter((r) => r.module === 'Billing');
      case 'payment':
        return tableRows.filter((r) => r.module === 'Payments');
      case 'outstanding':
        return tableRows.filter((r) => r.net > 0 && ['Billing', 'Purchases'].includes(r.module));
      case 'purchase':
        return tableRows.filter((r) => r.module === 'Purchases');
      case 'gst':
        return tableRows.filter((r) => r.gst > 0 && ['Billing', 'Purchases'].includes(r.module));
      default:
        return tableRows;
    }
  }, [tableRows, reportType, dateTo]);

  const searchedRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return scopedRows;
    return scopedRows.filter((r) => {
      return (
        r.module.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.party.toLowerCase().includes(q) ||
        r.item.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [scopedRows, tableSearch]);

  const sortedRows = useMemo(() => {
    const data = [...searchedRows];
    data.sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];
      if (typeof left === 'number' && typeof right === 'number') {
        return sortDir === 'asc' ? left - right : right - left;
      }
      return sortDir === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return data;
  }, [searchedRows, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [reportType, dateFrom, dateTo, partyFilter, vehicleFilter, itemFilter, statusFilter, paymentTypeFilter, warehouseFilter, tableSearch, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const salesTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    filteredData.bills.forEach((b) => {
      byDay.set(b.date, (byDay.get(b.date) || 0) + b.total);
    });
    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([date, value]) => ({ label: formatDate(date), value }));
  }, [filteredData.bills]);

  const stockBars = useMemo(() => {
    const byItem = new Map<string, number>();
    filteredData.inventoryTransactions.forEach((t) => {
      byItem.set(t.itemName, (byItem.get(t.itemName) || 0) + t.quantity);
    });
    return Array.from(byItem.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredData.inventoryTransactions]);

  const paymentPie = useMemo(() => {
    const byMode = new Map<string, number>();
    filteredData.payments.forEach((p) => {
      byMode.set(p.mode, (byMode.get(p.mode) || 0) + p.amount);
    });
    return Array.from(byMode.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData.payments]);

  const partyLedgerSummary = useMemo(() => {
    const map = new Map<string, { party: string; debit: number; credit: number }>();
    filteredData.ledgerEntries.forEach((entry) => {
      const current = map.get(entry.partyId) || { party: entry.partyName, debit: 0, credit: 0 };
      if (entry.type === 'debit') current.debit += entry.amount;
      else current.credit += entry.amount;
      map.set(entry.partyId, current);
    });
    return Array.from(map.values())
      .map((s) => ({
        ...s,
        balance: s.debit - s.credit,
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 6);
  }, [filteredData.ledgerEntries]);

  const applyQuickPreset = (preset: QuickPreset) => {
    if (preset === 'today') {
      const t = todayStr();
      setDateFrom(t);
      setDateTo(t);
    }
    if (preset === 'last7') {
      setDateFrom(daysAgo(6));
      setDateTo(todayStr());
    }
    if (preset === 'last30') {
      setDateFrom(daysAgo(29));
      setDateTo(todayStr());
    }
    if (preset === 'thisMonth') {
      setDateFrom(getStartOfMonth());
      setDateTo(todayStr());
    }
    if (preset === 'thisYear') {
      setDateFrom(getStartOfYear());
      setDateTo(todayStr());
    }
    if (preset === 'all') {
      setDateFrom('');
      setDateTo(todayStr());
    }
  };

  const onToggleColumn = (key: TableColumnKey) => {
    setVisibleColumns((current) => {
      if (current.includes(key)) {
        return current.filter((c) => c !== key);
      }
      return [...current, key];
    });
  };

  const onSort = (key: TableColumnKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(key);
    setSortDir('desc');
  };

  const exportCsv = () => {
    downloadBlob(toCsv(sortedRows), `reports-${todayStr()}.csv`, 'text/csv;charset=utf-8');
  };

  const exportExcel = () => {
    const html = `
      <table border="1" cellspacing="0" cellpadding="6">
        <tr>${ALL_COLUMNS.map((c) => `<th>${c.label}</th>`).join('')}</tr>
        ${sortedRows
          .map(
            (r) =>
              `<tr>
                <td>${r.module}</td>
                <td>${r.type}</td>
                <td>${r.reference}</td>
                <td>${r.date}</td>
                <td>${r.party}</td>
                <td>${r.item}</td>
                <td>${r.vehicle}</td>
                <td>${r.quantity}</td>
                <td>${r.gross}</td>
                <td>${r.net}</td>
                <td>${r.gst}</td>
                <td>${r.status}</td>
                <td>${r.warehouse}</td>
              </tr>`
          )
          .join('')}
      </table>
    `;
    downloadBlob(html, `reports-${todayStr()}.xls`, 'application/vnd.ms-excel');
  };

  const openPrintLayout = (autoPrint: boolean) => {
    const w = window.open('', '_blank', 'width=1200,height=900');
    if (!w) return;
    const reportName = REPORT_TYPES.find((r) => r.id === reportType)?.label || 'Reports';
    const header = `${snapshot.settings.businessName} - ${reportName}`;
    const table = `
      <table>
        <thead>
          <tr>${ALL_COLUMNS.map((c) => `<th>${c.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${sortedRows
            .map(
              (r) =>
                `<tr>
                  <td>${r.module}</td><td>${r.type}</td><td>${r.reference}</td><td>${r.date}</td><td>${r.party}</td>
                  <td>${r.item}</td><td>${r.vehicle}</td><td>${r.quantity}</td><td>${formatCurrency(r.gross)}</td>
                  <td>${formatCurrency(r.net)}</td><td>${formatCurrency(r.gst)}</td><td>${r.status}</td><td>${r.warehouse}</td>
                </tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;

    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${header}</title>
          <style>
            body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 6px 0; font-size: 22px; }
            .meta { margin-bottom: 14px; color: #475569; }
            .cards { display: flex; gap: 12px; margin-bottom: 12px; }
            .card { border: 1px solid #dbeafe; border-radius: 8px; padding: 8px 10px; min-width: 180px; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .value { font-weight: 700; margin-top: 3px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background: #f1f5f9; position: sticky; top: 0; }
          </style>
        </head>
        <body>
          <h1>${header}</h1>
          <div class="meta">Date Range: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'} | Generated: ${new Date().toLocaleString()}</div>
          <div class="cards">
            <div class="card"><div class="label">Total Sales</div><div class="value">${formatCurrency(kpis.sales)}</div></div>
            <div class="card"><div class="label">Total Purchase</div><div class="value">${formatCurrency(kpis.purchase)}</div></div>
            <div class="card"><div class="label">Profit / Loss</div><div class="value">${formatCurrency(kpis.profit)}</div></div>
            <div class="card"><div class="label">GST Payable</div><div class="value">${formatCurrency(kpis.gstPayable)}</div></div>
          </div>
          ${table}
          ${autoPrint ? '<script>window.onload = function(){window.print();};</script>' : ''}
        </body>
      </html>
    `);
    w.document.close();
  };

  const exportPdf = () => {
    openPrintLayout(true);
  };

  const printMode = () => {
    openPrintLayout(true);
  };

  const shareToWhatsapp = async () => {
    const text = [
      `${snapshot.settings.businessName} Reports Summary`,
      `Date: ${dateFrom || 'N/A'} to ${dateTo || 'N/A'}`,
      `Sales: ${formatCurrency(kpis.sales)}`,
      `Purchases: ${formatCurrency(kpis.purchase)}`,
      `Profit/Loss: ${formatCurrency(kpis.profit)}`,
      `Outstanding Receivable: ${formatCurrency(kpis.outstandingReceivable)}`,
      `Outstanding Payable: ${formatCurrency(kpis.outstandingPayable)}`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ERP Reports Summary', text });
        return;
      } catch {
        // Fall through to WhatsApp link.
      }
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const headerPresets: Array<{ id: QuickPreset; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'last7', label: 'Last 7D' },
    { id: 'last30', label: 'Last 30D' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'thisYear', label: 'This Year' },
    { id: 'all', label: 'All' },
  ];

  const refreshData = () => {
    setSnapshot(readSnapshot());
  };

  return (
    <section className="space-y-4 pb-2">
      <div className="sticky top-[4.15rem] z-20 rounded-xl border border-slate-200/85 dark:border-[#2a3550]/90 bg-gradient-to-br from-white/95 via-sky-50/80 to-cyan-50/70 dark:from-[#0f1628]/95 dark:via-[#10203a]/95 dark:to-[#10283b]/95 backdrop-blur-xl shadow-[0_14px_28px_-22px_rgba(15,23,42,0.65)]">
        <header className="space-y-3 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Central Analytics Hub / ERP Reports</p>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Enterprise Reports Center</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Live analytics synced with Vehicle Register, Billing, Inventory, Parties, Ledger, Payments, Purchases, and Transactions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>CSV</Button>
              <Button variant="outline" size="sm" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel}>Excel</Button>
              <Button variant="outline" size="sm" icon={<FileText className="h-4 w-4" />} onClick={exportPdf}>PDF</Button>
              <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={printMode}>Print</Button>
              <Button variant="soft" size="sm" icon={<Send className="h-4 w-4" />} onClick={shareToWhatsapp}>Share / WhatsApp</Button>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={refreshData}>Refresh</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
            <div className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 dark:border-[#2a3550] dark:bg-[#131d33]">
              <p className="text-[10px] uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">From</p>
              <input className="mt-1 w-full bg-transparent text-sm outline-none" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 dark:border-[#2a3550] dark:bg-[#131d33]">
              <p className="text-[10px] uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">To</p>
              <input className="mt-1 w-full bg-transparent text-sm outline-none" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <select className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 text-sm dark:border-[#2a3550] dark:bg-[#131d33]" value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}>
              <option value="all">Party</option>
              {options.parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 text-sm dark:border-[#2a3550] dark:bg-[#131d33]" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
              <option value="all">Vehicle</option>
              {options.vehicles.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 text-sm dark:border-[#2a3550] dark:bg-[#131d33]" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}>
              <option value="all">Item</option>
              {options.items.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <select className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 text-sm dark:border-[#2a3550] dark:bg-[#131d33]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="posted">Posted</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="received">Received</option>
              <option value="paid">Paid Payment</option>
            </select>
            <select className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-2 text-sm dark:border-[#2a3550] dark:bg-[#131d33]" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
              <option value="all">Warehouse</option>
              {options.warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white p-1 dark:border-[#2a3550] dark:bg-[#141d31]">
              {headerPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyQuickPreset(preset.id)}
                  className="rounded-md px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#1f2a43]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <select className="rounded-lg border border-slate-200/70 bg-white/90 px-2.5 py-1.5 text-xs dark:border-[#2a3550] dark:bg-[#131d33]" value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)}>
              <option value="all">Payment Type</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </header>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard accent={0} title="Sales Overview" value={formatCurrency(kpis.sales)} subtitle={`${filteredData.bills.length} bills`} icon={<CircleDollarSign className="h-4 w-4" />} trend={kpis.profit >= 0 ? 'up' : 'down'} />
        <KpiCard accent={1} title="Inventory Analytics" value={`${kpis.stockOnHand.toLocaleString('en-IN')} kg`} subtitle={`In ${kpis.stockInward.toLocaleString('en-IN')} / Out ${kpis.stockOutward.toLocaleString('en-IN')}`} icon={<Package className="h-4 w-4" />} trend={kpis.stockInward >= kpis.stockOutward ? 'up' : 'down'} />
        <KpiCard accent={2} title="Vehicle Movement" value={`${kpis.vehicleTrips} entries`} subtitle={`${kpis.vehicleWeight.toLocaleString('en-IN')} kg total`} icon={<Truck className="h-4 w-4" />} trend="up" />
        <KpiCard accent={3} title="Outstanding Payments" value={formatCurrency(kpis.outstandingReceivable)} subtitle={`Payable ${formatCurrency(kpis.outstandingPayable)}`} icon={<Wallet className="h-4 w-4" />} trend={kpis.outstandingReceivable > kpis.outstandingPayable ? 'up' : 'down'} />
        <KpiCard accent={4} title="Profit / Loss" value={formatCurrency(kpis.profit)} subtitle={`Purchase ${formatCurrency(kpis.purchase)}`} icon={<IndianRupee className="h-4 w-4" />} trend={kpis.profit >= 0 ? 'up' : 'down'} />
        <KpiCard accent={5} title="Party Ledger Summary" value={formatCurrency(filteredData.ledgerEntries.reduce((s, l) => s + Math.abs(l.runningBalance), 0))} subtitle={`${partyLedgerSummary.length} major parties`} icon={<CalendarRange className="h-4 w-4" />} trend="up" />
        <KpiCard accent={6} title="Payment Tracking" value={formatCurrency(kpis.paymentsNet)} subtitle={`Received ${formatCurrency(kpis.received)} / Paid ${formatCurrency(kpis.paid)}`} icon={<Filter className="h-4 w-4" />} trend={kpis.paymentsNet >= 0 ? 'up' : 'down'} />
        <KpiCard accent={7} title="GST Summary" value={formatCurrency(kpis.gstPayable)} subtitle={`Sales GST ${formatCurrency(kpis.gstSales)} | Purchase GST ${formatCurrency(kpis.gstPurchase)}`} icon={<FileText className="h-4 w-4" />} trend={kpis.gstPayable >= 0 ? 'up' : 'down'} />
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-r from-white via-slate-50 to-sky-50/70 p-2 dark:border-[#2a3550]/85 dark:bg-gradient-to-r dark:from-[#111a2d] dark:via-[#0f1a30] dark:to-[#10243a]">
        <div className="flex flex-wrap gap-1.5">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                reportType === type.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#1f2a43]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TrendLineChart data={salesTrend.length ? salesTrend : [{ label: 'No Data', value: 0 }]} />
        <BarAnalyticsChart data={stockBars.length ? stockBars : [{ label: 'No Data', value: 0 }]} />
        <PieModeChart data={paymentPie.length ? paymentPie : [{ label: 'none', value: 1 }]} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-slate-200/80 dark:border-[#23304b]">
            <div>
              <CardTitle>Enterprise Report Table</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sorting, filtering, pagination, sticky headers, search, visibility control, and row actions.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search in report rows"
                  className="w-56 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs dark:border-[#2a3550] dark:bg-[#141f35]"
                />
              </div>
              <div className="relative">
                <Button variant="outline" size="sm" icon={<Filter className="h-3.5 w-3.5" />} onClick={() => setColumnMenuOpen((v) => !v)}>
                  Columns
                </Button>
                {columnMenuOpen && (
                  <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-[#2a3550] dark:bg-[#101827]">
                    {ALL_COLUMNS.map((column) => {
                      const active = visibleColumns.includes(column.key);
                      return (
                        <button
                          key={column.key}
                          onClick={() => onToggleColumn(column.key)}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1d2740]"
                        >
                          <span>{column.label}</span>
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#0f172a]">
                  <tr className="border-b border-slate-200/80 dark:border-[#2a3550]">
                    {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((column) => (
                      <th key={column.key} className="px-3 py-2 text-left">
                        <button className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400" onClick={() => onSort(column.key)}>
                          {column.label}
                          {sortBy === column.key ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null}
                        </button>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="px-3 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No data found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row, idx) => (
                      <tr key={row.id} className={idx % 2 ? 'bg-slate-50/70 dark:bg-[#111d33]/55' : 'bg-white dark:bg-[#10192b]'}>
                        {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map((column) => (
                          <td key={`${row.id}-${column.key}`} className="px-3 py-2 align-top text-slate-700 dark:text-slate-200">
                            {renderCellValue(row, column.key)}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <div className="flex gap-1.5">
                            <button
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-[#2a3550] dark:text-slate-300 dark:hover:bg-[#1c2740]"
                              onClick={() => {
                                const csv = toCsv([row]);
                                downloadBlob(csv, `${row.reference}.csv`, 'text/csv;charset=utf-8');
                              }}
                            >
                              CSV
                            </button>
                            <button
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-[#2a3550] dark:text-slate-300 dark:hover:bg-[#1c2740]"
                              onClick={() => {
                                const text = `${row.module} | ${row.reference} | ${row.party} | ${formatCurrency(row.gross)}`;
                                navigator.clipboard.writeText(text);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 px-3 py-2 dark:border-[#24324d]">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {sortedRows.length} records | Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-[#2a3550] dark:bg-[#111a2e]"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[10, 15, 25, 50].map((size) => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Party Ledger Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {partyLedgerSummary.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No ledger records available.</p>
              ) : (
                partyLedgerSummary.map((party) => (
                  <div key={party.party} className="rounded-lg border border-slate-200/75 p-2 dark:border-[#2a3550]">
                    <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{party.party}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Dr {formatCurrency(party.debit)}</span>
                      <span>Cr {formatCurrency(party.credit)}</span>
                    </div>
                    <p className={`mt-1 text-xs font-semibold ${party.balance >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {party.balance >= 0 ? 'Receivable' : 'Payable'} {formatCurrency(Math.abs(party.balance))}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>Sales overview, inventory analytics, vehicle movement, outstanding payments, and profit/loss are live from core modules.</p>
              <p>Report type active: <span className="font-semibold">{REPORT_TYPES.find((r) => r.id === reportType)?.label}</span></p>
              <p>Auto-sync state: <span className="font-semibold text-emerald-600">Connected</span></p>
              <p>Filters update analytics instantly on change.</p>
              <div className="rounded-lg bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                Central analytics hub is now production-wired to Billing, Inventory, Vehicle Register, Ledger, Payments, Purchases, Parties, and Transactions.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function renderCellValue(row: TableRow, key: TableColumnKey): string {
  if (key === 'date') return formatDate(row.date);
  if (key === 'gross' || key === 'net' || key === 'gst') return formatCurrency(row[key]);
  if (key === 'quantity') return `${row.quantity.toLocaleString('en-IN')}`;
  return String(row[key]);
}

function KpiCard({
  accent,
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  accent: number;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}) {
  const theme = KPI_ACCENTS[accent % KPI_ACCENTS.length];
  return (
    <Card className={`relative overflow-hidden ${theme.border}`}>
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300 ${theme.strip}`}>
          {title}
        </div>
        <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${theme.glow} blur-xl`} />
        <div className="flex items-start justify-between p-3">
          <div>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${theme.icon}`}>{icon}</div>
        </div>
        <div className="flex items-center gap-1 px-3 pb-2 text-[11px] text-slate-500 dark:text-slate-400">
          {trend === 'up' ? <ArrowUp className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowDown className="h-3.5 w-3.5 text-red-600" />}
          <span>Trend analytics active</span>
          <BarChart3 className="h-3.5 w-3.5" />
          <PieChart className="h-3.5 w-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}
