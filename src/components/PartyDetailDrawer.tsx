import React from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Hash,
  StickyNote,
  Edit3,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Percent,
  Building2,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";
import type { Party } from "@/db/schema";
import { formatCurrency } from "@/utils/formatters";

const TYPE_CONFIG = {
  customer: {
    label: "Customer",
    bg: "bg-sky-50",
    text: "text-sky-600",
    dot: "bg-sky-400",
  },
  supplier: {
    label: "Supplier",
    bg: "bg-violet-50",
    text: "text-violet-600",
    dot: "bg-violet-400",
  },
  both: {
    label: "Both",
    bg: "bg-teal-50",
    text: "text-teal-600",
    dot: "bg-teal-400",
  },
};

const AVATAR_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
      <Icon size={13} className="text-slate-400" strokeWidth={1.8} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm text-slate-700 font-medium mt-0.5 break-words">
        {value || "—"}
      </div>
    </div>
  </div>
);

interface PartyDetailDrawerProps {
  party: Party | null;
  onClose: () => void;
  onEdit?: (party: Party) => void;
  onDelete?: (party: Party) => void;
}

export const PartyDetailDrawer: React.FC<PartyDetailDrawerProps> = ({
  party,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!party) return null;

  const typeConfig = TYPE_CONFIG[party.partyType] ?? TYPE_CONFIG.customer;
  const avatarColor = getAvatarColor(party.id);
  const initials = party.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isPositive = party.openingBalance >= 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl animate-drawer overflow-hidden"
        style={{
          width: "min(460px, 100vw)",
          boxShadow: "-4px 0 40px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100"
          style={{
            background: `linear-gradient(135deg, ${avatarColor}08 0%, white 60%)`,
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: avatarColor,
                  boxShadow: `0 4px 14px ${avatarColor}50`,
                }}
              >
                {initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">
                  {party.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`}
                    />
                    {typeConfig.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Balance",
                value: formatCurrency(Math.abs(party.openingBalance), "INR"),
                sub: isPositive ? "receivable" : "payable",
                icon: isPositive ? TrendingUp : TrendingDown,
                color: isPositive ? "#10b981" : "#f43f5e",
              },
              {
                label: "Credit",
                value:
                  party.creditLimit > 0
                    ? formatCurrency(party.creditLimit, "INR")
                    : "—",
                sub: "limit",
                icon: CreditCard,
                color: "#f59e0b",
              },
              {
                label: "Commission",
                value: `${party.commissionPercent}%`,
                sub: "rate",
                icon: Percent,
                color: "#6366f1",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-3 border border-slate-100 text-center"
              >
                <div className="flex justify-center mb-1.5">
                  <stat.icon
                    size={14}
                    style={{ color: stat.color }}
                    strokeWidth={2}
                  />
                </div>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {stat.value}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        {(onEdit || onDelete) && (
          <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(party);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <Edit3 size={12} />
                Edit Party
              </button>
            )}
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 transition-colors border border-slate-200">
              <DollarSign size={12} />
              New Payment
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Contact info */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-indigo-400" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Contact Information
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow icon={Mail} label="Email" value={party.email} />
              <InfoRow icon={Phone} label="Phone" value={party.phone} />
              <InfoRow icon={Hash} label="GSTIN" value={party.gstin} />
            </div>
          </div>

          {/* Address */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-sky-400" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Address
              </h3>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <MapPin
                size={14}
                className="text-slate-400 flex-shrink-0 mt-0.5"
              />
              <div>
                {party.address && (
                  <div className="text-sm text-slate-700 font-medium leading-relaxed">
                    {party.address}
                  </div>
                )}
                {(party.city || party.state) && (
                  <div className="text-sm text-slate-600 mt-0.5">
                    {[party.city, party.state].filter(Boolean).join(", ")}
                  </div>
                )}
                {party.shippingAddress && (
                  <div className="text-xs text-slate-400 mt-1.5 pt-1.5 border-t border-slate-200">
                    <span className="font-semibold">Shipping: </span>
                    {party.shippingAddress}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Financial
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow
                icon={DollarSign}
                label="Opening Balance"
                value={
                  <span
                    className={
                      isPositive
                        ? "text-emerald-600 font-semibold"
                        : "text-rose-600 font-semibold"
                    }
                  >
                    {formatCurrency(party.openingBalance, "INR")}
                  </span>
                }
              />
              <InfoRow
                icon={Building2}
                label="Balance Type"
                value={party.balanceType.toUpperCase()}
              />
              <InfoRow
                icon={CreditCard}
                label="Credit Limit"
                value={
                  party.creditLimit > 0
                    ? formatCurrency(party.creditLimit, "INR")
                    : "—"
                }
              />
              <InfoRow
                icon={Percent}
                label="Commission %"
                value={`${party.commissionPercent}%`}
              />
            </div>
          </div>

          {/* Notes */}
          {party.notes && (
            <div className="px-5 py-3 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 rounded-full bg-amber-400" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Notes
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {party.notes}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-slate-300" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Timeline
              </h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Created
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {formatDate(party.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Last Updated
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {formatDate(party.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          {onDelete && (
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => {
                  onDelete(party);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 border border-rose-100 transition-colors"
              >
                <Trash2 size={13} />
                Delete Party
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
