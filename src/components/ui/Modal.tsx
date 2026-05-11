import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFormKeyboardNavigation } from '@/hooks/useFormKeyboardNavigation';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: open, containerRef: ref, onEscape: onClose });
  useFormKeyboardNavigation(ref, { enabled: open });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative bg-white/96 dark:bg-[#111827]/95 rounded-xl shadow-2xl shadow-black/30 ring-1 ring-slate-200/70 dark:ring-[#2a3550]/70 w-full mx-4 mb-4 max-h-[calc(100vh-5rem)] flex flex-col animate-slide-up',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1b2335] hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  );
}
