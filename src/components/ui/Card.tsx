import React from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white/95 dark:bg-[#121a2b]/92 rounded-xl ring-1 ring-slate-200/65 dark:ring-[#24324d]/70',
        'shadow-[0_6px_18px_-14px_rgba(15,23,42,0.45)] dark:shadow-[0_14px_30px_-20px_rgba(2,8,20,0.62)]',
        onClick && 'cursor-pointer hover:ring-slate-300/80 dark:hover:ring-[#314365]/80 transition-all duration-150',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 flex items-center justify-between', className)}>
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
    <div className={cn('px-4 py-3', className)}>
      {children}
    </div>
  );
}
