import { useDialogContext, type DialogOptions } from "./DialogContext";

/**
 * useDialog — imperative API for showing modal dialogs.
 *
 * All methods return a Promise that resolves when the user responds.
 *
 * @example
 * const dialog = useDialog();
 *
 * // Simple confirmation
 * const ok = await dialog.confirm({ title: "Delete Invoice?", ... });
 * if (ok) { ... }
 *
 * // Destructive action
 * const ok = await dialog.destructive({ title: "Reset Database?", ... });
 *
 * // Text input
 * const qty = await dialog.input({ title: "Enter Quantity", ... });
 * if (qty !== null) { ... }
 */
export function useDialog() {
  const { openDialog } = useDialogContext();

  /**
   * Show a standard confirmation dialog.
   * Resolves `true` (confirmed) or `false` (cancelled).
   */
  const confirm = (options: Omit<DialogOptions, "variant">): Promise<boolean> =>
    openDialog({ ...options, variant: "confirm" }) as Promise<boolean>;

  /**
   * Show a destructive confirmation dialog (red accent).
   * Resolves `true` (confirmed) or `false` (cancelled).
   */
  const destructive = (
    options: Omit<DialogOptions, "variant">,
  ): Promise<boolean> =>
    openDialog({ ...options, variant: "destructive" }) as Promise<boolean>;

  /**
   * Show a warning dialog.
   * Resolves `true` (confirmed) or `false` (cancelled).
   */
  const warning = (options: Omit<DialogOptions, "variant">): Promise<boolean> =>
    openDialog({ ...options, variant: "warning" }) as Promise<boolean>;

  /**
   * Show an unsaved-changes dialog.
   * Resolves `true` (leave/discard) or `false` (stay).
   */
  const unsaved = (options: Omit<DialogOptions, "variant">): Promise<boolean> =>
    openDialog({ ...options, variant: "unsaved" }) as Promise<boolean>;

  /**
   * Show a success info dialog (single OK button).
   * Resolves `true` when dismissed.
   */
  const success = (
    options: Omit<DialogOptions, "variant" | "cancelLabel">,
  ): Promise<boolean> =>
    openDialog({ ...options, variant: "success" }) as Promise<boolean>;

  /**
   * Show an error info dialog (single OK button).
   * Resolves `true` when dismissed.
   */
  const error = (
    options: Omit<DialogOptions, "variant" | "cancelLabel">,
  ): Promise<boolean> =>
    openDialog({ ...options, variant: "error" }) as Promise<boolean>;

  /**
   * Show a text/number input dialog.
   * Resolves with the entered string, or `null` if cancelled.
   */
  const input = (
    options: Omit<DialogOptions, "variant">,
  ): Promise<string | null> =>
    openDialog({ ...options, variant: "input" }) as Promise<string | null>;

  return { confirm, destructive, warning, unsaved, success, error, input };
}
