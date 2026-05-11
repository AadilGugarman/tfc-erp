import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl animate-slide-up',
          'border border-slate-200 dark:border-slate-800',
          size === 'sm' && 'max-w-sm w-full mx-4',
          size === 'md' && 'max-w-md w-full mx-4',
          size === 'lg' && 'max-w-lg w-full mx-4',
          size === 'xl' && 'max-w-2xl w-full mx-4'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-lg',
              'text-slate-500 dark:text-slate-400',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              'transition-colors duration-150'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}

export function PageLayout({
  title,
  subtitle,
  actions,
  children,
  loading = false,
}: PageLayoutProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  compact?: boolean;
}

export function Section({ title, children, compact = false }: SectionProps) {
  return (
    <div className={cn(
      'rounded-lg border border-slate-200 dark:border-slate-800',
      'bg-white dark:bg-slate-900/50 overflow-hidden'
    )}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        </div>
      )}
      <div className={compact ? 'p-4' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}
