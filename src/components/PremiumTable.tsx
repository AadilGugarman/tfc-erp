import { cn } from '@/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PremiumTableProps {
  title?: string;
  headers: string[];
  children: React.ReactNode;
  compact?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

export function PremiumTable({
  title,
  headers,
  children,
  compact = true,
  striped = true,
  hoverable = true,
}: PremiumTableProps) {
  return (
    <div className="rounded-xl ring-1 ring-slate-200/70 dark:ring-[#25344f]/75 bg-white/95 dark:bg-[#111827]/92 overflow-hidden shadow-[0_10px_24px_-22px_rgba(15,23,42,0.5)]">
      {title && (
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50/85 to-transparent dark:from-[#141d31]/80 dark:to-transparent">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200/70 dark:border-[#22304a]/70 bg-slate-100/80 dark:bg-[#0f172a]/85">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={cn(
                    'text-left font-semibold text-slate-700 dark:text-slate-300',
                    compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                    'uppercase tracking-wider'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90 dark:divide-[#1a253c]/70">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PremiumTableRowProps {
  children: React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  isStriped?: boolean;
  onClick?: () => void;
}

export function PremiumTableRow({
  children,
  isStriped = false,
  hoverable = true,
  onClick,
}: PremiumTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-150',
        hoverable && 'hover:bg-slate-50 dark:hover:bg-[#172036] cursor-pointer',
        isStriped && 'bg-slate-50/70 dark:bg-[#111a2d]',
        !hoverable && 'hover:bg-slate-50 dark:hover:bg-[#172036]'
      )}
    >
      {children}
    </tr>
  );
}

interface PremiumTableCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  compact?: boolean;
  numeric?: boolean;
  highlighted?: boolean;
  secondary?: boolean;
  className?: string;
}

export function PremiumTableCell({
  children,
  align = 'left',
  compact = true,
  numeric = false,
  highlighted = false,
  secondary = false,
  className,
}: PremiumTableCellProps) {
  return (
    <td
      className={cn(
        compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base',
        'text-slate-900 dark:text-slate-100',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        numeric && 'font-mono',
        highlighted && 'font-semibold text-blue-700 dark:text-blue-300',
        secondary && 'text-slate-500 dark:text-slate-400 text-xs',
        className
      )}
    >
      {children}
    </td>
  );
}

interface PremiumTableHeaderProps {
  children: React.ReactNode;
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
  align?: 'left' | 'center' | 'right';
  onClick?: () => void;
  className?: string;
  numeric?: boolean;
}

export function PremiumTableHeader({
  children,
  sortable = false,
  sorted = null,
  align = 'left',
  onClick,
  className,
  numeric = false,
}: PremiumTableHeaderProps) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={cn(
        'px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-[0.06em]',
        sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors',
        numeric && 'text-right',
        className
      )}
    >
      <div className={cn('flex items-center gap-2', align === 'right' && 'justify-end')}>
        {children}
        {sortable && sorted && (
          sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        )}
      </div>
    </th>
  );
}
