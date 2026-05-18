import React from "react";
import {
  Mail,
  Phone,
  Globe,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  MapPin,
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

const STATUS_CONFIG = {
  active: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
  },
};

// Deterministic avatar color from party id/name
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

interface PartyCardProps {
  party: Party;
  onView: (party: Party) => void;
  onEdit: (party: Party) => void;
  onDelete: (party: Party) => void;
}

export const PartyCard: React.FC<PartyCardProps> = ({
  party,
  onView,
  onEdit,
  onDelete,
}) => {
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
    <div
      className="card-hover group bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden cursor-pointer"
      onClick={() => onView(party)}
    >
      {/* Card top accent */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(to right, ${avatarColor}40, ${avatarColor}10)`,
        }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{
              backgroundColor: avatarColor,
              boxShadow: `0 2px 8px ${avatarColor}40`,
            }}
          >
            {initials}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate leading-snug">
              {party.name}
            </h3>
            {party.gstin && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                  {party.gstin}
                </span>
              </div>
            )}
          </div>

          {/* Action menu */}
          <div
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(party)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Edit"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-1.5 mb-4">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
            {typeConfig.label}
          </span>
        </div>

        {/* Contact details */}
        <div className="space-y-1.5 mb-4">
          {party.email && (
            <div className="flex items-center gap-2 text-slate-500">
              <Mail size={11} className="flex-shrink-0 text-slate-300" />
              <span className="text-[12px] truncate">{party.email}</span>
            </div>
          )}
          {party.phone && (
            <div className="flex items-center gap-2 text-slate-500">
              <Phone size={11} className="flex-shrink-0 text-slate-300" />
              <span className="text-[12px]">{party.phone}</span>
            </div>
          )}
          {(party.city || party.state) && (
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin size={11} className="flex-shrink-0 text-slate-300" />
              <span className="text-[12px] truncate">
                {[party.city, party.state].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-50 mb-4" />

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Balance
            </div>
            <div
              className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${
                isPositive ? "text-slate-700" : "text-rose-500"
              }`}
            >
              {party.openingBalance !== 0 &&
                (isPositive ? (
                  <TrendingUp size={11} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={11} className="text-rose-400" />
                ))}
              {formatCurrency(Math.abs(party.openingBalance), "INR")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Credit Limit
            </div>
            <div className="text-sm font-bold text-slate-700 mt-0.5">
              {party.creditLimit > 0
                ? formatCurrency(party.creditLimit, "INR")
                : "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Commission
            </div>
            <div className="text-[12px] font-semibold text-slate-600 mt-0.5">
              {party.commissionPercent}%
            </div>
          </div>
        </div>

        {/* Notes preview */}
        {party.notes && (
          <div className="mt-3 text-[11px] text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 truncate">
            {party.notes}
          </div>
        )}
      </div>

      {/* View detail footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/60 border-t border-slate-100/80">
        <span className="text-[11px] text-slate-400 font-medium">
          {[party.city, party.state].filter(Boolean).join(", ") || "—"}
        </span>
        <span className="text-[11px] text-indigo-500 font-semibold flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
          View Details <ExternalLink size={10} />
        </span>
      </div>
    </div>
  );
};
