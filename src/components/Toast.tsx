import { useMemo } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({
  id: _id,
  type: _type,
  title: _title,
  message: _message,
  duration: _duration = 4000,
  onClose: _onClose,
}: ToastProps) {
  return null;
}

interface ToastContainerProps {
  toasts: Array<ToastProps & { onClose: (id: string) => void }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts: _toasts, onClose: _onClose }: ToastContainerProps) {
  return null;
}

export function useToast() {
  return useMemo(() => {
    const noop = () => {};
    const emptyToasts: Array<ToastProps & { onClose: (id: string) => void }> = [];
    const showToast = (_type: ToastType, _title: string, _message?: string, _duration?: number) => {};
    const removeToast = (_id: string) => {};
    const success = (_title: string, _message?: string) => {};
    const error = (_title: string, _message?: string) => {};
    const info = (_title: string, _message?: string) => {};
    const warning = (_title: string, _message?: string) => {};

    return { toasts: emptyToasts, showToast, removeToast, success, error, info, warning, noop };
  }, []);
}
