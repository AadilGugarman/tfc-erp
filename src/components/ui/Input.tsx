import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({ label, error, prefix, suffix, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
          <label htmlFor={inputId} className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 dark:text-slate-500 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] select-none">{prefix}</span>
          )}
          <input
            id={inputId}
            className={cn(
              'w-full px-3 py-2 text-[13px] border rounded-md bg-white dark:bg-[#111318] text-slate-900 dark:text-[#e8edf5] placeholder:text-slate-400 dark:placeholder:text-slate-600',
              'border-slate-200 dark:border-[#1e2330]',
              'focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb] dark:focus:border-[#5c7cfa]',
              'transition-colors duration-100',
              prefix && 'pl-8',
              suffix && 'pr-10',
              error && 'border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500',
              className
            )}
            {...props}
          />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 dark:text-slate-500">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-[13px] border rounded-md bg-white dark:bg-[#111318] text-slate-900 dark:text-[#e8edf5] placeholder:text-slate-400 dark:placeholder:text-slate-600 min-h-[80px] resize-y',
          'border-slate-200 dark:border-[#1e2330]',
          'focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb] dark:focus:border-[#5c7cfa]',
          'transition-colors duration-100',
          error && 'border-red-400 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 dark:text-slate-500">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-[13px] border rounded-md bg-white dark:bg-[#111318] text-slate-900 dark:text-[#e8edf5]',
          'border-slate-200 dark:border-[#1e2330]',
          'focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/30 focus:border-[#3b5bdb] dark:focus:border-[#5c7cfa]',
          'transition-colors duration-100',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
