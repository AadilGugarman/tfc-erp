import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type BackupFrequency =
  | "daily"
  | "every_12_hours"
  | "every_6_hours"
  | "startup_only";

export interface BackupConfig {
  auto_enabled: boolean;
  startup_backup: boolean;
  frequency: BackupFrequency;
  backup_hour: number;
  backup_minute: number;
  retention_count: number;
  compression_enabled: boolean;
  backup_dir: string | null;
  last_auto_backup_at: string | null;
}

export interface BackupHistoryItem {
  file_name: string;
  file_path: string;
  created_at: string;
  size_bytes: number;
  backup_type: string;
  company_count: number;
}

export interface BackupValidationResult {
  valid: boolean;
  message: string;
  backup_type: string | null;
  created_at: string | null;
  company_count: number | null;
}

export interface RestoreResult {
  message: string;
  restored_from: string;
  restored_at: string;
  company_count: number;
  client_state_json: string | null;
}

const WEB_BACKUP_CONFIG_KEY = "fruit-market-erp-backup-config";

const defaultBackupConfig: BackupConfig = {
  auto_enabled: true,
  startup_backup: true,
  frequency: "daily",
  backup_hour: 20,
  backup_minute: 0,
  retention_count: 30,
  compression_enabled: true,
  backup_dir: null,
  last_auto_backup_at: null,
};

interface ClientStateSnapshot {
  app_language: string | null;
  current_company_id: string | null;
  companies_json: string | null;
  session_json: string | null;
  user_json: string | null;
  preferences_json: string | null;
}

function isDesktopRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function collectClientStateSnapshot(): string {
  const payload: ClientStateSnapshot = {
    app_language: localStorage.getItem("appLanguage"),
    current_company_id: localStorage.getItem("talha-fruit-company"),
    companies_json: null, // Now stored in database, included in fruit_market_erp_db
    session_json: localStorage.getItem("fruit-market-erp-session"),
    user_json: localStorage.getItem("fruit-market-erp-user"),
    preferences_json: localStorage.getItem("fruit_market_erp_db"), // Contains companies now
  };

  return JSON.stringify(payload);
}

export function applyClientStateSnapshot(snapshotJson: string): void {
  const parsed = JSON.parse(snapshotJson) as ClientStateSnapshot;

  const setOrRemove = (key: string, value: string | null) => {
    if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  };

  setOrRemove("appLanguage", parsed.app_language);
  setOrRemove("talha-fruit-company", parsed.current_company_id);
  // companies_json is now part of fruit_market_erp_db, no need to restore separately
  setOrRemove("fruit-market-erp-session", parsed.session_json);
  setOrRemove("fruit-market-erp-user", parsed.user_json);
  setOrRemove("fruit_market_erp_db", parsed.preferences_json);
}

export async function saveClientStateForBackups(): Promise<void> {
  if (!isDesktopRuntime()) return;
  const clientStateJson = collectClientStateSnapshot();
  await invoke("save_backup_client_state", { clientStateJson });
}

export async function getBackupConfig(): Promise<BackupConfig | null> {
  if (!isDesktopRuntime()) {
    const raw = localStorage.getItem(WEB_BACKUP_CONFIG_KEY);
    if (!raw) return defaultBackupConfig;
    try {
      return JSON.parse(raw) as BackupConfig;
    } catch {
      return defaultBackupConfig;
    }
  }
  return invoke<BackupConfig>("get_backup_config");
}

export async function updateBackupConfig(
  config: BackupConfig,
): Promise<BackupConfig> {
  if (!isDesktopRuntime()) {
    localStorage.setItem(WEB_BACKUP_CONFIG_KEY, JSON.stringify(config));
    return config;
  }
  return invoke<BackupConfig>("update_backup_config", { config });
}

export async function createManualBackup(): Promise<BackupHistoryItem> {
  if (!isDesktopRuntime()) {
    throw new Error("Desktop runtime required");
  }
  const clientStateJson = collectClientStateSnapshot();
  return invoke<BackupHistoryItem>("create_manual_backup", { clientStateJson });
}

export async function createStartupBackup(): Promise<BackupHistoryItem | null> {
  if (!isDesktopRuntime()) return null;
  await saveClientStateForBackups();
  return invoke<BackupHistoryItem | null>("create_startup_backup");
}

export async function runAutoBackupIfDue(): Promise<BackupHistoryItem | null> {
  if (!isDesktopRuntime()) return null;
  await saveClientStateForBackups();
  return invoke<BackupHistoryItem | null>("run_auto_backup_if_due");
}

export async function listBackups(): Promise<BackupHistoryItem[]> {
  if (!isDesktopRuntime()) return [];
  return invoke<BackupHistoryItem[]>("list_backups");
}

export async function validateBackup(
  filePath: string,
): Promise<BackupValidationResult> {
  return invoke<BackupValidationResult>("validate_backup", { filePath });
}

export async function deleteBackup(filePath: string): Promise<void> {
  if (!isDesktopRuntime()) {
    throw new Error("Desktop runtime required");
  }
  await invoke("delete_backup", { filePath });
}

export async function openBackupFolder(): Promise<string> {
  if (!isDesktopRuntime()) {
    throw new Error("Desktop runtime required");
  }
  return invoke<string>("open_backup_folder");
}

export async function exportBackup(filePath: string): Promise<string> {
  if (!isDesktopRuntime()) {
    throw new Error("Desktop runtime required");
  }
  return invoke<string>("export_backup", { filePath });
}

export async function restoreBackup(filePath: string): Promise<RestoreResult> {
  if (!isDesktopRuntime()) {
    throw new Error("Desktop runtime required");
  }
  return invoke<RestoreResult>("restore_backup", { filePath });
}

export async function restartApplication(): Promise<void> {
  if (!isDesktopRuntime()) {
    window.location.reload();
    return;
  }
  await invoke("restart_application");
}

export async function onRestoreProgress(
  handler: (payload: { progress: number; stage: string }) => void,
): Promise<UnlistenFn> {
  if (!isDesktopRuntime()) {
    return () => {};
  }
  return listen<{ progress: number; stage: string }>(
    "backup-restore-progress",
    (event) => handler(event.payload),
  );
}
