import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import * as db from '@/db/db';
import { Filter, Search } from 'lucide-react';

export function SearchPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    db.seedDemoData();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const parties = db.getParties().filter(item => item.name.toLowerCase().includes(q) || item.phone.includes(q));
    const suppliers = db.getSuppliers().filter(item => item.name.toLowerCase().includes(q) || item.phone.includes(q));
    const bills = db.getBills().filter(item => item.billNo.toLowerCase().includes(q) || item.partyName.toLowerCase().includes(q));
    const vehicles = db.getVehicleRegisters().filter(item => item.entryNo.toLowerCase().includes(q) || item.vehicleNumber.toLowerCase().includes(q) || item.driverName.toLowerCase().includes(q));
    return { parties, suppliers, bills, vehicles };
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search & Filter / શોધ</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Type a name, number, bill or vehicle" value={query} onChange={(event) => setQuery(event.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ResultCard title="Parties" count={results.parties.length}>
          {results.parties.map((party) => <ResultRow key={party.id} label={party.name} meta={`${party.city} • ${party.phone}`} badge={formatCurrency(db.getPartyBalance(party.id).balance)} />)}
        </ResultCard>
        <ResultCard title="Suppliers" count={results.suppliers.length}>
          {results.suppliers.map((supplier) => <ResultRow key={supplier.id} label={supplier.name} meta={`${supplier.city} • ${supplier.phone}`} badge={formatCurrency(db.getPartyBalance(supplier.id).balance)} />)}
        </ResultCard>
        <ResultCard title="Bills" count={results.bills.length}>
          {results.bills.map((bill) => <ResultRow key={bill.id} label={bill.billNo} meta={`${bill.partyName} • ${formatDate(bill.date)}`} badge={formatCurrency(bill.total)} />)}
        </ResultCard>
        <ResultCard title="Vehicle Arrival Registers" count={results.vehicles.length}>
          {results.vehicles.map((vehicle) => <ResultRow key={vehicle.id} label={vehicle.entryNo} meta={`${vehicle.vehicleNumber} • ${vehicle.driverName}`} badge={formatCurrency(vehicle.grandTotal)} />)}
        </ResultCard>
      </div>
    </div>
  );
}

function ResultCard({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant="outline">{count}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {count === 0 ? <p className="py-4 text-sm text-slate-500">No matches</p> : children}
      </CardContent>
    </Card>
  );
}

function ResultRow({ label, meta, badge }: { label: string; meta: string; badge: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      <Badge variant="info">{badge}</Badge>
    </div>
  );
}