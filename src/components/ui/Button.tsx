import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'soft';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  fullWidth,
  ...props
}: ButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center font-semibold rounded-lg',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    'select-none',
    fullWidth && 'w-full'
  );

  const variants = {
    primary: cn(
      'bg-gradient-to-r from-indigo-600 to-indigo-700',
      'text-white',
      'hover:from-indigo-700 hover:to-indigo-800',
      'shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40'
    ),
    secondary: cn(
      'bg-slate-200 dark:bg-slate-800',
      'text-slate-900 dark:text-slate-100',
      'hover:bg-slate-300 dark:hover:bg-slate-700',
      'shadow-sm'
    ),
    destructive: cn(
      'bg-red-600',
      'text-white',
      'hover:bg-red-700',
      'shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40'
    ),
    ghost: cn(
      'text-slate-700 dark:text-slate-300',
      'hover:bg-slate-100 dark:hover:bg-slate-800/60',
      'hover:text-slate-900 dark:hover:text-slate-100'
    ),
    outline: cn(
      'border border-slate-300 dark:border-slate-700',
      'text-slate-700 dark:text-slate-300',
      'hover:bg-slate-50 dark:hover:bg-slate-800/50',
      'hover:border-slate-400 dark:hover:border-slate-600'
    ),
    soft: cn(
      'bg-indigo-50 dark:bg-indigo-950/30',
      'text-indigo-700 dark:text-indigo-300',
      'hover:bg-indigo-100 dark:hover:bg-indigo-950/50',
      'border border-indigo-200/50 dark:border-indigo-800/50'
    ),
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {icon && !loading && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

