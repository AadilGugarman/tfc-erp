import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CellValueChangedEvent, ColDef, ProcessDataFromClipboardParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import * as db from '@/db/db';
import type { VehicleRegisterRow } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { formatCurrency, todayStr } from '@/utils/formatters';
import { cn } from '@/utils/cn';

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
    <div className="flex flex-col gap-3 pb-28 animate-fade-in">
      {/* ── Entry bar ── */}
      <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-[14px] font-semibold text-slate-900 dark:text-white">Vehicle Arrival</h1>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#161b26] px-2 py-0.5 rounded">{entryNo}</span>
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide',
              status === 'posted'    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
              status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                       'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            )}>
              {status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-600">
            <span>{partyValues.length} parties</span>
            <span>·</span>
            <span>{fruitValues.length} items</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2.5">
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="Vehicle No" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="GJ-01-AB-1234" />
          <Input label="Driver" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Name" />
          <Input label="Broker" value={brokerName} onChange={e => setBrokerName(e.target.value)} placeholder="Agent name" />
          <Input label="Arrival Time" type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
          <Input label="Entry No" value={entryNo} disabled />
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as VehicleStatus)}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'posted', label: 'Posted' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#1a1f2e] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-[0.06em]">Inventory Grid</span>
          <Button variant="outline" size="sm" onClick={() => setRows(prev => [...prev, createRow()])}>
            <Plus className="h-3.5 w-3.5" /> Add Row
          </Button>
        </div>
        <div className="erp-grid ag-theme-quartz" style={{ '--ag-font-size': '13px', height: '58vh' } as CSSProperties}>
          <AgGridReact<GridRow>
            rowData={rowTotals}
            columnDefs={columns}
            defaultColDef={{ resizable: true, sortable: false, editable: true, singleClickEdit: true }}
            rowHeight={38}
            headerHeight={40}
            stopEditingWhenCellsLoseFocus
            animateRows={false}
            suppressRowClickSelection
            suppressMovableColumns
            enterNavigatesVertically
            enterNavigatesVerticallyAfterEdit
            processDataFromClipboard={processDataFromClipboard}
            onCellValueChanged={onCellValueChanged}
            getRowId={params => params.data.id}
            onCellKeyDown={params => {
              if (params.event.key === 'Enter' && params.node.rowIndex === rowTotals.length - 1) {
                setRows(current => ensureTrailingRow(current));
              }
            }}
          />
        </div>
      </div>

      {/* ── Sticky summary footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-[#1e2330] bg-white/95 dark:bg-[#0e1017]/95 backdrop-blur-md px-5 py-3" style={{ marginLeft: 'inherit' }}>
        <div className="flex items-center justify-between gap-4 max-w-full">
          <div className="flex items-center gap-6">
            <SummaryItem label="Weight" value={`${totalWeight.toFixed(2)} kg`} />
            <SummaryItem label="Rows" value={String(totalRows)} />
            <SummaryItem label="Amount" value={formatCurrency(totalAmount)} accent />
            <SummaryItem label="Pending" value={formatCurrency(pendingAmount)} />
            <SummaryItem label="Outstanding" value={formatCurrency(outstandingBalance)} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setRows(prev => [...prev, createRow()])}>
              <Plus className="h-3.5 w-3.5" /> Add Row
            </Button>
            <Button size="sm" onClick={saveRegister}>
              <Save className="h-3.5 w-3.5" /> Save Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400 dark:text-slate-600 font-medium mb-0.5">{label}</div>
      <div className={cn('text-[13px] font-semibold tabnum', accent ? 'text-[#3b5bdb] dark:text-[#8ba4f9]' : 'text-slate-800 dark:text-slate-200')}>{value}</div>
    </div>
  );
}
