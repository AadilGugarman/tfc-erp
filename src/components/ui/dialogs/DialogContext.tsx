import React, { createContext, useCallback, useContext, useRef, useState } from "react";

// ─── Dialog variant types ────────────────────────────────────────────────────

export type DialogVariant =
  | "confirm"
  | "destructive"
  | "success"
  | "error"
  | "warning"
  | "input"
  | "unsaved";

export interface DialogOptions {
  /** Dialog visual variant */
  variant?: DialogVariant;
  /** Modal title */
  title: string;
  /** Body description — supports JSX */
  description?: React.ReactNode;
  /** Label for the primary/confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** For `input` variant — placeholder text */
  inputPlaceholder?: string;
  /** For `input` variant — default value */
  inputDefaultValue?: string;
  /** For `input` variant — label above the field */
  inputLabel?: string;
  /** For `input` variant — type attribute */
  inputType?: string;
  /** Show a loading spinner on the confirm button while promise resolves */
  loading?: boolean;
}

export interface DialogEntry extends DialogOptions {
  id: string;
  resolve: (value: boolean | string | null) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface DialogContextValue {
  dialogs: DialogEntry[];
  openDialog: (options: DialogOptions) => Promise<boolean | string | null>;
  closeDialog: (id: string, value: boolean | string | null) => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogEntry[]>([]);
  const idCounter = useRef(0);

  const openDialog = useCallback(
    (options: DialogOptions): Promise<boolean | string | null> => {
      return new Promise((resolve) => {
        const id = `dialog-${++idCounter.current}`;
        setDialogs((prev) => [...prev, { ...options, id, resolve }]);
      });
    },
    [],
  );

  const closeDialog = useCallback(
    (id: string, value: boolean | string | null) => {
      setDialogs((prev) => {
        const entry = prev.find((d) => d.id === id);
        entry?.resolve(value);
        return prev.filter((d) => d.id !== id);
      });
    },
    [],
  );

  return (
    <DialogContext.Provider value={{ dialogs, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialogContext must be used inside <DialogProvider>");
  }
  return ctx;
}
