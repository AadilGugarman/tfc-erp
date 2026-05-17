import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/stores/useAppStore";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Section,
  PageTransition,
  ToastContainer,
  useToast,
} from "@/components";
import { PartyCard } from "@/components/PartyCard";
import { PartyDetailDrawer } from "@/components/PartyDetailDrawer";
import { StatCard } from "@/components/StatCard";
import { CreatePartyModal } from "@/components/CreatePartyModal";
import * as db from "@/db/db";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  ArrowUpDown,
  Users,
  Phone,
  MapPin,
  User,
  Building2,
  DollarSign,
} from "lucide-react";
import type { Party, PartyType } from "@/db/schema";
import { useShortcutAction } from "@/keyboard/shortcutManager";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatters";

type ViewMode = "grid" | "list";
type SortField = "name" | "city" | "balance" | "createdAt";

export function PartiesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { parties, currentCompanyId, loadParties } = useAppStore();
  const { toasts, removeToast, success, error } = useToast();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<PartyType | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<Party | null>(null);
  const [editParty, setEditParty] = useState<Party | null>(null);

  // Form states removed - now handled in CreatePartyModal
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadParties();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = parties.length;
    const customers = parties.filter(
      (p) => p.partyType === "customer" || p.partyType === "both",
    ).length;
    const suppliers = parties.filter(
      (p) => p.partyType === "supplier" || p.partyType === "both",
    ).length;
    const totalBalance = parties.reduce((sum, p) => sum + p.openingBalance, 0);
    return { total, customers, suppliers, totalBalance };
  }, [parties]);

  // Filter and sort parties
  const filtered = useMemo(() => {
    let list = [...parties];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.gstin.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q),
      );
    }

    // Type filter
    if (activeTab !== "all") {
      list = list.filter((p) => p.partyType === activeTab);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortField) {
        case "name":
          return a.name.localeCompare(b.name);
        case "city":
          return a.city.localeCompare(b.city);
        case "balance":
          return b.openingBalance - a.openingBalance;
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return list;
  }, [parties, search, activeTab, sortField]);

  const openNew = () => {
    setEditParty(null);
    setModalOpen(true);
  };

  const openEdit = (party: Party) => {
    setEditParty(party);
    setModalOpen(true);
  };

  const handleSave = async (formData: {
    name: string;
    phone: string;
    email: string;
    gstin: string;
    address: string;
    shippingAddress: string;
    city: string;
    state: string;
    openingBalance: number;
    balanceType: "debit" | "credit";
    commissionPercent: number;
    creditLimit: number;
    partyType: PartyType;
    notes: string;
  }) => {
    setSaveLoading(true);
    try {
      if (editParty) {
        db.updateParty(editParty.id, formData);
        success("Party Updated", "Party information updated successfully");
      } else {
        if (!currentCompanyId) {
          error("Validation Error", "No company selected");
          setSaveLoading(false);
          return;
        }
        db.addParty(currentCompanyId, formData);
        success("Party Created", "New party added successfully");
      }
      setModalOpen(false);
      loadParties();
    } catch (err: any) {
      error("Error", err.message || "Failed to save party");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (party: Party) => {
    if (!confirm(`Delete "${party.name}"? This action cannot be undone.`)) {
      return;
    }
    setDeleteLoading(party.id);
    try {
      db.deleteParty(party.id);
      success("Party Deleted", "Party removed successfully");
      loadParties();
    } catch (err: any) {
      error("Error", err.message || "Failed to delete party");
    } finally {
      setDeleteLoading(null);
    }
  };

  useShortcutAction("new_party", openNew);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Parties</h1>
                <p className="text-slate-500 mt-1">
                  Manage customers and suppliers
                </p>
              </div>
              <Button
                onClick={openNew}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus size={18} />
                New Party
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Total Parties"
              value={stats.total}
              variant="blue"
            />
            <StatCard
              icon={User}
              label="Customers"
              value={stats.customers}
              variant="purple"
            />
            <StatCard
              icon={Building2}
              label="Suppliers"
              value={stats.suppliers}
              variant="teal"
            />
            <StatCard
              icon={DollarSign}
              label="Total Balance"
              value={formatCurrency(stats.totalBalance, "INR")}
              variant={stats.totalBalance >= 0 ? "blue" : "amber"}
            />
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name, phone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Type Filter */}
              <select
                value={activeTab}
                onChange={(e) =>
                  setActiveTab(e.target.value as PartyType | "all")
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="all">All Types</option>
                <option value="customer">Customers</option>
                <option value="supplier">Suppliers</option>
                <option value="both">Both</option>
              </select>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} className="text-slate-400" />
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="name">Sort by Name</option>
                  <option value="city">Sort by City</option>
                  <option value="balance">Sort by Balance</option>
                  <option value="createdAt">Sort by Created Date</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {filtered.length} parties found
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                  title="Grid view"
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    viewMode === "list"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Parties Display */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No parties found
              </h3>
              <p className="text-slate-500 mb-6">
                {search
                  ? "Try adjusting your search criteria"
                  : "Create your first party to get started"}
              </p>
              {!search && (
                <Button
                  onClick={openNew}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus size={16} />
                  New Party
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((party) => (
                <PartyCard
                  key={party.id}
                  party={party}
                  onView={() => setDetailDrawerOpen(party)}
                  onEdit={openEdit}
                  onDelete={() => handleDelete(party)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((party) => (
                <div
                  key={party.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex items-center justify-between"
                  onClick={() => setDetailDrawerOpen(party)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {party.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {party.name}
                        </h3>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                          {party.partyType.charAt(0).toUpperCase() +
                            party.partyType.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[12px] text-slate-500">
                        {party.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {party.phone}
                          </span>
                        )}
                        {party.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {party.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-sm font-bold",
                          party.openingBalance >= 0
                            ? "text-emerald-600"
                            : "text-rose-600",
                        )}
                      >
                        {formatCurrency(party.openingBalance, "INR")}
                      </div>
                      <div className="text-[11px] text-slate-400">Balance</div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(party);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <User size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <PartyDetailDrawer
        party={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(null)}
        onEdit={(party) => {
          openEdit(party);
          setDetailDrawerOpen(null);
        }}
        onDelete={(party) => {
          handleDelete(party);
          setDetailDrawerOpen(null);
        }}
      />

      {/* Modal */}
      <CreatePartyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editParty={editParty}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </PageTransition>
  );
}
