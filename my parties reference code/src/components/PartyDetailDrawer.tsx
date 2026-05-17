import React from 'react';
import {
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Tag,
  Building2,
  Hash,
  User,
  Briefcase,
  Landmark,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Calendar,
  Edit3,
  Trash2,
  MoreHorizontal,
  CreditCard,
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

const PAYMENT_LABELS: Record<string, string> = {
  net15: 'Net 15 Days',
  net30: 'Net 30 Days',
  net45: 'Net 45 Days',
  net60: 'Net 60 Days',
  immediate: 'Immediate',
  custom: 'Custom',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatBalance = (val: number, currency: string) => {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ', SGD: 'S$' };
  const sym = symbols[currency] || currency + ' ';
  return `${val < 0 ? '-' : ''}${sym}${Math.abs(val).toLocaleString()}`;
};

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5">
      <Icon size={13} className="text-slate-400" strokeWidth={1.8} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-700 font-medium mt-0.5 break-words">{value || '—'}</div>
    </div>
  </div>
);

interface Props {
  party: Party | null;
  onClose: () => void;
}

export const PartyDetailDrawer: React.FC<Props> = ({ party, onClose }) => {
  if (!party) return null;

  const typeConfig = TYPE_CONFIG[party.type];
  const statusConfig = STATUS_CONFIG[party.status];
  const initials = party.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl animate-drawer overflow-hidden"
        style={{
          width: 'min(460px, 100vw)',
          boxShadow: '-4px 0 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100"
          style={{ background: `linear-gradient(135deg, ${party.avatarColor}08 0%, white 60%)` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-lg flex-shrink-0"
                style={{ backgroundColor: party.avatarColor, boxShadow: `0 4px 14px ${party.avatarColor}50` }}
              >
                {initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 leading-tight">{party.name}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {party.code}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
                    {typeConfig.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
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
                label: 'Balance',
                value: formatBalance(party.balance, party.currency),
                sub: party.balance >= 0 ? 'receivable' : 'payable',
                icon: party.balance >= 0 ? TrendingUp : TrendingDown,
                color: party.balance >= 0 ? '#10b981' : '#f43f5e',
              },
              {
                label: 'Orders',
                value: party.totalOrders.toString(),
                sub: 'total',
                icon: ShoppingBag,
                color: '#6366f1',
              },
              {
                label: 'Credit',
                value: party.creditLimit >= 1000
                  ? `${party.currency === 'USD' ? '$' : party.currency}${(party.creditLimit / 1000).toFixed(0)}k`
                  : party.creditLimit.toString(),
                sub: 'limit',
                icon: CreditCard,
                color: '#f59e0b',
              },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                <div className="flex justify-center mb-1.5">
                  <stat.icon size={14} style={{ color: stat.color }} strokeWidth={2} />
                </div>
                <div className="text-sm font-bold text-slate-800">{stat.value}</div>
                <div className="text-[10px] text-slate-400 capitalize">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100">
            <Edit3 size={12} />
            Edit Party
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 transition-colors border border-slate-200">
            <ShoppingBag size={12} />
            New Order
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Basic info section */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-indigo-400" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact Information</h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow icon={Mail} label="Email" value={party.email} />
              <InfoRow icon={Phone} label="Phone" value={party.phone} />
              <InfoRow icon={Globe} label="Website" value={party.website} />
              <InfoRow icon={User} label="Contact Person" value={party.contactPerson} />
              <InfoRow icon={Briefcase} label="Designation" value={party.designation} />
            </div>
          </div>

          {/* Address section */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-sky-400" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address</h3>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-slate-700 font-medium leading-relaxed">
                  {[party.address.line1, party.address.line2].filter(Boolean).join(', ')}
                </div>
                <div className="text-sm text-slate-600 mt-0.5">
                  {[party.address.city, party.address.state, party.address.postalCode].filter(Boolean).join(', ')}
                </div>
                <div className="text-sm font-semibold text-slate-700 mt-0.5">{party.address.country}</div>
              </div>
            </div>
          </div>

          {/* Financial section */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Financial</h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow icon={DollarSign} label="Currency" value={party.currency} />
              <InfoRow icon={CreditCard} label="Payment Terms" value={PAYMENT_LABELS[party.paymentTerms] || party.paymentTerms} />
              <InfoRow icon={Hash} label="Tax ID" value={party.taxId} />
              <InfoRow icon={Landmark} label="Bank" value={party.bankName} />
              <InfoRow icon={Building2} label="Account" value={party.accountNumber} />
              <InfoRow icon={Building2} label="SWIFT/IFSC" value={party.ifsc} />
            </div>
          </div>

          {/* Tags */}
          {party.tags.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 rounded-full bg-amber-400" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {party.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Tag size={10} className="text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {party.notes && (
            <div className="px-5 py-3 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 rounded-full bg-violet-400" />
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</h3>
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
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Timeline</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Created</div>
                  <div className="text-xs font-semibold text-slate-600">{formatDate(party.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Last Updated</div>
                  <div className="text-xs font-semibold text-slate-600">{formatDate(party.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="px-5 py-4 border-t border-slate-100">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 border border-rose-100 transition-colors">
              <Trash2 size={13} />
              Delete Party
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
