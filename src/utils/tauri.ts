/**
 * Tauri integration utilities
 *
 * Security note: the access token is read from the in-memory tokenRegistry.
 * It is NEVER read from or written to localStorage.
 */

import { getAccessToken } from "@/utils/tokenRegistry";

let tauriInvokePromise: Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> | null = null;

/** True when running inside a Tauri desktop window. */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Lazy-load the Tauri invoke function. */
export async function getTauriInvoke(): Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> {
  if (!isTauriRuntime()) return null;

  if (!tauriInvokePromise) {
    tauriInvokePromise = import("@tauri-apps/api/core")
      .then((mod) => mod.invoke)
      .catch((err) => {
        console.error(
          "[TauriUtils] Failed to import @tauri-apps/api/core:",
          err,
        );
        return null;
      });
  }

  return tauriInvokePromise;
}

/** Poll until Tauri is available (up to maxAttempts × delayMs ms). */
export const waitForTauri = async (
  maxAttempts = 10,
  delayMs = 100,
): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isTauriRuntime()) return;
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export type SecureInvokeOptions = {
  maxAttempts?: number;
  delayMs?: number;
  skipKeyNormalization?: boolean;
};

const toSnakeCase = (value: string): string =>
  value.replace(/([A-Z])/g, "_$1").toLowerCase();

const normalizeObjectKeysToSnakeCase = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeObjectKeysToSnakeCase);
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        toSnakeCase(key),
        normalizeObjectKeysToSnakeCase(child),
      ]),
    );
  }

  return value;
};

/**
 * Invoke a Tauri command with automatic access-token injection.
 *
 * The token is read synchronously from the in-memory tokenRegistry —
 * no async import, no race condition, no localStorage access.
 */
export const secureInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>,
  options?: SecureInvokeOptions,
): Promise<T> => {
  await waitForTauri(options?.maxAttempts ?? 10, options?.delayMs ?? 100);

  const invokeFn = await getTauriInvoke();
  if (!invokeFn) {
    throw new Error(
      'Backend service unavailable. Please start the app with "npm run desktop:dev".',
    );
  }

  // Read token synchronously from the in-memory registry (never localStorage)
  const token = getAccessToken();
  const normalizedArgs = args
    ? options?.skipKeyNormalization
      ? (args as Record<string, unknown>)
      : (normalizeObjectKeysToSnakeCase(args) as Record<string, unknown>)
    : undefined;

  const enrichedArgs: Record<string, unknown> = {
    ...normalizedArgs,
    // Only inject if the caller hasn't already provided a token
    ...(normalizedArgs?.token == null && token ? { token } : {}),
  };

  try {
    return (await invokeFn(command, enrichedArgs)) as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Tauri] Command failed: ${command}`, error);
    throw new Error(`Command failed: ${errorMsg}`);
  }
};
