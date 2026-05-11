import { cn } from '@/utils/cn';
import React from 'react';

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
}) {
  const variants = {
    default: 'bg-slate-100 dark:bg-[#1a1f2e] text-slate-600 dark:text-slate-400',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    danger:  'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    info:    'bg-[#eef2ff] dark:bg-[#1a1f2e] text-[#3b5bdb] dark:text-[#8ba4f9]',
    outline: 'border border-slate-200 dark:border-[#1e2330] text-slate-600 dark:text-slate-400',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
