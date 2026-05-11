import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10" onClick={() => onClose()}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={ref}
        className={cn(
          'relative bg-white dark:bg-[#16191f] rounded-lg shadow-2xl shadow-black/20 border border-slate-200 dark:border-[#1e2330] w-full mx-4 mb-4 max-h-[calc(100vh-5rem)] flex flex-col animate-slide-up',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-[#1e2330]">
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e2330] hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}
