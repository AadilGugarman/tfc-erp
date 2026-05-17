import React from 'react';
import { cn } from '../../utils/cn';

// ====================
// Card Components
// ====================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}) => {
  const variants = {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
    elevated: 'bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800',
    outlined: 'bg-transparent border border-zinc-200 dark:border-zinc-800',
  };

  return (
    <div 
      className={cn(
        'rounded-xl',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div className={cn('px-6 py-5 border-b border-zinc-100 dark:border-zinc-800', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <h3 className={cn('text-lg font-semibold text-zinc-900 dark:text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <p className={cn('text-sm text-zinc-500 dark:text-zinc-400 mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div className={cn('px-6 py-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => (
  <div className={cn('px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl', className)} {...props}>
    {children}
  </div>
);

// ====================
// Form Components
// ====================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Input: React.FC<InputProps> = ({ 
  className, 
  label, 
  error, 
  description, 
  id,
  ...props 
}) => (
  <div className="space-y-1.5">
    {label && (
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
    )}
    <input
      id={id}
      className={cn(
        'w-full px-3 py-2.5 text-sm rounded-lg border',
        'bg-white dark:bg-zinc-900',
        'text-zinc-900 dark:text-white',
        'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        error 
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
          : 'border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20',
        'focus:outline-none focus:ring-4 transition-all duration-200',
        className
      )}
      {...props}
    />
    {description && !error && (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
    )}
    {error && (
      <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
    )}
  </div>
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  className, 
  label, 
  error, 
  description, 
  id,
  ...props 
}) => (
  <div className="space-y-1.5">
    {label && (
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
    )}
    <textarea
      id={id}
      className={cn(
        'w-full px-3 py-2.5 text-sm rounded-lg border resize-y min-h-[100px]',
        'bg-white dark:bg-zinc-900',
        'text-zinc-900 dark:text-white',
        'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
        error 
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
          : 'border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20',
        'focus:outline-none focus:ring-4 transition-all duration-200',
        className
      )}
      {...props}
    />
    {description && !error && (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
    )}
    {error && (
      <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
    )}
  </div>
);

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  description?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ 
  className, 
  label, 
  error, 
  description, 
  options,
  id,
  ...props 
}) => (
  <div className="space-y-1.5">
    {label && (
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
    )}
    <div className="relative">
      <select
        id={id}
        className={cn(
          'w-full px-3 py-2.5 text-sm rounded-lg border appearance-none cursor-pointer',
          'bg-white dark:bg-zinc-900',
          'text-zinc-900 dark:text-white',
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-500/20',
          'focus:outline-none focus:ring-4 transition-all duration-200',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    {description && !error && (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
    )}
    {error && (
      <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
    )}
  </div>
);

// ====================
// Toggle Switch
// ====================

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onCheckedChange, 
  label, 
  description,
  className,
}) => (
  <div className={cn('flex items-center justify-between gap-4', className)}>
    <div className="space-y-0.5">
      {label && (
        <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
      )}
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full',
        'border-2 border-transparent transition-colors duration-200 ease-in-out',
        checked 
          ? 'bg-blue-600' 
          : 'bg-zinc-300 dark:bg-zinc-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow',
          'ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  </div>
);

// ====================
// Button Component
// ====================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white',
    outline: 'border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white',
    ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// ====================
// Label with Tooltip
// ====================

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  tooltip?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  className, 
  tooltip, 
  children, 
  ...props 
}) => (
  <div className="relative inline-block">
    <label className={cn('text-sm font-medium text-zinc-700 dark:text-zinc-300', className)} {...props}>
      {children}
    </label>
    {tooltip && (
      <div className="group relative inline-block ml-1">
        <svg className="w-4 h-4 text-zinc-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 text-xs text-white bg-zinc-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900" />
        </div>
      </div>
    )}
  </div>
);

// ====================
// Section Divider
// ====================

export const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="relative py-4">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
    </div>
    {label && (
      <div className="relative flex justify-center">
        <span className="px-3 bg-white dark:bg-zinc-950 text-xs text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
    )}
  </div>
);

// ====================
// Badge Component
// ====================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}) => {
  const variants = {
    default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// ====================
// Alert Component
// ====================

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ 
  className, 
  variant = 'default', 
  icon,
  children,
  ...props 
}) => {
  const variants = {
    default: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  return (
    <div 
      className={cn(
        'rounded-lg border p-4 flex gap-3',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="text-sm text-zinc-800 dark:text-zinc-200">{children}</div>
    </div>
  );
};
