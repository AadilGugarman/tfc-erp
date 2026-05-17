import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Menu,
  Bell,
  ChevronDown,
  Users,
  UserCheck,
  Truck,
  Clock,
  Grid3X3,
  List,
  X,
  Download,
  Upload,
  ArrowUpDown,
  Building2,
  Mail,
  Phone,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PartyCard } from './components/PartyCard';
import { NewPartyModal } from './components/NewPartyModal';
import { PartyDetailDrawer } from './components/PartyDetailDrawer';
import { StatCard } from './components/StatCard';
import { MOCK_PARTIES } from './data/mockData';
import type { Party, NewPartyForm } from './types/party';

type FilterTab = 'all' | 'customer' | 'vendor' | 'both';
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';
type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'code' | 'balance' | 'orders';

const STATUS_CONFIG = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
};

const TYPE_CONFIG = {
  customer: { label: 'Customer', bg: 'bg-sky-50', text: 'text-sky-600' },
  vendor: { label: 'Vendor', bg: 'bg-violet-50', text: 'text-violet-600' },
  both: { label: 'Both', bg: 'bg-teal-50', text: 'text-teal-600' },
};

export default function App() {
  const [parties, setParties] = useState<Party[]>(MOCK_PARTIES);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [showModal, setShowModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [_showFilters, _setShowFilters] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = parties.length;
    const customers = parties.filter(p => p.type === 'customer' || p.type === 'both').length;
    const vendors = parties.filter(p => p.type === 'vendor' || p.type === 'both').length;
    const pending = parties.filter(p => p.status === 'pending').length;
    return { total, customers, vendors, pending };
  }, [parties]);

  // Filtered & sorted parties
  const filtered = useMemo(() => {
    let list = [...parties];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q) ||
        p.address.city.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeTab !== 'all') list = list.filter(p => p.type === activeTab);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    list.sort((a, b) => {
      switch (sortField) {
        case 'name': return a.name.localeCompare(b.name);
        case 'code': return a.code.localeCompare(b.code);
        case 'balance': return b.balance - a.balance;
        case 'orders': return b.totalOrders - a.totalOrders;
        default: return 0;
      }
    });
    return list;
  }, [parties, search, activeTab, statusFilter, sortField]);

  const handleSaveParty = (form: NewPartyForm) => {
    const newParty: Party = {
      id: Date.now().toString(),
      code: form.code || `PTY-${String(parties.length + 1).padStart(3, '0')}`,
      name: form.name,
      type: (form.type || 'customer') as Party['type'],
      status: form.status,
      email: form.email,
      phone: form.phone,
      website: form.website,
      contactPerson: form.contactPerson,
      designation: form.designation,
      address: form.address,
      currency: form.currency,
      creditLimit: parseFloat(form.creditLimit) || 0,
      paymentTerms: (form.paymentTerms || 'net30') as Party['paymentTerms'],
      taxId: form.taxId,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      ifsc: form.ifsc,
      notes: form.notes,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      balance: 0,
      totalOrders: 0,
      avatarColor: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][parties.length % 6],
    };
    setParties(prev => [newParty, ...prev]);
  };

  const filterTabs: { id: FilterTab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all', label: 'All Parties', icon: Users, count: parties.length },
    { id: 'customer', label: 'Customers', icon: UserCheck, count: parties.filter(p => p.type === 'customer').length },
    { id: 'vendor', label: 'Vendors', icon: Truck, count: parties.filter(p => p.type === 'vendor').length },
    { id: 'both', label: 'Dual', icon: Building2, count: parties.filter(p => p.type === 'both').length },
  ];

  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-slate-100 flex items-center gap-4 px-4 lg:px-6 z-30 relative">
          {/* Mobile menu button */}
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={17} />
          </button>

          {/* Page breadcrumb + title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span>ERP</span>
              <span className="text-slate-200">/</span>
              <span className="text-slate-600 font-semibold">Parties</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-300 text-slate-700
                focus:outline-none focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                hover:border-slate-300 transition-all duration-150"
              placeholder="Search parties, contacts, codes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                onClick={() => setSearch('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Import/Export — hidden on small */}
            <div className="hidden md:flex items-center gap-1">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <Upload size={13} />
                <span className="hidden lg:inline">Import</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <Download size={13} />
                <span className="hidden lg:inline">Export</span>
              </button>
            </div>

            {/* Notification */}
            <button className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border border-slate-100">
              <Bell size={15} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>

            {/* New Party CTA */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white
                hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-150
                shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200/60"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>New Party</span>
            </button>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-5">

            {/* Page title + description */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Parties</h1>
                <p className="text-sm text-slate-400 mt-0.5 font-medium">
                  Manage customers, vendors & business relationships
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  {filtered.length} of {parties.length} parties
                </span>
                {(search || activeTab !== 'all' || statusFilter !== 'all') && (
                  <button
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                    onClick={() => { setSearch(''); setActiveTab('all'); setStatusFilter('all'); }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Total Parties"
                value={String(stats.total)}
                change="+2 this month"
                positive={true}
                icon={Users}
                color="#6366f1"
                bgColor="#eef2ff"
              />
              <StatCard
                label="Active Customers"
                value={String(stats.customers)}
                change="75% retention"
                positive={true}
                icon={UserCheck}
                color="#0ea5e9"
                bgColor="#f0f9ff"
              />
              <StatCard
                label="Active Vendors"
                value={String(stats.vendors)}
                change="Stable"
                positive={true}
                icon={Truck}
                color="#10b981"
                bgColor="#f0fdf4"
              />
              <StatCard
                label="Pending KYC"
                value={String(stats.pending)}
                change="Action needed"
                positive={false}
                icon={Clock}
                color="#f59e0b"
                bgColor="#fffbeb"
              />
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
              <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
                {/* Type tabs */}
                <div className="flex items-center bg-slate-50 rounded-xl p-1 gap-0.5">
                  {filterTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        activeTab === tab.id
                          ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <tab.icon size={12} strokeWidth={activeTab === tab.id ? 2.2 : 1.8} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                      }`}>{tab.count}</span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-6 bg-slate-100" />

                {/* Status chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'active', 'inactive', 'pending'] as StatusFilter[]).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                        statusFilter === status
                          ? status === 'all'
                            ? 'bg-slate-800 text-white'
                            : status === 'active'
                            ? 'bg-emerald-500 text-white'
                            : status === 'inactive'
                            ? 'bg-slate-500 text-white'
                            : 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {status !== 'all' && (
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          statusFilter === status ? 'bg-white/70' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].dot
                        }`} />
                      )}
                      {status === 'all' ? 'All Status' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                    </button>
                  ))}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Sort + View controls */}
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <select
                      value={sortField}
                      onChange={e => setSortField(e.target.value as SortField)}
                      className="appearance-none pl-7 pr-6 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none hover:border-slate-300 transition-colors cursor-pointer"
                    >
                      <option value="name">Name</option>
                      <option value="code">Code</option>
                      <option value="balance">Balance</option>
                      <option value="orders">Orders</option>
                    </select>
                    <ArrowUpDown size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                        viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Grid3X3 size={12} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                        viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <List size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content area */}
            {filtered.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-inner">
                  <Users size={28} className="text-slate-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-2">
                  {search || activeTab !== 'all' || statusFilter !== 'all' ? 'No parties found' : 'No parties yet'}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                  {search
                    ? `No results for "${search}". Try a different search term.`
                    : 'Start by adding your first customer, vendor, or business partner.'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  <Plus size={15} />
                  Add First Party
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(party => (
                  <PartyCard key={party.id} party={party} onView={setSelectedParty} />
                ))}
              </div>
            ) : (
              /* List view */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_120px_80px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                  {['Party', 'Type', 'Contact', 'Balance', 'Orders', ''].map(h => (
                    <div key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</div>
                  ))}
                </div>
                {/* Rows */}
                <div className="divide-y divide-slate-50">
                  {filtered.map(party => {
                    const statusCfg = STATUS_CONFIG[party.status];
                    const typeCfg = TYPE_CONFIG[party.type];
                    const initials = party.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                    return (
                      <div
                        key={party.id}
                        className="flex flex-col md:grid md:grid-cols-[1fr_140px_140px_120px_120px_80px] gap-4 px-5 py-4 items-start md:items-center hover:bg-slate-50/60 transition-colors cursor-pointer group"
                        onClick={() => setSelectedParty(party)}
                      >
                        {/* Party info */}
                        <div className="flex items-center gap-3">
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: party.avatarColor, boxShadow: `0 2px 6px ${party.avatarColor}40` }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">{party.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{party.code}</div>
                          </div>
                        </div>

                        {/* Type */}
                        <div>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeCfg.bg} ${typeCfg.text}`}>
                            {typeCfg.label}
                          </span>
                        </div>

                        {/* Contact */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail size={11} className="text-slate-300 flex-shrink-0" />
                            <span className="text-xs truncate max-w-[110px]">{party.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={11} className="text-slate-300 flex-shrink-0" />
                            <span className="text-xs">{party.phone || '—'}</span>
                          </div>
                        </div>

                        {/* Balance */}
                        <div>
                          <div className={`text-sm font-bold flex items-center gap-1 ${party.balance >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                            {party.balance > 0 ? <TrendingUp size={11} className="text-emerald-500" /> :
                             party.balance < 0 ? <TrendingDown size={11} className="text-rose-400" /> : null}
                            {Math.abs(party.balance) >= 1000
                              ? `${party.balance < 0 ? '-' : ''}${party.currency === 'USD' ? '$' : party.currency}${(Math.abs(party.balance) / 1000).toFixed(1)}k`
                              : `${party.balance < 0 ? '-' : ''}${party.balance === 0 ? '$0' : `$${Math.abs(party.balance)}`}`
                            }
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                            {statusCfg.label}
                          </div>
                        </div>

                        {/* Orders */}
                        <div className="text-sm font-bold text-slate-700">
                          {party.totalOrders}
                          <span className="text-xs font-normal text-slate-400 ml-1">orders</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      <NewPartyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveParty}
      />

      <PartyDetailDrawer
        party={selectedParty}
        onClose={() => setSelectedParty(null)}
      />
    </div>
  );
}
