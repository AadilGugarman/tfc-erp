import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import { Printer, FileText } from 'lucide-react';

export function PrintPreviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Print Preview / પ્રિન્ટ પ્રિવ્યૂ</h1>
        </div>
        <Button className="gap-2"><Printer className="h-4 w-4" /> Print</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="print:bg-white">
          <CardHeader>
            <CardTitle>Ledger-style invoice preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">ફળ માર્કેટ ERP</h2>
              </div>
              <Badge variant="info">Bill #FM-1001</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="text-xs text-slate-500">Party</p>
                <p className="font-medium">રાજેશ પટેલ</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium">11/05/2026</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Weight</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200">
                    <td className="px-3 py-2">Banana</td>
                    <td className="px-3 py-2">48 kg</td>
                    <td className="px-3 py-2">₹18</td>
                    <td className="px-3 py-2">{formatCurrency(1728)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Print actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3">
              <FileText className="h-4 w-4" /> Compact invoice layout
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="font-medium text-slate-900 dark:text-white">Recommended workflow</p>
              <ol className="mt-2 space-y-1 text-xs">
                <li>1. Select bill or register entry</li>
                <li>2. Confirm print layout</li>
                <li>3. Send to thermal or A4 printer</li>
              </ol>
            </div>
            <Button variant="outline" className="w-full">Open system print dialog</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}