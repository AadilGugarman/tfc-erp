/**
 * Utility functions for Tauri integration
 */

let tauriInvokePromise: Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> | null = null;

/**
 * Check if the app is running in a Tauri runtime
 */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Get the Tauri invoke function
 */
export async function getTauriInvoke(): Promise<
  ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null
> {
  if (!isTauriRuntime()) {
    return null;
  }

  if (!tauriInvokePromise) {
    tauriInvokePromise = import("@tauri-apps/api/core")
      .then((mod) => mod.invoke)
      .catch((err) => {
        console.error("[TauriUtils] Failed to import @tauri-apps/api/core:", err);
        return null;
      });
  }

  return tauriInvokePromise;
}

/**
 * Wait for Tauri to be available
 */
export const waitForTauri = async (maxAttempts = 10, delayMs = 100): Promise<void> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isTauriRuntime()) {
      return;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Safe invoke with fallback and automatic token injection
 */
export const secureInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> => {
  // Wait for Tauri to be available
  await waitForTauri();

  const invokeFn = await getTauriInvoke();
  if (!invokeFn) {
    console.warn(
      `Tauri backend is not available for command: ${command}.`,
    );
    throw new Error(
      'Backend service unavailable. Please make sure you started the app with "npm run desktop:dev" and not just "npm run dev".',
    );
  }

  // Inject token if available in localStorage
  // Using constant key here to avoid circular dependency with auth service
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("tfc-erp-access-token") : null;
  const enrichedArgs = {
    ...args,
    token: args?.token || token || undefined,
  };

  try {
    return (await invokeFn(command, enrichedArgs)) as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Tauri command failed: ${command}`, error);
    throw new Error(`Command failed: ${errorMsg}`);
  }
};
