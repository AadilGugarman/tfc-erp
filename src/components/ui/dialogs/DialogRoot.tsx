import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useDialogContext, type DialogEntry, type DialogVariant } from "./DialogContext";

// ─── Variant config ───────────────────────────────────────────────────────────

interface VariantConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
  defaultConfirmLabel: string;
  defaultCancelLabel: string | null;
}

const VARIANT_CONFIG: Record<DialogVariant, VariantConfig> = {
  confirm: {
    icon: Info,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    confirmClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]",
    defaultConfirmLabel: "Confirm",
    defaultCancelLabel: "Cancel",
  },
  destructive: {
    icon: Trash2,
    iconBg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-600 dark:text-red-400",
    confirmClass:
      "bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_-4px_rgba(220,38,38,0.5)]",
    defaultConfirmLabel: "Delete",
    defaultCancelLabel: "Cancel",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmClass:
      "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]",
    defaultConfirmLabel: "Continue",
    defaultCancelLabel: "Cancel",
  },
  unsaved: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmClass:
      "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]",
    defaultConfirmLabel: "Discard Changes",
    defaultCancelLabel: "Keep Editing",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmClass:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_14px_-4px_rgba(5,150,105,0.5)]",
    defaultConfirmLabel: "Done",
    defaultCancelLabel: null,
  },
  error: {
    icon: XCircle,
    iconBg: "bg-red-50 dark:bg-red-950/40",
    iconColor: "text-red-600 dark:text-red-400",
    confirmClass:
      "bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white",
    defaultConfirmLabel: "Understood",
    defaultCancelLabel: null,
  },
  input: {
    icon: Info,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    confirmClass:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]",
    defaultConfirmLabel: "Confirm",
    defaultCancelLabel: "Cancel",
  },
};

// ─── Single dialog ────────────────────────────────────────────────────────────

interface SingleDialogProps {
  entry: DialogEntry;
  onClose: (value: boolean | string | null) => void;
}

function SingleDialog({ entry, onClose }: SingleDialogProps) {
  const variant = entry.variant ?? "confirm";
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  const [inputValue, setInputValue] = useState(entry.inputDefaultValue ?? "");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ active: true, containerRef, onEscape: () => onClose(false) });

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const confirmLabel = entry.confirmLabel ?? cfg.defaultConfirmLabel;
  const cancelLabel = entry.cancelLabel ?? cfg.defaultCancelLabel;

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (variant === "input") {
        onClose(inputValue.trim() === "" ? null : inputValue);
      } else {
        onClose(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onClose(variant === "input" ? null : false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && variant !== "input") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="presentation"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`dialog-title-${entry.id}`}
        aria-describedby={entry.description ? `dialog-desc-${entry.id}` : undefined}
        className={cn(
          "relative w-full max-w-md",
          "bg-white dark:bg-[#111827]",
          "rounded-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]",
          "border border-slate-200/80 dark:border-[#1e2d45]",
          "animate-slide-up",
        )}
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          disabled={loading}
          aria-label="Close dialog"
          className={cn(
            "absolute top-4 right-4 z-10",
            "flex h-7 w-7 items-center justify-center rounded-lg",
            "text-slate-400 dark:text-slate-500",
            "hover:bg-slate-100 dark:hover:bg-[#1b2335] hover:text-slate-600 dark:hover:text-slate-300",
            "transition-colors duration-150",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center mb-4",
              cfg.iconBg,
            )}
          >
            <Icon className={cn("w-5 h-5", cfg.iconColor)} />
          </div>

          {/* Title */}
          <h2
            id={`dialog-title-${entry.id}`}
            className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-2"
          >
            {entry.title}
          </h2>

          {/* Description */}
          {entry.description && (
            <p
              id={`dialog-desc-${entry.id}`}
              className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed"
            >
              {entry.description}
            </p>
          )}

          {/* Input field (input variant) */}
          {variant === "input" && (
            <div className="mt-4">
              {entry.inputLabel && (
                <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  {entry.inputLabel}
                </label>
              )}
              <input
                type={entry.inputType ?? "text"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={entry.inputPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                autoFocus
                className={cn(
                  "w-full px-3.5 py-2.5 text-sm rounded-xl",
                  "border border-slate-300 dark:border-[#2a3550]",
                  "bg-white dark:bg-[#0f1527]",
                  "text-slate-900 dark:text-slate-100",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                  "transition-all duration-150",
                )}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 mt-6">
            {cancelLabel && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className={cn(
                  "flex-1 px-4 py-2.5 text-[13px] font-semibold rounded-xl",
                  "border border-slate-300 dark:border-[#2a3550]",
                  "text-slate-700 dark:text-slate-300",
                  "bg-white dark:bg-[#0f1527]",
                  "hover:bg-slate-50 dark:hover:bg-[#141c2d]",
                  "hover:border-slate-400 dark:hover:border-[#3b4a6b]",
                  "transition-all duration-150",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {cancelLabel}
              </button>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                "flex-1 px-4 py-2.5 text-[13px] font-semibold rounded-xl",
                "inline-flex items-center justify-center gap-2",
                "transition-all duration-150 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                cfg.confirmClass,
                !cancelLabel && "w-full",
              )}
            >
              {loading && (
                <svg
                  className="animate-spin h-3.5 w-3.5 shrink-0"
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
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root renderer ────────────────────────────────────────────────────────────

/**
 * DialogRoot renders all active dialogs from the DialogContext.
 * Place this once near the root of your app (inside DialogProvider).
 */
export function DialogRoot() {
  const { dialogs, closeDialog } = useDialogContext();

  if (dialogs.length === 0) return null;

  // Only render the topmost dialog; others wait in queue
  const topDialog = dialogs[dialogs.length - 1];

  return createPortal(
    <SingleDialog
      key={topDialog.id}
      entry={topDialog}
      onClose={(value) => closeDialog(topDialog.id, value)}
    />,
    document.body,
  );
}
