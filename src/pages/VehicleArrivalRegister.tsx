import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CalendarDays, Download, FileSpreadsheet,
  Filter, IndianRupee, PackageCheck, Plus, Printer, Save,
  Search, Trash2, Truck, Users, Weight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

/* ───────── types ───────── */
type Row = {
  id: number;
  partyName: string;
  vakkal: string;
  carat: number;
  weight: number;
  rate: number;
  remarks: string;
};

const blank = (id: number): Row => ({ id, partyName: '', vakkal: '', carat: 0, weight: 0, rate: 0, remarks: '' });

const cols: { key: keyof Row; label: string; guj: string; numeric?: boolean }[] = [
  { key: 'partyName', label: 'Party Name', guj: 'પાર્ટી નામ' },
  { key: 'vakkal', label: 'Vakkal', guj: 'વક્કલ' },
  { key: 'carat', label: 'Carat', guj: 'કેરેટ', numeric: true },
  { key: 'weight', label: 'Weight (kg)', guj: 'વજન', numeric: true },
  { key: 'rate', label: 'Rate (₹)', guj: 'ભાવ', numeric: true },
  { key: 'remarks', label: 'Remarks', guj: 'નોંધ' },
];

const demoEntries = [
  { id: 'VR-1027', vehicle: 'GJ-18-BT-4821', wt: 2840, amt: 186400, st: 'Saved' },
  { id: 'VR-1026', vehicle: 'GJ-01-CX-2199', wt: 1680, amt: 92400, st: 'Pending' },
  { id: 'VR-1025', vehicle: 'RJ-27-GA-7761', wt: 2320, amt: 151800, st: 'Saved' },
  { id: 'VR-1024', vehicle: 'GJ-05-AB-3312', wt: 3100, amt: 217000, st: 'Saved' },
  { id: 'VR-1023', vehicle: 'MH-04-FG-9988', wt: 1450, amt: 101500, st: 'Pending' },
];

