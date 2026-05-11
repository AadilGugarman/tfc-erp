import { cn } from '@/utils/cn';
import { forwardRef } from 'react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helper?: string;
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, error, icon, helper, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg',
              'bg-white dark:bg-slate-800',
              'border border-slate-200 dark:border-slate-700',
              'text-slate-900 dark:text-slate-100',
              'placeholder-slate-400 dark:placeholder-slate-500',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
              'hover:border-slate-300 dark:hover:border-slate-600',
              'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

interface PremiumSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  helper?: string;
}

export const PremiumSelect = forwardRef<HTMLSelectElement, PremiumSelectProps>(
  ({ label, error, options, helper, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'text-slate-900 dark:text-slate-100',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'hover:border-slate-300 dark:hover:border-slate-600',
            'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          {...props}
        >
          <option value="">Select {label?.toLowerCase() || 'an option'}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    );
  }
);

PremiumSelect.displayName = 'PremiumSelect';

interface PremiumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const PremiumTextarea = forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ label, error, helper, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg resize-none',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'text-slate-900 dark:text-slate-100',
            'placeholder-slate-400 dark:placeholder-slate-500',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'hover:border-slate-300 dark:hover:border-slate-600',
            'disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    );
  }
);

PremiumTextarea.displayName = 'PremiumTextarea';
