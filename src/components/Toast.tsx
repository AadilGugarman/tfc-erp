import { cn } from '@/utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

export function Toast({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-lg animate-slide-up',
        config.bg,
        config.border,
        'transition-all duration-300',
        isExiting && 'animate-fade-out opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          {message && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose(id), 300);
          }}
          className={cn(
            'flex-shrink-0 text-slate-400 dark:text-slate-500',
            'hover:text-slate-600 dark:hover:text-slate-400',
            'transition-colors'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<ToastProps & { onClose: (id: string) => void }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { onClose: (id: string) => void })[]>([]);

  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps & { onClose: (id: string) => void } = {
      id,
      type,
      title,
      message,
      duration,
      onClose: removeToast,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (title: string, message?: string) =>
    showToast('success', title, message);
  const error = (title: string, message?: string) =>
    showToast('error', title, message);
  const info = (title: string, message?: string) =>
    showToast('info', title, message);
  const warning = (title: string, message?: string) =>
    showToast('warning', title, message);

  return { toasts, showToast, removeToast, success, error, info, warning };
}
