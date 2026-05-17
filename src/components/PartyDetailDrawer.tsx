import React from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  DollarSign,
  Percent,
  Hash,
  StickyNote,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Party } from "@/db/schema";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface PartyDetailDrawerProps {
  party: Party | null;
  onClose: () => void;
  onEdit?: (party: Party) => void;
  onDelete?: (party: Party) => void;
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
      <Icon size={16} className="text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-sm text-slate-700 font-medium break-words">
        {value || "—"}
      </div>
    </div>
  </div>
);

export const PartyDetailDrawer: React.FC<PartyDetailDrawerProps> = ({
  party,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!party) return null;

  const initials = party.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const typeConfig = {
    customer: { label: "Customer", bg: "bg-blue-50", text: "text-blue-600" },
    supplier: {
      label: "Supplier",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    both: { label: "Both", bg: "bg-teal-50", text: "text-teal-600" },
  };

  const config = typeConfig[party.partyType] || typeConfig.customer;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl overflow-hidden animate-in slide-in-from-right"
        style={{
          width: "min(460px, 100vw)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">
                  {party.name}
                </h2>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full mt-2",
                    config.bg,
                    config.text,
                  )}
                >
                  {config.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Contact Section */}
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Contact Information
            </h3>
            <div className="space-y-0">
              {party.email && (
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={
                    <a
                      href={`mailto:${party.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {party.email}
                    </a>
                  }
                />
              )}
              {party.phone && (
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={
                    <a
                      href={`tel:${party.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {party.phone}
                    </a>
                  }
                />
              )}
            </div>
          </div>

          {/* Location Section */}
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Address
            </h3>
            <div className="space-y-0">
              {party.address && (
                <InfoRow icon={MapPin} label="Address" value={party.address} />
              )}
              {party.city && (
                <InfoRow icon={Building2} label="City" value={party.city} />
              )}
              {party.state && (
                <InfoRow icon={Building2} label="State" value={party.state} />
              )}
              {party.shippingAddress && (
                <InfoRow
                  icon={MapPin}
                  label="Shipping Address"
                  value={party.shippingAddress}
                />
              )}
            </div>
          </div>

          {/* Financial Section */}
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Financial Information
            </h3>
            <div className="space-y-0">
              <InfoRow
                icon={DollarSign}
                label="Opening Balance"
                value={
                  <span
                    className={
                      party.openingBalance >= 0
                        ? "text-emerald-600 font-semibold"
                        : "text-rose-600 font-semibold"
                    }
                  >
                    {formatCurrency(party.openingBalance, "INR")}
                  </span>
                }
              />
              <InfoRow
                icon={DollarSign}
                label="Balance Type"
                value={party.balanceType.toUpperCase()}
              />
              {party.creditLimit > 0 && (
                <InfoRow
                  icon={DollarSign}
                  label="Credit Limit"
                  value={formatCurrency(party.creditLimit, "INR")}
                />
              )}
              <InfoRow
                icon={Percent}
                label="Commission %"
                value={`${party.commissionPercent}%`}
              />
            </div>
          </div>

          {/* Tax & GSTIN Section */}
          {party.gstin && (
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Tax Information
              </h3>
              <div className="space-y-0">
                <InfoRow icon={Hash} label="GSTIN" value={party.gstin} />
              </div>
            </div>
          )}

          {/* Notes Section */}
          {party.notes && (
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Notes
              </h3>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <StickyNote size={16} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {party.notes}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="p-5 text-[11px] text-slate-400 space-y-1">
            <div>Created: {new Date(party.createdAt).toLocaleDateString()}</div>
            <div>Updated: {new Date(party.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Actions Footer */}
        {(onEdit || onDelete) && (
          <div className="flex-shrink-0 p-4 border-t border-slate-200 flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(party);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(party);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