/* ───────── main ───────── */
export function VehicleArrivalRegisterPage() {
  const [tab, setTab] = useState<'register' | 'inventory' | 'reports' | 'party' | 'search' | 'print'>('register');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vehicle, setVehicle] = useState('GJ-18-BT-4821');
  const [driver, setDriver] = useState('Rameshbhai');
  const [status, setStatus] = useState('Draft');
  const [rows, setRows] = useState<Row[]>([
    { id: 1, partyName: 'Jay Ambe Traders', vakkal: 'Mango Kesar', carat: 45, weight: 720, rate: 68, remarks: 'પાકું માલ' },
    { id: 2, partyName: 'Shree Krishna Fruit', vakkal: 'Apple Shimla', carat: 32, weight: 512, rate: 92, remarks: 'Cash pending' },
    { id: 3, partyName: 'Patel Brothers', vakkal: 'Banana', carat: 60, weight: 900, rate: 28, remarks: '' },
    { id: 4, partyName: 'Desai Fruit Mart', vakkal: 'Pomegranate', carat: 18, weight: 288, rate: 145, remarks: 'A-grade' },
    { id: 5, partyName: 'Gujarat Agro', vakkal: 'Grapes', carat: 25, weight: 400, rate: 110, remarks: '' },
  ]);
  const gridRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => {
    const tw = rows.reduce((s, r) => s + Number(r.weight || 0), 0);
    const gt = rows.reduce((s, r) => s + Number(r.weight || 0) * Number(r.rate || 0), 0);
    return { tw, gt, pending: Math.round(gt * 0.28) };
  }, [rows]);

  const updateRow = (i: number, k: keyof Row, v: string) =>
    setRows(p => { const n = [...p]; (n[i] as any)[k] = cols.find(c => c.key === k)?.numeric ? Number(v) : v; return n; });

  const addRow = () => { setRows(p => [...p, blank(Date.now())]); setTimeout(() => focus(rows.length, 0), 30); };
  const delRow = (i: number) => setRows(p => p.filter((_, idx) => idx !== i));

  const focus = (r: number, c: number) => {
    const el = gridRef.current?.querySelector<HTMLInputElement>(`[data-r="${r}"][data-c="${c}"]`);
    el?.focus(); el?.select();
  };

  const onKey = (e: React.KeyboardEvent, r: number, c: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const lastC = c === cols.length - 1, lastR = r === rows.length - 1;
      if (lastC && lastR) { addRow(); return; }
      focus(lastC ? r + 1 : r, lastC ? 0 : c + 1);
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); focus(Math.min(r + 1, rows.length - 1), c); }
    if (e.key === 'ArrowUp') { e.preventDefault(); focus(Math.max(r - 1, 0), c); }
  };

  const save = () => { setStatus('Saved'); toast.success('Vehicle register page saved!'); };

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  const widgets = [
    { l: "Today's Amount", g: 'આજનો કુલ રકમ', v: fmt(totals.gt), icon: IndianRupee, bg: 'bg-blue-50 dark:bg-blue-950/40', ic: 'text-blue-600' },
    { l: 'Total Vehicles', g: 'કુલ વાહન', v: '18', icon: Truck, bg: 'bg-emerald-50 dark:bg-emerald-950/40', ic: 'text-emerald-600' },
    { l: 'Total Weight', g: 'કુલ વજન', v: totals.tw.toLocaleString('en-IN') + ' kg', icon: Weight, bg: 'bg-purple-50 dark:bg-purple-950/40', ic: 'text-purple-600' },
    { l: 'Pending', g: 'બાકી રકમ', v: fmt(totals.pending), icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/40', ic: 'text-amber-600' },
  ];

  const tabs: [typeof tab, string][] = [
    ['register', '📋 Register Entry'], ['inventory', '📦 Inventory Link'],
    ['reports', '📊 Vehicle Report'], ['party', '👥 Party Ledger'],
    ['search', '🔍 Search & Filters'], ['print', '🖨️ Print Preview'],
  ];

  return (
    <div className="space-y-5">
      {/* ── HERO ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #08254a 0%, #0d3b7a 100%)' }}>
        <div className="p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Inventory + Vehicle Ledger</p>
          <h1 className="mt-2 text-3xl font-extrabold">Vehicle Wise Ledger Register</h1>
          <p className="mt-1 text-blue-200 text-sm">ડિજિટલ વાહન રજીસ્ટર — Spreadsheet speed with Tally-style accounting control.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {widgets.map(w => (
              <div key={w.l} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <w.icon className="w-5 h-5 mb-2 text-blue-200" />
                <p className="text-xs text-blue-200">{w.l}</p>
                <p className="text-[10px] text-blue-300">{w.g}</p>
                <p className="text-xl font-extrabold mt-1">{w.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1.5">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition
              ${tab === k ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── REGISTER ── */}
      {tab === 'register' && (
        <div className="space-y-4">
          {/* Header fields */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <HeaderField icon={<CalendarDays className="w-4 h-4" />} label="Date" guj="તારીખ" type="date" value={date} onChange={setDate} />
            <HeaderField icon={<Truck className="w-4 h-4" />} label="Vehicle Number" guj="વાહન નંબર" value={vehicle} onChange={setVehicle} />
            <HeaderField icon={<Users className="w-4 h-4" />} label="Driver Name" guj="ડ્રાઇવર" value={driver} onChange={setDriver} />
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-400">Entry Number</p>
              <div className="mt-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2">
                <span className="font-extrabold text-blue-700 dark:text-blue-300">VR-1028</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${status === 'Saved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{status}</span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="font-bold text-base">Digital Register Page</h2>
                <p className="text-xs text-gray-400">Tab / Enter → next cell · Last cell → new row · Arrow keys ↑↓</p>
              </div>
              <div className="flex gap-2">
                <button onClick={addRow} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
                <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow">
                  <Save className="w-4 h-4" /> Save Entry
                </button>
              </div>
            </div>

            <div ref={gridRef} className="overflow-auto" style={{ maxHeight: '52vh' }}>
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left w-10">#</th>
                    {cols.map(c => (
                      <th key={c.key} className="border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left min-w-[100px]">
                        {c.label} <span className="text-[10px] font-normal text-gray-400 ml-1">{c.guj}</span>
                      </th>
                    ))}
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-right min-w-[110px]">Total</th>
                    <th className="border border-gray-200 dark:border-gray-700 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.id} className={ri % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/70 dark:bg-gray-800/60'}>
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-1 text-gray-400 text-center font-mono text-xs">{ri + 1}</td>
                      {cols.map((c, ci) => (
                        <td key={c.key} className="border border-gray-200 dark:border-gray-700 p-0">
                          <input
                            data-r={ri} data-c={ci}
                            type={c.numeric ? 'number' : 'text'}
                            value={row[c.key]}
                            onChange={e => updateRow(ri, c.key, e.target.value)}
                            onKeyDown={e => onKey(e, ri, ci)}
                            className="w-full h-11 px-3 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-950/30 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            style={{ minWidth: c.key === 'partyName' ? 180 : c.key === 'remarks' ? 150 : 90 }}
                          />
                        </td>
                      ))}
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-1 text-right font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                        {fmt(row.weight * row.rate)}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-1 text-center">
                        <button onClick={() => delRow(ri)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary footer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <SummaryCard label="Total Weight" value={totals.tw.toLocaleString('en-IN') + ' kg'} />
              <SummaryCard label="Total Rows" value={String(rows.length)} />
              <SummaryCard label="Grand Total" value={fmt(totals.gt)} accent />
              <SummaryCard label="Pending" value={fmt(totals.pending)} warn />
            </div>
          </div>
        </div>
      )}

      {/* ── INVENTORY ── */}
      {tab === 'inventory' && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3 mb-5">
              <PackageCheck className="w-6 h-6 text-blue-600" />
              <div><h2 className="text-lg font-bold">Inventory Integration</h2><p className="text-xs text-gray-400">Vehicle entry auto-maps stock inward/outward.</p></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-900"><tr>{['Item','Available','Vehicle Deduct','Balance'].map(h=><th key={h} className="p-3 text-left font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {([['Mango Kesar',4250,720],['Apple Shimla',2200,512],['Banana',5400,900],['Pomegranate',1200,288],['Grapes',1800,400]] as [string,number,number][]).map(([n,a,d])=>(
                    <tr key={n} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-medium">{n}</td>
                      <td className="p-3 text-right">{a} kg</td>
                      <td className="p-3 text-right text-red-600 font-semibold">−{d} kg</td>
                      <td className="p-3 text-right font-bold">{a - d} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h3 className="font-bold">Linked Vehicle</h3>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{vehicle}</p>
            <SummaryCard label="Stock Movement" value={totals.tw.toLocaleString('en-IN') + ' kg'} />
            <SummaryCard label="Inventory Value" value={fmt(totals.gt)} />
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-700 dark:text-green-300 font-medium">
              ✅ Auto deduction is enabled after you click "Save Entry".
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab === 'reports' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div><h2 className="text-lg font-bold">Vehicle-wise Report</h2><p className="text-xs text-gray-400">Daily/monthly vehicle summary with export.</p></div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-semibold"><Filter className="inline w-4 h-4 mr-1" />Filter</button>
              <button className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold"><Download className="inline w-4 h-4 mr-1" />Export</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900"><tr>{['Entry','Vehicle','Weight','Amount','Status'].map(h=><th key={h} className="p-3 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {demoEntries.map(e=>(
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-mono text-xs">{e.id}</td>
                    <td className="p-3 font-bold">{e.vehicle}</td>
                    <td className="p-3">{e.wt} kg</td>
                    <td className="p-3 font-bold text-blue-700 dark:text-blue-300">{fmt(e.amt)}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.st==='Saved'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{e.st}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PARTY LEDGER ── */}
      {tab === 'party' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-lg font-bold">Party Ledger</h2>
          <p className="text-xs text-gray-400 mb-5">Party-wise transaction and outstanding history. પાર્ટી ખાતાવહી</p>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900"><tr>{['Party','Debit (Dr)','Credit (Cr)','Outstanding'].map(h=><th key={h} className="p-3 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[['Jay Ambe Traders',48960,12000],['Shree Krishna Fruit',47104,31375],['Patel Brothers',25200,8000],['Desai Fruit Mart',41760,15000],['Gujarat Agro',44000,20000]].map(([n,d,c])=>(
                  <tr key={n as string} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{n}</td>
                    <td className="p-3 text-right text-red-600">{fmt(d as number)}</td>
                    <td className="p-3 text-right text-green-600">{fmt(c as number)}</td>
                    <td className="p-3 text-right font-bold text-amber-600">{fmt((d as number) - (c as number))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEARCH ── */}
      {tab === 'search' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-5">
            <Search className="w-6 h-6 text-blue-600" />
            <div><h2 className="text-lg font-bold">Search & Filters</h2><p className="text-xs text-gray-400">Find by date, vehicle, party, vakkal, weight or amount.</p></div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[['Vehicle number','GJ-18-BT-'],['Party name',''],['Vakkal / Item','Mango'],['From date','date'],['Min amount',''],['','button']].map(([ph,t],i)=>(
              t === 'button' ? <button key={i} className="rounded-lg bg-blue-600 text-white px-4 py-3 font-bold hover:bg-blue-700">Apply Filters</button>
              : <input key={i} type={t === 'date' ? 'date' : 'text'} placeholder={ph} className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
            ))}
          </div>
        </div>
      )}

      {/* ── PRINT ── */}
      {tab === 'print' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button onClick={() => window.print()} className="rounded-lg bg-blue-600 text-white px-4 py-2 font-bold"><Printer className="inline w-4 h-4 mr-1.5" />Print A4</button>
            <button className="rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 font-bold"><FileSpreadsheet className="inline w-4 h-4 mr-1.5" />Excel</button>
          </div>
          <div className="print-register rounded-xl border-2 border-gray-800 bg-white p-8 text-black">
            <div className="text-center border-b-2 border-black pb-3 mb-4">
              <h2 className="text-2xl font-black tracking-wide">VEHICLE WISE LEDGER REGISTER</h2>
              <p className="font-semibold text-gray-600">વાહન પ્રમાણે ખાતાવહી રજીસ્ટર</p>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm border-b border-gray-300 pb-3 mb-4">
              <p><b>Date:</b> {date}</p><p><b>Entry:</b> VR-1028</p><p><b>Vehicle:</b> {vehicle}</p><p><b>Driver:</b> {driver}</p>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead><tr>{['No','Party Name','Vakkal','Carat','Weight','Rate','Total','Remarks'].map(h=><th key={h} className="border border-black p-2 bg-gray-100 text-left font-bold">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r,i)=><tr key={r.id}><td className="border border-black p-2">{i+1}</td><td className="border border-black p-2">{r.partyName}</td><td className="border border-black p-2">{r.vakkal}</td><td className="border border-black p-2 text-right">{r.carat}</td><td className="border border-black p-2 text-right">{r.weight}</td><td className="border border-black p-2 text-right">{r.rate}</td><td className="border border-black p-2 text-right font-bold">{r.weight*r.rate}</td><td className="border border-black p-2">{r.remarks}</td></tr>)}</tbody>
            </table>
            <div className="grid grid-cols-3 gap-4 mt-4 text-right font-bold text-sm">
              <p>Total Rows: {rows.length}</p>
              <p>Total Weight: {totals.tw.toLocaleString('en-IN')} kg</p>
              <p>Grand Total: {fmt(totals.gt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── small components ── */
function HeaderField({ icon, label, guj, value, onChange, type = 'text' }: { icon: React.ReactNode; label: string; guj: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label>
      <span className="text-[11px] font-bold uppercase text-gray-400">{label}</span>
      <span className="ml-1.5 text-[10px] text-gray-300">{guj}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
        <span className="text-gray-400">{icon}</span>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
      </div>
    </label>
  );
}

function SummaryCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <p className="text-[11px] font-bold uppercase text-gray-400">{label}</p>
      <p className={`mt-0.5 text-lg font-extrabold ${accent ? 'text-blue-700 dark:text-blue-300' : warn ? 'text-amber-600' : ''}`}>{value}</p>
    </div>
  );
}
