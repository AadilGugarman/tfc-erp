import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  IndianRupee,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency } from "@/utils/formatters";
import { useAppStore } from "@/stores/useAppStore";

type ReportType =
  | "sales"
  | "purchase"
  | "inventory"
  | "gst"
  | "profit"
  | "aging";

const COLORS = [
  "#22c55e",
  "#f97316",
  "#eab308",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

interface MonthlyData {
  month: string;
  sales: number;
  purchases: number;
  profit: number;
}

function generateMonthlyData(bills: any[], purchases: any[]): MonthlyData[] {
  const months: Record<string, { sales: number; purchases: number }> = {};
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  bills.forEach((bill) => {
    if (!bill.date) return;
    const date = new Date(bill.date);
    const key = monthNames[date.getMonth()];
    if (!months[key]) months[key] = { sales: 0, purchases: 0 };
    months[key].sales += bill.total || 0;
  });

  purchases.forEach((purchase) => {
    if (!purchase.date) return;
    const date = new Date(purchase.date);
    const key = monthNames[date.getMonth()];
    if (!months[key]) months[key] = { sales: 0, purchases: 0 };
    months[key].purchases += purchase.total || 0;
  });

  return Object.entries(months).map(([month, data]) => ({
    month,
    sales: data.sales,
    purchases: data.purchases,
    profit: data.sales - data.purchases,
  }));
}

function generateGSTData(bills: any[]) {
  const months: Record<string, { cgst: number; sgst: number; igst: number }> =
    {};
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  bills.forEach((bill) => {
    if (!bill.date || !bill.taxAmount) return;
    const date = new Date(bill.date);
    const key = monthNames[date.getMonth()];
    if (!months[key]) months[key] = { cgst: 0, sgst: 0, igst: 0 };
    const half = (bill.taxAmount || 0) / 2;
    months[key].cgst += Math.round(half);
    months[key].sgst += Math.round(half);
  });

  return Object.entries(months).map(([month, data]) => ({ month, ...data }));
}

function generateInventoryValue(items: any[]) {
  const byCat: Record<string, number> = {};
  items.forEach((item) => {
    const category = item.category || "Others";
    byCat[category] = (byCat[category] || 0) + (item.currentStock || 0) * 100;
  });
  return Object.entries(byCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function downloadBlob(content: BlobPart, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("sales");
  const {
    bills = [],
    purchases = [],
    inventoryItems = [],
    parties = [],
    showNotification,
  } = useAppStore();

  // Computed metrics
  const totalSales = useMemo(
    () => bills.reduce((s, b) => s + (b.total || 0), 0),
    [bills],
  );
  const totalPurchases = useMemo(
    () => purchases.reduce((s, p) => s + (p.total || 0), 0),
    [purchases],
  );
  const avgOrderValue = useMemo(
    () => (bills.length ? Math.round(totalSales / bills.length) : 0),
    [totalSales, bills],
  );
  const netProfit = useMemo(
    () => totalSales - totalPurchases,
    [totalSales, totalPurchases],
  );

  const monthlyData = useMemo(
    () => generateMonthlyData(bills, purchases),
    [bills, purchases],
  );
  const gstData = useMemo(() => generateGSTData(bills), [bills]);
  const totalCGST = useMemo(
    () => gstData.reduce((s, d) => s + d.cgst, 0),
    [gstData],
  );
  const totalSGST = useMemo(
    () => gstData.reduce((s, d) => s + d.sgst, 0),
    [gstData],
  );
  const totalIGST = useMemo(
    () => gstData.reduce((s, d) => s + d.igst, 0),
    [gstData],
  );

  const inventoryValue = useMemo(
    () => generateInventoryValue(inventoryItems),
    [inventoryItems],
  );
  const totalInventoryValue = useMemo(
    () => inventoryValue.reduce((s, i) => s + i.value, 0),
    [inventoryValue],
  );

  const agingAnalysis = useMemo(() => {
    const customerBalances = new Map<
      string,
      { name: string; outstanding: number }
    >();
    bills.forEach((bill) => {
      const balance = bill.netBalance || 0;
      if (balance > 0) {
        const existing = customerBalances.get(bill.partyId) || {
          name: bill.partyName,
          outstanding: 0,
        };
        existing.outstanding += balance;
        customerBalances.set(bill.partyId, existing);
      }
    });
    return Array.from(customerBalances.values()).sort(
      (a, b) => b.outstanding - a.outstanding,
    );
  }, [bills]);

  const handleExport = (format: "csv" | "excel") => {
    let data: Record<string, any>[] = [];
    let filename = "report";

    if (activeReport === "sales") {
      data = bills.map((b) => ({
        "Bill No": b.billNo,
        Date: b.date,
        Customer: b.partyName,
        Subtotal: b.subtotal,
        Commission: b.commission,
        "Tax Amount": b.taxAmount,
        Total: b.total,
        Status: b.status,
      }));
      filename = "sales-report";
    } else if (activeReport === "purchase") {
      data = purchases.map((p) => ({
        "PO No": p.purchaseNo,
        Date: p.date,
        Supplier: p.supplierName,
        Subtotal: p.subtotal,
        "Tax Amount": p.taxAmount,
        Total: p.total,
        Status: p.status,
      }));
      filename = "purchase-report";
    } else if (activeReport === "inventory") {
      data = inventoryItems.map((i) => ({
        Product: i.name,
        Category: i.category,
        Stock: i.currentStock,
        Unit: i.unit,
        Status: i.status,
        Warehouse: i.warehouse,
      }));
      filename = "inventory-valuation";
    } else if (activeReport === "gst") {
      data = gstData.map((d) => ({
        Month: d.month,
        CGST: d.cgst,
        SGST: d.sgst,
        IGST: d.igst,
        Total: d.cgst + d.sgst + d.igst,
      }));
      filename = "gst-report";
    } else if (activeReport === "profit") {
      data = monthlyData.map((d) => ({
        Month: d.month,
        Sales: d.sales,
        Purchases: d.purchases,
        Profit: d.profit,
      }));
      filename = "profit-loss";
    } else if (activeReport === "aging") {
      data = agingAnalysis.map((a) => ({
        Customer: a.name,
        Outstanding: a.outstanding,
      }));
      filename = "aging-analysis";
    }

    if (format === "csv") {
      const header = Object.keys(data[0] || {}).join(",");
      const body = data
        .map((row) =>
          Object.values(row)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      downloadBlob(`${header}\n${body}`, `${filename}.csv`, "text/csv");
    } else {
      const html = `<table border="1" cellspacing="0" cellpadding="8"><thead><tr>${Object.keys(
        data[0] || {},
      )
        .map((k) => `<th>${k}</th>`)
        .join("")}</tr></thead><tbody>${data
        .map(
          (row) =>
            `<tr>${Object.values(row)
              .map((v) => `<td>${v}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</tbody></table>`;
      downloadBlob(html, `${filename}.xls`, "application/vnd.ms-excel");
    }

    showNotification(
      `${filename} exported as ${format.toUpperCase()}`,
      "success",
    );
  };

  const reports = [
    { id: "sales" as const, label: "Sales Report", icon: TrendingUp },
    { id: "purchase" as const, label: "Purchase Report", icon: ShoppingCart },
    { id: "inventory" as const, label: "Inventory Valuation", icon: Package },
    { id: "gst" as const, label: "GST Report", icon: FileText },
    { id: "profit" as const, label: "Profit & Loss", icon: IndianRupee },
    { id: "aging" as const, label: "Aging Analysis", icon: Users },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive business reports and insights
          </p>
        </div>
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Download size={14} /> Export
          </button>
          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
            <button
              onClick={() => handleExport("csv")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <FileDown size={14} /> CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 transition-colors"
            >
              <FileDown size={14} /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <motion.button
              key={r.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveReport(r.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeReport === r.id
                  ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-green-300"
              }`}
            >
              <Icon size={14} />
              {r.label}
            </motion.button>
          );
        })}
      </div>

      {/* Report Content */}
      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
      >
        {activeReport === "sales" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Sales Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Sales
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(totalSales)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Avg. Order Value
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(avgOrderValue)}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Customers
                </p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {parties.length}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Invoices
                </p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {bills.length}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: any) => `₹${v / 1000}K`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Sales"
                />
                <Bar
                  dataKey="purchases"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  name="Purchases"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeReport === "purchase" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Purchase Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Purchases
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(totalPurchases)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total POs
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                  {purchases.length}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Avg. Order Value
                </p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {formatCurrency(
                    purchases.length
                      ? Math.round(totalPurchases / purchases.length)
                      : 0,
                  )}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: any) => `₹${v / 1000}K`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Purchases"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeReport === "inventory" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Inventory Valuation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={inventoryValue}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {inventoryValue.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `₹${Number(value).toLocaleString("en-IN")}`,
                      "Value",
                    ]}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {inventoryValue.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Total Value
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totalInventoryValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === "gst" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              GST Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  CGST
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(totalCGST)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  SGST
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(totalSGST)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  IGST
                </p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {formatCurrency(totalIGST)}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gstData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: any) => `₹${v / 1000}K`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="cgst" fill="#22c55e" name="CGST" stackId="gst" />
                <Bar dataKey="sgst" fill="#3b82f6" name="SGST" stackId="gst" />
                <Bar dataKey="igst" fill="#8b5cf6" name="IGST" stackId="gst" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeReport === "profit" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Profit & Loss Statement
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Revenue
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(totalSales)}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Expenses
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(totalPurchases)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Net Profit
                </p>
                <p
                  className={`text-lg font-bold mt-1 ${netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {formatCurrency(Math.abs(netProfit))}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: any) => `₹${v / 1000}K`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeReport === "aging" && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Customer Aging Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left pb-3 font-medium">Customer</th>
                    <th className="text-right pb-3 font-medium">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {agingAnalysis.length > 0 ? (
                    agingAnalysis.map((a) => (
                      <tr
                        key={a.name}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {a.name}
                        </td>
                        <td className="py-3 text-sm font-bold text-right text-gray-900 dark:text-white">
                          {formatCurrency(a.outstanding)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-8 text-center text-sm text-gray-400 dark:text-gray-500"
                      >
                        No outstanding balances found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
