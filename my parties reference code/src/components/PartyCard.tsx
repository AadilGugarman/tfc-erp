import React from 'react';
import {
  Mail,
  Phone,
  Globe,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Tag,
} from 'lucide-react';
import type { Party } from '../types/party';

const TYPE_CONFIG = {
  customer: { label: 'Customer', bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-400' },
  vendor: { label: 'Vendor', bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
  both: { label: 'Both', bg: 'bg-teal-50', text: 'text-teal-600', dot: 'bg-teal-400' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
};

const formatCurrency = (value: number, currency: string) => {
  const abs = Math.abs(value);
  const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : abs.toString();
  return `${value < 0 ? '-' : ''}${currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : ''}${formatted}`;
};

interface PartyCardProps {
  party: Party;
  onView: (party: Party) => void;
}

export const PartyCard: React.FC<PartyCardProps> = ({ party, onView }) => {
  const typeConfig = TYPE_CONFIG[party.type];
  const statusConfig = STATUS_CONFIG[party.status];
  const initials = party.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div
      className="card-hover group bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden cursor-pointer"
      onClick={() => onView(party)}
    >
      {/* Card top accent */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${party.avatarColor}40, ${party.avatarColor}10)` }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: party.avatarColor, boxShadow: `0 2px 8px ${party.avatarColor}40` }}
          >
            {initials}
          </div>

          {/* Name & code */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800 truncate leading-snug">
                {party.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                {party.code}
              </span>
            </div>
          </div>

          {/* Action menu */}
          <button
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
            {typeConfig.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Contact details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Mail size={11} className="flex-shrink-0 text-slate-300" />
            <span className="text-[12px] truncate">{party.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Phone size={11} className="flex-shrink-0 text-slate-300" />
            <span className="text-[12px]">{party.phone}</span>
          </div>
          {party.website && (
            <div className="flex items-center gap-2 text-slate-500">
              <Globe size={11} className="flex-shrink-0 text-slate-300" />
              <span className="text-[12px] truncate text-indigo-500 hover:text-indigo-600">{party.website}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-50 mb-4" />

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Balance</div>
            <div className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${party.balance >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>
              {party.balance !== 0 && (
                party.balance > 0
                  ? <TrendingUp size={11} className="text-emerald-500" />
                  : <TrendingDown size={11} className="text-rose-400" />
              )}
              {formatCurrency(party.balance, party.currency)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Orders</div>
            <div className="text-sm font-bold text-slate-700 mt-0.5">{party.totalOrders}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Contact</div>
            <div className="text-[12px] font-semibold text-slate-600 mt-0.5 truncate max-w-[100px]">{party.contactPerson}</div>
          </div>
        </div>

        {/* Tags */}
        {party.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <Tag size={10} className="text-slate-300 flex-shrink-0" />
            {party.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
            {party.tags.length > 3 && (
              <span className="text-[10px] text-slate-400">+{party.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* View detail footer */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/60 border-t border-slate-100/80">
        <span className="text-[11px] text-slate-400 font-medium">
          {party.address.city}, {party.address.country}
        </span>
        <span className="text-[11px] text-indigo-500 font-semibold flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
          View Details <ExternalLink size={10} />
        </span>
      </div>
    </div>
  );
};
