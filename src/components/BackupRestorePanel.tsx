import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Archive,
  Clock3,
  Database,
  Download,
  FolderOpen,
  HardDriveUpload,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createManualBackup,
  deleteBackup,
  exportBackup,
  getBackupConfig,
  listBackups,
  onRestoreProgress,
  openBackupFolder,
  restartApplication,
  restoreBackup,
  type BackupConfig,
  type BackupHistoryItem,
} from "@/services/backup";

interface BackupRestorePanelProps {
  onNotify: (message: string, type: "success" | "error" | "info") => void;
  onSaveConfig: (config: BackupConfig) => Promise<void>;
}

const frequencyOptions: Array<{
  value: BackupConfig["frequency"];
  label: string;
}> = [
  { value: "daily", label: "Daily at time" },
  { value: "every_12_hours", label: "Every 12 hours" },
  { value: "every_6_hours", label: "Every 6 hours" },
  { value: "startup_only", label: "Startup only" },
];

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1,
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`;
}

function formatBackupDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd MMM yyyy, hh:mm a");
}

export function BackupRestorePanel({
  onNotify,
  onSaveConfig,
}: BackupRestorePanelProps) {
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStage, setRestoreStage] = useState("idle");
  const [activeRestorePath, setActiveRestorePath] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "largest" | "smallest"
  >("latest");

  const reload = async () => {
    setLoading(true);
    try {
      const [cfg, backups] = await Promise.all([
        getBackupConfig(),
        listBackups(),
      ]);
      setConfig(cfg);
      setHistory(backups);
    } catch {
      onNotify("Unable to load backup data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    void onRestoreProgress((payload) => {
      setRestoreProgress(payload.progress);
      setRestoreStage(payload.stage);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = history.filter((row) => {
      if (!q) return true;
      return (
        row.file_name.toLowerCase().includes(q) ||
        row.backup_type.toLowerCase().includes(q) ||
        formatBackupDate(row.created_at).toLowerCase().includes(q)
      );
    });

    return rows.sort((a, b) => {
      if (sortBy === "largest") return b.size_bytes - a.size_bytes;
      if (sortBy === "smallest") return a.size_bytes - b.size_bytes;
      if (sortBy === "oldest") return a.created_at.localeCompare(b.created_at);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [history, query, sortBy]);

  const handleBackupNow = async () => {
    setCreatingBackup(true);
    try {
      const created = await createManualBackup();
      onNotify(`Backup created: ${created.file_name}`, "success");
      await reload();
    } catch {
      onNotify("Backup failed. Please try again.", "error");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      await onSaveConfig(config);
      onNotify("Backup settings saved.", "success");
      await reload();
    } catch {
      onNotify("Unable to save backup settings.", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRestore = async (item: BackupHistoryItem) => {
    const confirmed = confirm(
      `Restore this backup?\n\n${item.file_name}\nThis will replace the current database and restart the app.`,
    );
    if (!confirmed) return;

    setActiveRestorePath(item.file_path);
    setRestoreProgress(5);
    setRestoreStage("starting");

    try {
      const result = await restoreBackup(item.file_path);
      if (result.client_state_json) {
        localStorage.setItem(
          "backup_restore_snapshot",
          result.client_state_json,
        );
      }
      onNotify("Restore successful. Restarting ERP...", "success");

      const snapshot = localStorage.getItem("backup_restore_snapshot");
      if (snapshot) {
        const parsed = JSON.parse(snapshot) as {
          app_language: string | null;
          current_company_id: string | null;
          session_json: string | null;
          user_json: string | null;
        };

        const write = (key: string, value: string | null) => {
          if (typeof value === "string") {
            localStorage.setItem(key, value);
          } else {
            localStorage.removeItem(key);
          }
        };

        write("appLanguage", parsed.app_language);
        write("talha-fruit-company", parsed.current_company_id);
        write("fruit-market-erp-session", parsed.session_json);
        write("fruit-market-erp-user", parsed.user_json);
        localStorage.removeItem("backup_restore_snapshot");
      }

      await restartApplication();
    } catch {
      setRestoreProgress(0);
      setRestoreStage("failed");
      onNotify("Restore failed. Backup file may be corrupted.", "error");
    } finally {
      setActiveRestorePath(null);
      await reload();
    }
  };

  const handleDelete = async (item: BackupHistoryItem) => {
    const confirmed = confirm(`Delete backup ${item.file_name}?`);
    if (!confirmed) return;

    try {
      await deleteBackup(item.file_path);
      onNotify("Backup deleted.", "success");
      await reload();
    } catch {
      onNotify("Could not delete backup.", "error");
    }
  };

  const handleExport = async (item: BackupHistoryItem) => {
    try {
      const path = await exportBackup(item.file_path);
      onNotify(`Backup exported to ${path}`, "success");
    } catch {
      onNotify("Export failed.", "error");
    }
  };

  const cardClass =
    "rounded-xl border border-[#d7e0f2] dark:border-[#25314a] bg-[linear-gradient(145deg,#ffffff,#f7faff)] dark:bg-[linear-gradient(145deg,#0f172a,#111827)] p-4";

  return (
    <div className="space-y-4" data-erp-form>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className={cardClass}>
          <div className="flex items-center justify-between pb-3 border-b border-[#d9e1ef] dark:border-[#22314a]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                Auto Backup
              </h3>
            </div>
            <Button size="xs" variant="outline" onClick={() => void reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          {!config && (
            <p className="text-[12px] text-slate-500 mt-3">
              Loading backup settings...
            </p>
          )}

          {config && (
            <div className="space-y-3 mt-3">
              <label className="flex items-center justify-between rounded-lg border border-[#d3def2] dark:border-[#2a3a58] px-3 py-2 text-[12px]">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Enable automatic backup
                </span>
                <input
                  type="checkbox"
                  checked={config.auto_enabled}
                  onChange={(event) =>
                    setConfig((prev) =>
                      prev
                        ? { ...prev, auto_enabled: event.target.checked }
                        : prev,
                    )
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-[#d3def2] dark:border-[#2a3a58] px-3 py-2 text-[12px]">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Create startup backup
                </span>
                <input
                  type="checkbox"
                  checked={config.startup_backup}
                  onChange={(event) =>
                    setConfig((prev) =>
                      prev
                        ? { ...prev, startup_backup: event.target.checked }
                        : prev,
                    )
                  }
                />
              </label>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1">
                  Frequency
                </label>
                <select
                  value={config.frequency}
                  onChange={(event) =>
                    setConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            frequency: event.target
                              .value as BackupConfig["frequency"],
                          }
                        : prev,
                    )
                  }
                  className="w-full h-10 px-3 rounded-xl border border-[#d3def2] dark:border-[#2a3a58] bg-white dark:bg-[#0f172a] text-[13px]"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1">
                    Hour
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={config.backup_hour}
                    onChange={(event) =>
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              backup_hour: Math.max(
                                0,
                                Math.min(23, Number(event.target.value) || 0),
                              ),
                            }
                          : prev,
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#d3def2] dark:border-[#2a3a58] bg-white dark:bg-[#0f172a] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1">
                    Minute
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={config.backup_minute}
                    onChange={(event) =>
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              backup_minute: Math.max(
                                0,
                                Math.min(59, Number(event.target.value) || 0),
                              ),
                            }
                          : prev,
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#d3def2] dark:border-[#2a3a58] bg-white dark:bg-[#0f172a] text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 mb-1">
                    Retention count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={config.retention_count}
                    onChange={(event) =>
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              retention_count: Math.max(
                                1,
                                Number(event.target.value) || 1,
                              ),
                            }
                          : prev,
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#d3def2] dark:border-[#2a3a58] bg-white dark:bg-[#0f172a] text-[13px]"
                  />
                </div>
                <label className="flex items-end justify-between rounded-lg border border-[#d3def2] dark:border-[#2a3a58] px-3 py-2 text-[12px]">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    ZIP compression
                  </span>
                  <input
                    type="checkbox"
                    checked={config.compression_enabled}
                    onChange={(event) =>
                      setConfig((prev) =>
                        prev
                          ? {
                              ...prev,
                              compression_enabled: event.target.checked,
                            }
                          : prev,
                      )
                    }
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-500">
                Default path: AppData/TFC ERP/Backups. Latest backup is never
                auto-deleted.
              </p>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  loading={savingConfig}
                  onClick={() => void handleSaveConfig()}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Save Auto Backup
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className={cardClass}>
          <div className="flex items-center gap-2 pb-3 border-b border-[#d9e1ef] dark:border-[#22314a]">
            <Archive className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              Manual Backup & Restore
            </h3>
          </div>

          <div className="space-y-3 mt-3">
            <div className="rounded-lg bg-[#edf3ff] dark:bg-[#11203a] p-3 border border-[#d6e4ff] dark:border-[#2c4263]">
              <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                Backups include SQLite database, company profiles, language and
                print preferences, and ERP settings for all companies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => void handleBackupNow()}
                loading={creatingBackup}
              >
                <HardDriveUpload className="h-3.5 w-3.5" />
                Backup Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void openBackupFolder()
                    .then(() => onNotify("Backup folder opened.", "success"))
                    .catch(() =>
                      onNotify("Could not open backup folder.", "error"),
                    )
                }
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Open Backup Folder
              </Button>
            </div>

            <div className="rounded-lg border border-[#d6e0f2] dark:border-[#2a3a58] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
                  Restore Progress
                </p>
                <p className="text-[11px] tabnum text-slate-500">
                  {restoreProgress}%
                </p>
              </div>
              <div className="mt-2 h-2 rounded bg-slate-200 dark:bg-[#1b2a43] overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${restoreProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {restoreStage.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#d9e1ef] dark:border-[#22314a]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              Backup History
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search backups"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 pl-7 pr-3 rounded-lg border border-[#d3def2] dark:border-[#2a3a58] bg-white dark:bg-[#0f172a] text-[12px]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as typeof sortBy)
              }
              className="h-9 px-2 rounded-lg border border-[#d3def2] dark:border-[#2a3a58] bg-white dark:bg-[#0f172a] text-[12px]"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-6 text-[12px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading backup history...
          </div>
        )}

        {!loading && filteredHistory.length === 0 && (
          <div className="py-8 text-center text-[12px] text-slate-500">
            No backups found.
          </div>
        )}

        {!loading && filteredHistory.length > 0 && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-[#d9e1ef] dark:border-[#22314a]">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Size</th>
                  <th className="py-2 pr-2">Companies</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const restoring = activeRestorePath === item.file_path;
                  return (
                    <tr
                      key={item.file_path}
                      className="border-b border-[#e8edf8] dark:border-[#1d2a42]"
                    >
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-300">
                        <div>{formatBackupDate(item.created_at)}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.file_name}
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-200">
                          {item.backup_type}
                        </span>
                      </td>
                      <td className="py-2 pr-2 tabnum text-slate-700 dark:text-slate-300">
                        {formatBytes(item.size_bytes)}
                      </td>
                      <td className="py-2 pr-2 tabnum text-slate-700 dark:text-slate-300">
                        {item.company_count}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="xs"
                            variant="soft"
                            onClick={() => void handleRestore(item)}
                            disabled={restoring}
                          >
                            {restoring ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restore
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void handleExport(item)}
                          >
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/35"
                            onClick={() => void handleDelete(item)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
