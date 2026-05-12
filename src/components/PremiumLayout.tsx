import { cn } from "@/utils/cn";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useFormKeyboardNavigation } from "@/hooks/useFormKeyboardNavigation";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: PremiumModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: isOpen, containerRef: modalRef, onEscape: onClose });
  useFormKeyboardNavigation(modalRef, { enabled: isOpen });

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative bg-white dark:bg-[#111827] rounded-xl shadow-2xl animate-slide-up",
          "border border-slate-200 dark:border-[#2a3550]",
          size === "sm" && "max-w-sm w-full mx-4",
          size === "md" && "max-w-md w-full mx-4",
          size === "lg" && "max-w-lg w-full mx-4",
          size === "xl" && "max-w-2xl w-full mx-4",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#22304a]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg",
              "text-slate-500 dark:text-slate-400",
              "hover:bg-slate-100 dark:hover:bg-[#1b2335]",
              "transition-colors duration-150",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-[#22304a] bg-slate-50 dark:bg-[#0f1527] rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}

export function PageLayout({
  title,
  subtitle,
  actions,
  children,
  loading = false,
}: PageLayoutProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sticky Module Header */}
      <div className="sticky top-[4.15rem] z-20 rounded-xl border border-slate-200/85 dark:border-[#2a3550]/90 bg-white/94 dark:bg-[#0f1628]/94 backdrop-blur-xl shadow-[0_14px_28px_-22px_rgba(15,23,42,0.65)]">
        <div className="flex flex-col gap-3 p-3.5 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
              Operations Workspace / {title}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <span className="hidden sm:inline text-sm text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  compact?: boolean;
}

export function Section({ title, children, compact = false }: SectionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 dark:border-[#2a3550]",
        "bg-white dark:bg-[#111827] overflow-hidden",
      )}
    >
      {title && (
        <div className="px-5 py-3 border-b border-slate-200 dark:border-[#22304a] bg-linear-to-r from-slate-50 to-transparent dark:from-[#141d31] dark:to-transparent">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>
      )}
      <div className={compact ? "p-4" : "p-5"}>{children}</div>
    </div>
  );
}
