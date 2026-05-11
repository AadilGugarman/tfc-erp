import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, todayStr } from '@/utils/formatters';
import * as db from '@/db/db';
import { Plus, Save, Truck, PackageCheck } from 'lucide-react';

type RowDraft = {
  id: string;
  partyId: string;
  partyName: string;
  fruitName: string;
  lotNo: string;
  vakkal: string;
  boxes: number;
  carat: number;
  weight: number;
  rate: number;
  commission: number;
  hamali: number;
  remarks: string;
  inventoryItemId?: string;
};

function emptyRow(id: string): RowDraft {
  return {
    id,
    partyId: '',
    partyName: '',
    fruitName: '',
    lotNo: '',
    vakkal: '',
    boxes: 0,
    carat: 0,
    weight: 0,
    rate: 0,
    commission: 0,
    hamali: 0,
    remarks: '',
    inventoryItemId: undefined,
  };
}

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

  const [date, setDate] = useState(todayStr());
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<RowDraft[]>([emptyRow('1')]);

  const entryTotal = useMemo(() => rows.reduce((sum, row) => {
    const base = row.carat * row.weight * row.rate;
    return sum + base + row.commission + row.hamali;
  }, 0), [rows]);

  const entryWeight = useMemo(() => rows.reduce((sum, row) => sum + row.weight, 0), [rows]);

  useEffect(() => {
    loadParties();
    loadInventory();
    loadVehicleRegisters();
  }, []);

  const updateRow = (id: string, key: keyof RowDraft, value: string | number) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const next: RowDraft = { ...row, [key]: value } as RowDraft;
      if (key === 'partyId') {
        const party = parties.find(p => p.id === String(value));
        next.partyName = party?.name || '';
      }
      if (key === 'inventoryItemId') {
        const item = inventoryItems.find(i => i.id === String(value));
        if (item) {
          next.fruitName = item.name;
        }
      }
      return next;
    }));
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow(Date.now().toString())]);
  };

  const resetForm = () => {
    setDate(todayStr());
    setVehicleNumber('');
    setDriverName('');
    setBrokerName('');
    setArrivalTime('');
    setNotes('');
    setRows([emptyRow('1')]);
  };

  const saveVehicleRegister = () => {
    if (!vehicleNumber.trim()) {
      showNotification('Vehicle number is required', 'error');
      return;
    }

    const validRows = rows.filter(row => row.fruitName.trim() && row.weight > 0 && row.rate > 0);
    if (validRows.length === 0) {
      showNotification('Add at least one valid row with item, weight and rate', 'error');
      return;
    }

    try {
      const saved = db.createVehicleRegister({
        date,
        vehicleNumber,
        driverName,
        brokerName,
        arrivalTime,
        status: 'posted',
        rows: validRows.map(row => ({
          lotNo: row.lotNo,
          partyId: row.partyId || undefined,
          partyName: row.partyName,
          fruitName: row.fruitName,
          vakkal: row.vakkal,
          boxes: row.boxes,
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

      showNotification(`Vehicle entry ${saved.entryNo} saved`, 'success');
      loadVehicleRegisters();
      loadInventory();
      resetForm();
    } catch (error) {
      showNotification((error as Error).message || 'Failed to save vehicle register', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-[4.15rem] z-20 rounded-xl border border-slate-200/85 dark:border-[#2a3550]/90 bg-white/94 dark:bg-[#0f1628]/94 backdrop-blur-xl shadow-[0_14px_28px_-22px_rgba(15,23,42,0.65)]">
        <div className="flex items-center justify-between p-3.5 sm:p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Arrival + Inventory Pipeline</p>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Vehicle Arrival Register</h1>
          </div>
          <Button onClick={saveVehicleRegister} className="gap-2" size="sm">
            <Save className="h-4 w-4" /> Save Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Input label="Vehicle Number *" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
              <Input label="Driver Name" value={driverName} onChange={e => setDriverName(e.target.value)} />
              <Input label="Broker Name" value={brokerName} onChange={e => setBrokerName(e.target.value)} />
              <Input label="Arrival Time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
              <Input label="Next Entry No" value={db.getNextVehicleEntryNo()} disabled />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Rows</h3>
                <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
              </div>

              {rows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#141d31]">
                  <div className="md:col-span-2">
                    <Select
                      value={row.partyId}
                      onChange={e => updateRow(row.id, 'partyId', e.target.value)}
                      options={[{ value: '', label: 'Party' }, ...parties.map(p => ({ value: p.id, label: p.name }))]}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Select
                      value={row.inventoryItemId || ''}
                      onChange={e => updateRow(row.id, 'inventoryItemId', e.target.value)}
                      options={[{ value: '', label: 'Item' }, ...inventoryItems.map(i => ({ value: i.id, label: `${i.name} (${i.grade})` }))]}
                    />
                  </div>
                  <div className="md:col-span-1"><Input value={row.lotNo} onChange={e => updateRow(row.id, 'lotNo', e.target.value)} placeholder="Lot" /></div>
                  <div className="md:col-span-1"><Input type="number" value={row.carat || ''} onChange={e => updateRow(row.id, 'carat', parseFloat(e.target.value) || 0)} placeholder="Carat" /></div>
                  <div className="md:col-span-1"><Input type="number" value={row.weight || ''} onChange={e => updateRow(row.id, 'weight', parseFloat(e.target.value) || 0)} placeholder="Wt" /></div>
                  <div className="md:col-span-1"><Input type="number" value={row.rate || ''} onChange={e => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)} placeholder="Rate" /></div>
                  <div className="md:col-span-1"><Input type="number" value={row.commission || ''} onChange={e => updateRow(row.id, 'commission', parseFloat(e.target.value) || 0)} placeholder="Comm" /></div>
                  <div className="md:col-span-1"><Input type="number" value={row.hamali || ''} onChange={e => updateRow(row.id, 'hamali', parseFloat(e.target.value) || 0)} placeholder="Hamali" /></div>
                  <div className="md:col-span-2"><Input value={row.remarks} onChange={e => updateRow(row.id, 'remarks', e.target.value)} placeholder="Remarks" /></div>
                  <div className="md:col-span-12 text-xs text-slate-500 dark:text-slate-400">
                    Row {index + 1} Total: {formatCurrency((row.carat * row.weight * row.rate) + row.commission + row.hamali)}
                  </div>
                </div>
              ))}
            </div>

            <TextArea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Total Rows</span><span className="font-semibold">{rows.length}</span></div>
            <div className="flex justify-between text-sm"><span>Total Weight</span><span className="font-semibold">{entryWeight.toFixed(2)} kg</span></div>
            <div className="flex justify-between text-sm"><span>Grand Total</span><span className="font-semibold">{formatCurrency(entryTotal)}</span></div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Saving this entry posts ledger debits and updates inventory stock.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Vehicle Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {vehicleRegisters
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 8)
            .map(entry => (
              <div key={entry.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{entry.entryNo} - {entry.vehicleNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(entry.date)} - {entry.driverName || 'Driver N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(entry.grandTotal)}</p>
                  <Badge variant={entry.status === 'posted' ? 'success' : entry.status === 'draft' ? 'warning' : 'danger'}>{entry.status}</Badge>
                </div>
              </div>
            ))}
          {vehicleRegisters.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No vehicle entries yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
