import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CellValueChangedEvent, ColDef, ProcessDataFromClipboardParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Clock3, FileSpreadsheet, Hash, Package2, Plus, Save, Trash2, Truck, Users, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import * as db from '@/db/db';
import type { VehicleRegisterRow } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { formatCurrency, todayStr } from '@/utils/formatters';

type GridRow = VehicleRegisterRow;
type VehicleStatus = 'draft' | 'posted' | 'cancelled';

function createRow(partial: Partial<GridRow> = {}): GridRow {
  return {
    id: partial.id || crypto.randomUUID(),
    lotNo: partial.lotNo || '',
    partyId: partial.partyId,
    partyName: partial.partyName || '',
    fruitName: partial.fruitName || '',
    vakkal: partial.vakkal || '',
    boxes: partial.boxes ?? 0,
    carat: partial.carat ?? 0,
    weight: partial.weight ?? 0,
    rate: partial.rate ?? 0,
    commission: partial.commission ?? 0,
    hamali: partial.hamali ?? 0,
    total: partial.total ?? 0,
    remarks: partial.remarks || '',
    inventoryItemId: partial.inventoryItemId,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parseNumber(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function syncRelations(row: GridRow, parties: ReturnType<typeof db.getParties>, inventoryItems: ReturnType<typeof db.getInventoryItems>): GridRow {
  const matchedParty = parties.find((party) => normalize(party.name) === normalize(row.partyName));
  const matchedInventory = inventoryItems.find((item) => normalize(item.name) === normalize(row.fruitName));

  return {
    ...row,
    partyId: matchedParty?.id,
    inventoryItemId: matchedInventory?.id ?? row.inventoryItemId,
  };
}

function recalculate(row: GridRow): GridRow {
  const multiplier = Math.max(0, row.carat || 0);
  const baseAmount = multiplier * Math.max(0, row.weight || 0) * Math.max(0, row.rate || 0);

  return {
    ...row,
    total: Number((baseAmount + Math.max(0, row.commission || 0) + Math.max(0, row.hamali || 0)).toFixed(2)),
    updatedAt: new Date().toISOString(),
  };
}

function hasContent(row: GridRow) {
  return Boolean(
    row.lotNo.trim() ||
    row.partyName.trim() ||
    row.fruitName.trim() ||
    row.vakkal.trim() ||
    row.remarks.trim() ||
    row.boxes > 0 ||
    row.carat > 0 ||
    row.weight > 0 ||
    row.rate > 0 ||
    row.commission > 0 ||
    row.hamali > 0
  );
}

function currentArrivalTime() {
  return new Date().toTimeString().slice(0, 5);
}

export function VehicleArrivalRegisterPage() {
  const { parties, inventoryItems, loadParties, loadInventory, showNotification } = useAppStore();
  const [date, setDate] = useState(todayStr());
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [arrivalTime, setArrivalTime] = useState(currentArrivalTime());
  const [status, setStatus] = useState<VehicleStatus>('draft');
  const [rows, setRows] = useState<GridRow[]>([createRow()]);

  useEffect(() => {
    loadParties();
    loadInventory();
  }, [loadInventory, loadParties]);

  const entryNo = db.getNextVehicleEntryNo();
  const rowTotals = useMemo(() => rows.map(recalculate), [rows]);

  const totalWeight = rowTotals.reduce((sum, row) => sum + row.weight, 0);
  const totalAmount = rowTotals.reduce((sum, row) => sum + row.total, 0);
  const totalRows = rowTotals.filter(hasContent).length;
  const pendingAmount = totalAmount;
  const outstandingBalance = totalAmount;

  const partyValues = useMemo(() => parties.map((party) => party.name), [parties]);
  const fruitValues = useMemo(() => inventoryItems.map((item) => item.name), [inventoryItems]);

  const columns = useMemo<ColDef<GridRow>[]>(() => [
    { headerName: 'Lot No', field: 'lotNo', editable: true, width: 104, cellClass: 'erp-cell erp-text' },
    {
      headerName: 'Party',
      field: 'partyName',
      editable: true,
      minWidth: 180,
      flex: 1.1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: partyValues },
      cellClass: 'erp-cell erp-text',
    },
    {
      headerName: 'Fruit Item',
      field: 'fruitName',
      editable: true,
      minWidth: 180,
      flex: 1.1,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: fruitValues },
      cellClass: 'erp-cell erp-text',
    },
    { headerName: 'Vakkal', field: 'vakkal', editable: true, minWidth: 150, flex: 1, cellClass: 'erp-cell erp-text' },
    { headerName: 'Boxes', field: 'boxes', editable: true, width: 92, type: 'numericColumn', valueParser: (params) => parseNumber(params.newValue), cellClass: 'erp-cell erp-number' },
    { headerName: 'Carat', field: 'carat', editable: true, width: 92, type: 'numericColumn', valueParser: (params) => parseNumber(params.newValue), cellClass: 'erp-cell erp-number' },
    { headerName: 'Weight', field: 'weight', editable: true, width: 100, type: 'numericColumn', valueParser: (params) => parseNumber(params.newValue), cellClass: 'erp-cell erp-number' },
    { headerName: 'Rate', field: 'rate', editable: true, width: 92, type: 'numericColumn', valueParser: (params) => parseNumber(params.newValue), cellClass: 'erp-cell erp-number' },
    { headerName: 'Commission', field: 'commission', editable: true, width: 112, type: 'numericColumn', valueParser: (params) => parseNumber(params.newValue), cellClass: 'erp-cell erp-number' },
    { headerName: 'Hamali', field: 'hamali', editable: true, width: 92, type: 'numericColumn', valueParser: (params) => parseNumber(params.newValue), cellClass: 'erp-cell erp-number' },
    {
      headerName: 'Amount',
      field: 'total',
      editable: false,
      width: 132,
      type: 'numericColumn',
      cellClass: 'erp-cell erp-number font-semibold text-emerald-300',
      valueFormatter: (params) => formatCurrency(Number(params.value || 0)),
    },
    { headerName: 'Remarks', field: 'remarks', editable: true, minWidth: 220, flex: 1.2, cellClass: 'erp-cell erp-text' },
    {
      headerName: '',
      field: 'id',
      editable: false,
      width: 62,
      pinned: 'right',
      cellRenderer: ({ data }: { data: GridRow }) => (
        <button
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          onClick={() => setRows((current) => current.filter((row) => row.id !== data.id))}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ], [fruitValues, partyValues]);

  const ensureTrailingRow = (nextRows: GridRow[]) => {
    const lastRow = nextRows[nextRows.length - 1];
    if (lastRow && hasContent(lastRow)) {
      return [...nextRows, createRow()];
    }
    return nextRows;
  };

  const saveRegister = () => {
    const cleanedRows = rows
      .map((row) => recalculate(syncRelations(row, parties, inventoryItems)))
      .filter(hasContent);

    if (cleanedRows.length === 0) {
      showNotification('Add at least one arrival row', 'error');
      return;
    }

    db.createVehicleRegister({
      date,
      vehicleNumber: vehicleNumber.trim(),
      driverName: driverName.trim(),
      brokerName: brokerName.trim(),
      arrivalTime,
      status,
      rows: cleanedRows.map(({ id: _id, createdAt: _createdAt, updatedAt: _updatedAt, total: _total, ...row }) => row),
      pendingAmount,
      outstandingBalance,
      notes: '',
    });

    showNotification('Arrival register saved', 'success');
    setRows([createRow()]);
    setVehicleNumber('');
    setDriverName('');
    setBrokerName('');
    setArrivalTime(currentArrivalTime());
    setStatus('draft');
    loadParties();
    loadInventory();
  };

  const onCellValueChanged = (event: CellValueChangedEvent<GridRow>) => {
    setRows((current) => ensureTrailingRow(current.map((row) => (row.id === event.data.id ? recalculate(syncRelations({ ...event.data }, parties, inventoryItems)) : row))));
  };

  const processDataFromClipboard = (params: ProcessDataFromClipboardParams) => {
    const focusedRow = params.api.getFocusedCell()?.rowIndex ?? 0;
    const pastedRows = params.data ?? [];
    const requiredRows = focusedRow + pastedRows.length + 1;

    setRows((current) => {
      const next = [...current];
      while (next.length < requiredRows) {
        next.push(createRow());
      }
      return next;
    });

    return pastedRows;
  };

  return (
    <div className="space-y-4 pb-40 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/95 px-4 py-4 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              <Truck className="h-4 w-4" /> Mandi Vehicle Arrival Register
            </div>
            <h1 className="text-2xl font-semibold text-white">Vehicle Inventory Entry / વાહન આગમન રજીસ્ટર</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Enter mixed-party fruit lots from each arriving truck. This sheet posts stock movement, party ledger impact and vehicle history in one pass.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Badge variant="outline" className="border-slate-700 bg-slate-900/70 px-3 py-1.5 text-slate-300">{entryNo}</Badge>
            <Badge variant={status === 'posted' ? 'success' : status === 'cancelled' ? 'danger' : 'warning'} className="px-3 py-1.5 capitalize">{status}</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border-slate-700 bg-slate-900/70 text-white" />
          <Input label="Vehicle Number" value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} className="border-slate-700 bg-slate-900/70 text-white" />
          <Input label="Driver Name" value={driverName} onChange={(event) => setDriverName(event.target.value)} className="border-slate-700 bg-slate-900/70 text-white" />
          <Input label="Broker / Agent" value={brokerName} onChange={(event) => setBrokerName(event.target.value)} className="border-slate-700 bg-slate-900/70 text-white" />
          <Input label="Arrival Time" type="time" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} className="border-slate-700 bg-slate-900/70 text-white" />
          <Input label="Entry No" value={entryNo} disabled className="border-slate-800 bg-slate-900/60 text-slate-300" />
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as VehicleStatus)}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'posted', label: 'Posted' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            className="border-slate-700 bg-slate-900/70 text-white"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400 lg:grid-cols-4 xl:grid-cols-6">
          <HintChip icon={Hash} text="Lot No + Party + Item" />
          <HintChip icon={Users} text={`${partyValues.length} parties ready`} />
          <HintChip icon={Package2} text={`${fruitValues.length} fruit items`} />
          <HintChip icon={Clock3} text="Enter moves across cells" />
          <HintChip icon={FileSpreadsheet} text="Paste Excel rows directly" />
          <HintChip icon={Truck} text="Ledger + stock update on save" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-slate-950/20">
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Inventory Grid</h2>
              <p className="text-xs text-slate-500">Compact spreadsheet-style entry for mandi operations</p>
            </div>
            <Button variant="outline" onClick={() => setRows((prev) => [...prev, createRow()])} className="gap-2 border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Add Row
            </Button>
          </div>
        </div>

        <div className="p-3">
          <div className="erp-grid ag-theme-quartz h-[56vh] w-full overflow-hidden rounded-2xl border border-slate-800" style={{ '--ag-font-size': '13px' } as CSSProperties}>
            <AgGridReact<GridRow>
              rowData={rowTotals}
              columnDefs={columns}
              defaultColDef={{ resizable: true, sortable: false, editable: true, singleClickEdit: true }}
              rowHeight={42}
              headerHeight={42}
              stopEditingWhenCellsLoseFocus
              animateRows={false}
              suppressRowClickSelection
              suppressMovableColumns
              enterNavigatesVertically
              enterNavigatesVerticallyAfterEdit
              processDataFromClipboard={processDataFromClipboard}
              onCellValueChanged={onCellValueChanged}
              getRowId={(params) => params.data.id}
              onCellKeyDown={(params) => {
                if (params.event.key === 'Enter' && params.node.rowIndex === rowTotals.length - 1) {
                  setRows((current) => ensureTrailingRow(current));
                }
              }}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-3 z-20">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryTile label="Total Weight" value={`${totalWeight.toFixed(2)} kg`} />
            <SummaryTile label="Total Amount" value={formatCurrency(totalAmount)} />
            <SummaryTile label="Total Rows" value={String(totalRows)} />
            <SummaryTile label="Pending Amount" value={formatCurrency(pendingAmount)} />
            <SummaryTile label="Outstanding" value={formatCurrency(outstandingBalance)} highlight />
          </div>
          <div className="mt-3 flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
            <Button variant="outline" onClick={() => setRows((prev) => [...prev, createRow()])} className="gap-2 border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Add Row
            </Button>
            <Button onClick={saveRegister} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
              <Save className="h-4 w-4" /> Save Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HintChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-400">
      <Icon className="h-3.5 w-3.5 text-emerald-400" />
      <span>{text}</span>
    </div>
  );
}

function SummaryTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'rounded-2xl bg-emerald-500/15 px-3 py-2 text-emerald-100 ring-1 ring-emerald-500/20' : 'rounded-2xl bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800'}>
      <p className={highlight ? 'text-[11px] uppercase tracking-[0.2em] text-emerald-300/80' : 'text-[11px] uppercase tracking-[0.2em] text-slate-500'}>{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
