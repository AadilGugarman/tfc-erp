import React, { useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { Purchase, Company } from "@/db/schema";
import { Button } from "@/components/ui/Button";
import { Printer, Share2 } from "lucide-react";

interface PurchaseViewerProps {
  purchase: Purchase;
  currentCompany: Company | null;
}

export function PurchaseViewer({ purchase, currentCompany }: PurchaseViewerProps) {
  const purchaseRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (purchaseRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Purchase ${purchase.purchaseNo}</title>
              <style>
                body { font-family: sans-serif; margin: 0; padding: 20px; }
                .purchase-container { width: 80mm; margin: 0 auto; padding: 10mm; border: 1px solid #ccc; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 1.2em; }
                .details { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.8em; }
                .items table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .items th, .items td { border: 1px solid #eee; padding: 5px; text-align: left; }
                .items th { background-color: #f0f0f0; }
                .totals { text-align: right; font-size: 0.8em; }
                .footer { margin-top: 30px; text-align: center; font-size: 0.7em; }
              </style>
            </head>
            <body>
              <div class="purchase-container">
                <div class="header">
                  <h1>${currentCompany?.name || "Your Company"}</h1>
                  <p>${currentCompany?.address || ""}</p>
                  <p>Mobile: ${currentCompany?.phone || ""}</p>
                </div>
                <div class="details">
                  <div>
                    <strong>Purchase No:</strong> ${purchase.purchaseNo}<br/>
                    <strong>Date:</strong> ${formatDate(purchase.date)}<br/>
                    <strong>GSTIN:</strong> ${currentCompany?.gstin || ""}
                  </div>
                  <div>
                    <strong>BILLED FROM:</strong><br/>
                    ${purchase.supplierName}<br/>
                    ${purchase.supplierId ? "Mobile: " + (useAppStore.getState().suppliers.find(s => s.id === purchase.supplierId)?.phone || "") : ""}
                  </div>
                </div>
                <div class="items">
                  <table>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Fruit Item</th>
                        <th>Variety</th>
                        <th>Caret Qty</th>
                        <th>Net Wt (kg)</th>
                        <th>Rate (₹/kg)</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${purchase.items
                        .map(
                          (item, idx) => `
                          <tr>
                            <td>${idx + 1}</td>
                            <td>${item.fruitName}</td>
                            <td>${item.vakkal}</td>
                            <td>${item.boxCount} C</td>
                            <td>${item.totalWeight} kg</td>
                            <td>₹${item.rate.toLocaleString()}</td>
                            <td>₹${(item.rate * item.totalWeight).toLocaleString()}</td>
                          </tr>
                        `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
                <div class="totals">
                  <p><strong>Today Purchase Amount:</strong> ₹${purchase.total.toLocaleString()}</p>
                  <p><strong>Add: Previous Outstanding:</strong> ₹${purchase.previousBalance.toLocaleString()}</p>
                  <p><strong>Less: Cash/UPI Paid Now:</strong> ₹${purchase.paidAmount.toLocaleString()}</p>
                  <p><strong>Remaining Due Balance:</strong> ₹${purchase.netBalance.toLocaleString()}</p>
                </div>
                <div class="footer">
                  <p>Bank Details: ${currentCompany?.bankName || ""}, A/C: ${currentCompany?.bankAccountNumber || ""}, IFSC: ${currentCompany?.bankIfsc || ""}</p>
                  <p>UPI ID: ${currentCompany?.upiId || ""}</p>
                  <p>Notes: ${purchase.notes || ""}</p>
                  <p>This is a computer generated purchase order.</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleShareOnWhatsApp = () => {
    const message = `Purchase No: ${purchase.purchaseNo}\nDate: ${formatDate(purchase.date)}\nBilled From: ${purchase.supplierName}\nTotal Amount: ₹${purchase.total.toLocaleString()}\nPaid Now: ₹${purchase.paidAmount.toLocaleString()}\nBalance Due: ₹${purchase.netBalance.toLocaleString()}\n\nItems:\n${purchase.items.map(item => `- ${item.fruitName} (${item.boxCount} C) - ${item.totalWeight} kg @ ₹${item.rate} = ₹${(item.rate * item.totalWeight).toLocaleString()}`).join("\n")}\n\nBank Details: ${currentCompany?.bankName || ""}, A/C: ${currentCompany?.bankAccountNumber || ""}, IFSC: ${currentCompany?.bankIfsc || ""}\nUPI ID: ${currentCompany?.upiId || ""}\n\n${currentCompany?.name || "Your Company"}\n${currentCompany?.phone || ""}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-slate-900 rounded-lg shadow-inner">
      <div ref={purchaseRef} className="purchase-content">
        {/* Purchase Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentCompany?.name || "Your Company"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {currentCompany?.address || ""}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mobile: {currentCompany?.phone || ""}
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">PURCHASE ORDER</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Purchase No: {purchase.purchaseNo}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Date: {formatDate(purchase.date)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              GSTIN: {currentCompany?.gstin || ""}
            </p>
          </div>
        </div>

        {/* Billed From */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">BILLED FROM:</p>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">{purchase.supplierName}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mobile No: {useAppStore.getState().suppliers.find(s => s.id === purchase.supplierId)?.phone || ""}
          </p>
        </div>

        {/* Items Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                <th className="p-2 border border-slate-200 dark:border-slate-700">No</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700">Fruit Item</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700">Variety</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">Caret Qty</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">Net Wt (kg)</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 text-right">Rate (₹/kg)</th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, idx) => (
                <tr key={idx} className="even:bg-slate-50 dark:even:bg-slate-800">
                  <td className="p-2 border border-slate-200 dark:border-slate-700">{idx + 1}</td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700">{item.fruitName}</td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700">{item.vakkal}</td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">{item.boxCount} C</td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">{item.totalWeight} kg</td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 text-right">₹{item.rate.toLocaleString()}</td>
                  <td className="p-2 border border-slate-200 dark:border-slate-700 text-right">₹{(item.rate * item.totalWeight).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-between mb-6">
          <div className="w-1/2">
            <p className="text-sm text-slate-600 dark:text-slate-400">Bank Details for Remittance:</p>
            <p className="text-base font-medium text-slate-900 dark:text-white">${currentCompany?.bankName || ""}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Acc: ${currentCompany?.bankAccountNumber || ""}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">IFSC: ${currentCompany?.bankIfsc || ""}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">UPI: ${currentCompany?.upiId || ""}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">Notes: {purchase.notes || "None"}</p>
          </div>
          <div className="w-1/2 text-right">
            <p className="text-base text-slate-700 dark:text-slate-300">Today Purchase Amount: <span className="font-bold">₹{purchase.total.toLocaleString()}</span></p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Add: Previous Outstanding: <span className="font-medium">₹{purchase.previousBalance.toLocaleString()}</span></p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Less: Cash/UPI Paid Now: <span className="font-medium">₹{purchase.paidAmount.toLocaleString()}</span></p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Remaining Due Balance: ₹{purchase.netBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 mt-6 print:hidden">
          <Button variant="outline" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Print Purchase
          </Button>
          <Button onClick={handleShareOnWhatsApp} icon={<Share2 className="w-4 h-4" />}>
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
