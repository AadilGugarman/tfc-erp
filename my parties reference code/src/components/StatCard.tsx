import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  positive,
  icon: Icon,
  color,
  bgColor,
}) => {
  return (
    <div className="card-hover bg-white rounded-2xl p-5 border border-slate-100 shadow-sm shadow-slate-100/50">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={18} style={{ color }} strokeWidth={2} />
        </div>
        <div
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
            positive
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {positive ? (
            <TrendingUp size={10} strokeWidth={2.5} />
          ) : (
            <AlertCircle size={10} strokeWidth={2.5} />
          )}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-slate-400 mt-0.5">{label}</div>
    </div>
  );
};
