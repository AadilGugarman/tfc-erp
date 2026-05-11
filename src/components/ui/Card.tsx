import React from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-[#111318] rounded-lg border border-slate-200 dark:border-[#1e2330]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none',
        onClick && 'cursor-pointer hover:border-slate-300 dark:hover:border-[#2a3040] transition-colors duration-100',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 border-b border-slate-100 dark:border-[#1a1f2e] flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-[13px] font-semibold text-slate-800 dark:text-slate-200', className)}>{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-slate-500 dark:text-slate-500 mt-0.5">{children}</p>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 py-3', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 border-t border-slate-100 dark:border-[#1a1f2e]', className)}>
      {children}
    </div>
  );
}
