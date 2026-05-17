import React from "react";
import {
  Mail,
  Phone,
  MoreHorizontal,
  MapPin,
  Building2,
  User,
} from "lucide-react";
import type { Party } from "@/db/schema";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

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
  const initials = party.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Color scheme based on party type
  const typeConfig = {
    customer: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
    supplier: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      dot: "bg-purple-400",
    },
    both: { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-400" },
  };

  const config = typeConfig[party.partyType] || typeConfig.customer;

  // Determine balance color
  const isPositive = party.openingBalance >= 0;
  const balanceColor = isPositive ? "text-emerald-600" : "text-rose-600";
  const balanceBg = isPositive ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div
      className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => onView(party)}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-blue-400" />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initials}
            </div>

            {/* Name & Type */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 truncate leading-tight">
                {party.name}
              </h3>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
                    config.bg,
                    config.text,
                  )}
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full", config.dot)}
                  />
                  {party.partyType.charAt(0).toUpperCase() +
                    party.partyType.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Action menu */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(party);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <User size={16} />
            </button>
            <div className="relative group/menu">
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover/menu:block z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(party);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(party);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-2 mb-4 pt-3 border-t border-slate-100">
          {party.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={14} className="flex-shrink-0 text-slate-400" />
              <span className="text-[12px] truncate">{party.email}</span>
            </div>
          )}
          {party.phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={14} className="flex-shrink-0 text-slate-400" />
              <span className="text-[12px] truncate">{party.phone}</span>
            </div>
          )}
          {party.address && (
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin
                size={14}
                className="flex-shrink-0 text-slate-400 mt-0.5"
              />
              <span className="text-[12px] line-clamp-2">{party.address}</span>
            </div>
          )}
        </div>

        {/* Balance & City Info */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Balance
            </div>
            <div
              className={cn(
                "text-sm font-bold px-2 py-1 rounded-lg",
                balanceBg,
                balanceColor,
              )}
            >
              {formatCurrency(Math.abs(party.openingBalance), "INR")}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              City
            </div>
            <div className="text-sm font-medium text-slate-700">
              {party.city || party.state || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
