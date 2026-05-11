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
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={cn(
                    'text-left font-semibold text-slate-700 dark:text-slate-300',
                    'border-r border-slate-200 dark:border-slate-800 last:border-r-0',
                    compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                    'uppercase tracking-wider'
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
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
        hoverable && 'hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer',
        isStriped && 'bg-slate-50 dark:bg-slate-800/20',
        !hoverable && 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
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
}

export function PremiumTableCell({
  children,
  align = 'left',
  compact = true,
  numeric = false,
  highlighted = false,
  secondary = false,
}: PremiumTableCellProps) {
  return (
    <td
      className={cn(
        'border-r border-slate-200 dark:border-slate-800 last:border-r-0',
        compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base',
        'text-slate-900 dark:text-slate-100',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        numeric && 'font-mono',
        highlighted && 'font-semibold text-indigo-600 dark:text-indigo-400',
        secondary && 'text-slate-500 dark:text-slate-400 text-xs'
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
}

export function PremiumTableHeader({
  children,
  sortable = false,
  sorted = null,
  align = 'left',
  onClick,
}: PremiumTableHeaderProps) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={cn(
        'px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider',
        sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 transition-colors',
        'border-r border-slate-200 dark:border-slate-800 last:border-r-0'
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
