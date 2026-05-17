use chrono::{DateTime, Local, Timelike, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use crate::auth::authorize;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

const BACKUP_SCHEMA_VERSION: i32 = 1;
const BACKUP_DB_ENTRY: &str = "data/tfc_erp.db";
const BACKUP_METADATA_ENTRY: &str = "metadata.json";
const BACKUP_CLIENT_STATE_ENTRY: &str = "state/client_state.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BackupFrequency {
  Daily,
  Every12Hours,
  Every6Hours,
  StartupOnly,
}

impl BackupFrequency {
  fn from_db(value: &str) -> Self {
    match value {
      "every_12_hours" => Self::Every12Hours,
      "every_6_hours" => Self::Every6Hours,
      "startup_only" => Self::StartupOnly,
      _ => Self::Daily,
    }
  }

  fn as_db(&self) -> &'static str {
    match self {
      Self::Daily => "daily",
      Self::Every12Hours => "every_12_hours",
      Self::Every6Hours => "every_6_hours",
      Self::StartupOnly => "startup_only",
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BackupConfig {
  pub auto_enabled: bool,
  pub startup_backup: bool,
  pub frequency: BackupFrequency,
  pub backup_hour: u8,
  pub backup_minute: u8,
  pub retention_count: usize,
  pub compression_enabled: bool,
  pub backup_dir: Option<String>,
  pub last_auto_backup_at: Option<String>,
}

impl Default for BackupConfig {
  fn default() -> Self {
    Self {
      auto_enabled: true,
      startup_backup: true,
      frequency: BackupFrequency::Daily,
      backup_hour: 20,
      backup_minute: 0,
      retention_count: 30,
      compression_enabled: true,
      backup_dir: None,
      last_auto_backup_at: None,
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BackupHistoryItem {
  pub file_name: String,
  pub file_path: String,
  pub created_at: String,
  pub size_bytes: u64,
  pub backup_type: String,
  pub company_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct BackupValidationResult {
  pub valid: bool,
  pub message: String,
  pub backup_type: Option<String>,
  pub created_at: Option<String>,
  pub company_count: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct RestoreResult {
  pub message: String,
  pub restored_from: String,
  pub restored_at: String,
  pub company_count: usize,
  pub client_state_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
struct BackupMetadata {
  schema_version: i32,
  app_name: String,
  backup_type: String,
  created_at: String,
  db_file_name: String,
  company_count: usize,
  companies: Vec<String>,
  includes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
struct ClientStateSnapshot {
  app_language: Option<String>,
  current_company_id: Option<String>,
  companies_json: Option<String>,
  session_json: Option<String>,
  user_json: Option<String>,
  preferences_json: Option<String>,
}

#[derive(Debug, Clone)]
struct ParsedClientState {
  raw_json: String,
  company_names: Vec<String>,
}

fn db_path() -> Result<PathBuf, String> {
  let base_dir = dirs::data_dir().ok_or_else(|| "unable to locate application data directory".to_string())?;
  let app_dir = base_dir.join("Fruit Market ERP");
  fs::create_dir_all(&app_dir).map_err(|error| error.to_string())?;
  Ok(app_dir.join("fruit-market-erp.sqlite"))
}

fn open_connection() -> Result<Connection, String> {
  Connection::open(db_path()?).map_err(|error| error.to_string())
}

fn ensure_backup_tables() -> Result<(), String> {
  let connection = open_connection()?;
  connection
    .execute_batch(
      r#"
      CREATE TABLE IF NOT EXISTS backup_config (
        id TEXT PRIMARY KEY,
        auto_enabled INTEGER NOT NULL DEFAULT 1,
        startup_backup INTEGER NOT NULL DEFAULT 1,
        frequency TEXT NOT NULL DEFAULT 'daily',
        backup_hour INTEGER NOT NULL DEFAULT 20,
        backup_minute INTEGER NOT NULL DEFAULT 0,
        retention_count INTEGER NOT NULL DEFAULT 30,
        compression_enabled INTEGER NOT NULL DEFAULT 1,
        backup_dir TEXT,
        last_auto_backup_at TEXT,
        last_client_state_json TEXT,
        updated_at TEXT NOT NULL
      );
      "#,
    )
    .map_err(|error| error.to_string())?;

  let count: i64 = connection
    .query_row("SELECT COUNT(1) FROM backup_config WHERE id = 'default'", [], |row| row.get(0))
    .map_err(|error| error.to_string())?;

  if count == 0 {
    let now = Utc::now().to_rfc3339();
    connection
      .execute(
        "INSERT INTO backup_config (id, auto_enabled, startup_backup, frequency, backup_hour, backup_minute, retention_count, compression_enabled, backup_dir, last_auto_backup_at, last_client_state_json, updated_at) VALUES ('default', 1, 1, 'daily', 20, 0, 30, 1, NULL, NULL, NULL, ?1)",
        params![now],
      )
      .map_err(|error| error.to_string())?;
  }

  Ok(())
}

fn load_backup_config_internal() -> Result<BackupConfig, String> {
  ensure_backup_tables()?;
  let connection = open_connection()?;

  let row = connection
    .query_row(
      "SELECT auto_enabled, startup_backup, frequency, backup_hour, backup_minute, retention_count, compression_enabled, backup_dir, last_auto_backup_at FROM backup_config WHERE id = 'default' LIMIT 1",
      [],
      |row| {
        Ok(BackupConfig {
          auto_enabled: row.get::<_, bool>(0)?,
          startup_backup: row.get::<_, bool>(1)?,
          frequency: BackupFrequency::from_db(&row.get::<_, String>(2)?),
          backup_hour: row.get::<_, i64>(3)?.clamp(0, 23) as u8,
          backup_minute: row.get::<_, i64>(4)?.clamp(0, 59) as u8,
          retention_count: row.get::<_, i64>(5)?.clamp(1, 3650) as usize,
          compression_enabled: row.get::<_, bool>(6)?,
          backup_dir: row.get(7)?,
          last_auto_backup_at: row.get(8)?,
        })
      },
    )
    .map_err(|error| error.to_string())?;

  Ok(row)
}

fn save_backup_config_internal(config: &BackupConfig) -> Result<BackupConfig, String> {
  ensure_backup_tables()?;
  let connection = open_connection()?;
  let now = Utc::now().to_rfc3339();

  connection
    .execute(
      "UPDATE backup_config SET auto_enabled = ?1, startup_backup = ?2, frequency = ?3, backup_hour = ?4, backup_minute = ?5, retention_count = ?6, compression_enabled = ?7, backup_dir = ?8, updated_at = ?9 WHERE id = 'default'",
      params![
        config.auto_enabled,
        config.startup_backup,
        config.frequency.as_db(),
        config.backup_hour as i64,
        config.backup_minute as i64,
        config.retention_count as i64,
        config.compression_enabled,
        config.backup_dir,
        now,
      ],
    )
    .map_err(|error| error.to_string())?;

  load_backup_config_internal()
}

fn update_last_auto_backup_now() -> Result<(), String> {
  ensure_backup_tables()?;
  let connection = open_connection()?;
  let now = Utc::now().to_rfc3339();
  connection
    .execute(
      "UPDATE backup_config SET last_auto_backup_at = ?1, updated_at = ?1 WHERE id = 'default'",
      params![now],
    )
    .map_err(|error| error.to_string())?;
  Ok(())
}

fn save_client_state_snapshot(json: &str) -> Result<(), String> {
  ensure_backup_tables()?;
  let connection = open_connection()?;
  let now = Utc::now().to_rfc3339();
  connection
    .execute(
      "UPDATE backup_config SET last_client_state_json = ?1, updated_at = ?2 WHERE id = 'default'",
      params![json, now],
    )
    .map_err(|error| error.to_string())?;
  Ok(())
}

fn load_client_state_snapshot() -> Result<Option<String>, String> {
  ensure_backup_tables()?;
  let connection = open_connection()?;
  connection
    .query_row(
      "SELECT last_client_state_json FROM backup_config WHERE id = 'default' LIMIT 1",
      [],
      |row| row.get::<_, Option<String>>(0),
    )
    .optional()
    .map_err(|error| error.to_string())
    .map(|v| v.flatten())
}

fn backup_root_dir(config: &BackupConfig) -> Result<PathBuf, String> {
  let path = if let Some(custom) = &config.backup_dir {
    PathBuf::from(custom)
  } else {
    let base_dir = dirs::data_dir().ok_or_else(|| "unable to locate application data directory".to_string())?;
    base_dir.join("TFC ERP").join("Backups")
  };

  fs::create_dir_all(&path).map_err(|error| error.to_string())?;
  Ok(path)
}

fn parse_client_state(json: Option<String>) -> Option<ParsedClientState> {
  let raw_json = json?;
  let parsed: ClientStateSnapshot = serde_json::from_str(&raw_json).ok()?;

  let company_names = parsed
    .companies_json
    .and_then(|companies_json| serde_json::from_str::<serde_json::Value>(&companies_json).ok())
    .and_then(|value| value.as_array().cloned())
    .map(|items| {
      items
        .iter()
        .filter_map(|item| item.get("name").and_then(|name| name.as_str()).map(str::to_string))
        .collect::<Vec<_>>()
    })
    .unwrap_or_default();

  Some(ParsedClientState {
    raw_json,
    company_names,
  })
}

fn next_backup_file_name(backup_type: &str) -> String {
  let now = Local::now();
  format!(
    "tfc_backup_{}_{}_{}_{}_{}_{}_{}.zip",
    now.format("%Y"),
    now.format("%m"),
    now.format("%d"),
    now.format("%H"),
    now.format("%M"),
    now.format("%S"),
    backup_type
  )
}

fn sqlite_consistent_snapshot(src_db_path: &Path, output_db_path: &Path) -> Result<(), String> {
  let source = Connection::open(src_db_path).map_err(|error| error.to_string())?;
  let mut destination = Connection::open(output_db_path).map_err(|error| error.to_string())?;
  let backup = rusqlite::backup::Backup::new(&source, &mut destination).map_err(|error| error.to_string())?;
  backup
    .run_to_completion(64, Duration::from_millis(20), None)
    .map_err(|error| error.to_string())?;
  Ok(())
}

fn create_backup_internal(backup_type: &str, client_state_json: Option<String>) -> Result<BackupHistoryItem, String> {
  ensure_backup_tables()?;
  let config = load_backup_config_internal()?;
  let backup_dir = backup_root_dir(&config)?;
  let db_path = db_path()?;

  if !db_path.exists() {
    return Err("database file does not exist".to_string());
  }

  let temp_snapshot_path = backup_dir.join(format!(".snapshot_{}_{}.sqlite", backup_type, Utc::now().timestamp_millis()));
  sqlite_consistent_snapshot(&db_path, &temp_snapshot_path)?;

  let client_state = parse_client_state(client_state_json.or_else(|| load_client_state_snapshot().ok().flatten()));

  let backup_file_name = next_backup_file_name(backup_type);
  let backup_file_path = backup_dir.join(&backup_file_name);
  let file = File::create(&backup_file_path).map_err(|error| error.to_string())?;
  let mut writer = ZipWriter::new(file);
  let options = if config.compression_enabled {
    SimpleFileOptions::default()
      .compression_method(CompressionMethod::Deflated)
      .compression_level(Some(6))
  } else {
    SimpleFileOptions::default().compression_method(CompressionMethod::Stored)
  };

  let mut db_bytes = Vec::new();
  File::open(&temp_snapshot_path)
    .map_err(|error| error.to_string())?
    .read_to_end(&mut db_bytes)
    .map_err(|error| error.to_string())?;

  let company_names = client_state
    .as_ref()
    .map(|state| state.company_names.clone())
    .unwrap_or_default();

  let metadata = BackupMetadata {
    schema_version: BACKUP_SCHEMA_VERSION,
    app_name: "TFC ERP (Talha Fruit Co.)".to_string(),
    backup_type: backup_type.to_string(),
    created_at: Utc::now().to_rfc3339(),
    db_file_name: "tfc_erp.db".to_string(),
    company_count: company_names.len(),
    companies: company_names,
    includes: vec![
      "sqlite_database".to_string(),
      "app_settings".to_string(),
      "multi_company_state".to_string(),
      "user_preferences".to_string(),
      "language_and_print_settings".to_string(),
    ],
  };

  writer
    .start_file(BACKUP_DB_ENTRY, options)
    .map_err(|error| error.to_string())?;
  writer.write_all(&db_bytes).map_err(|error| error.to_string())?;

  writer
    .start_file(BACKUP_METADATA_ENTRY, options)
    .map_err(|error| error.to_string())?;
  writer
    .write_all(serde_json::to_string_pretty(&metadata).map_err(|error| error.to_string())?.as_bytes())
    .map_err(|error| error.to_string())?;

  if let Some(client_state) = client_state {
    writer
      .start_file(BACKUP_CLIENT_STATE_ENTRY, options)
      .map_err(|error| error.to_string())?;
    writer
      .write_all(client_state.raw_json.as_bytes())
      .map_err(|error| error.to_string())?;
  }

  writer.finish().map_err(|error| error.to_string())?;
  let _ = fs::remove_file(&temp_snapshot_path);

  enforce_retention_policy(&backup_dir, config.retention_count)?;

  let metadata_fs = fs::metadata(&backup_file_path).map_err(|error| error.to_string())?;
  Ok(BackupHistoryItem {
    file_name: backup_file_name,
    file_path: backup_file_path.to_string_lossy().to_string(),
    created_at: metadata.created_at,
    size_bytes: metadata_fs.len(),
    backup_type: backup_type.to_string(),
    company_count: metadata.company_count,
  })
}

fn read_metadata_from_zip(path: &Path) -> Option<BackupMetadata> {
  let file = File::open(path).ok()?;
  let mut archive = ZipArchive::new(file).ok()?;
  let mut metadata_file = archive.by_name(BACKUP_METADATA_ENTRY).ok()?;
  let mut content = String::new();
  metadata_file.read_to_string(&mut content).ok()?;
  serde_json::from_str::<BackupMetadata>(&content).ok()
}

fn read_client_state_from_zip(path: &Path) -> Option<String> {
  let file = File::open(path).ok()?;
  let mut archive = ZipArchive::new(file).ok()?;
  let mut state_file = archive.by_name(BACKUP_CLIENT_STATE_ENTRY).ok()?;
  let mut content = String::new();
  state_file.read_to_string(&mut content).ok()?;
  Some(content)
}

fn enforce_retention_policy(backup_dir: &Path, retention_count: usize) -> Result<(), String> {
  let mut backups = list_backups_from_dir(backup_dir)?;
  backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));

  if backups.len() <= retention_count {
    return Ok(());
  }

  for item in backups.iter().skip(retention_count) {
    let path = PathBuf::from(&item.file_path);
    let _ = fs::remove_file(path);
  }

  Ok(())
}

fn list_backups_from_dir(backup_dir: &Path) -> Result<Vec<BackupHistoryItem>, String> {
  if !backup_dir.exists() {
    return Ok(Vec::new());
  }

  let mut rows = Vec::new();
  for entry in fs::read_dir(backup_dir).map_err(|error| error.to_string())? {
    let entry = entry.map_err(|error| error.to_string())?;
    let path = entry.path();

    if path.extension().and_then(|ext| ext.to_str()) != Some("zip") {
      continue;
    }

    let file_name = entry.file_name().to_string_lossy().to_string();
    let file_metadata = entry.metadata().map_err(|error| error.to_string())?;
    let backup_meta = read_metadata_from_zip(&path);

    rows.push(BackupHistoryItem {
      file_name,
      file_path: path.to_string_lossy().to_string(),
      created_at: backup_meta
        .as_ref()
        .map(|m| m.created_at.clone())
        .unwrap_or_else(|| {
          file_metadata
            .modified()
            .ok()
            .map(|time| DateTime::<Utc>::from(time).to_rfc3339())
            .unwrap_or_else(|| Utc::now().to_rfc3339())
        }),
      size_bytes: file_metadata.len(),
      backup_type: backup_meta
        .as_ref()
        .map(|m| m.backup_type.clone())
        .unwrap_or_else(|| "unknown".to_string()),
      company_count: backup_meta.map(|m| m.company_count).unwrap_or(0),
    });
  }

  rows.sort_by(|a, b| b.created_at.cmp(&a.created_at));
  Ok(rows)
}

fn validate_backup_file(path: &Path) -> BackupValidationResult {
  let file = match File::open(path) {
    Ok(file) => file,
    Err(error) => {
      return BackupValidationResult {
        valid: false,
        message: format!("unable to open backup file: {error}"),
        backup_type: None,
        created_at: None,
        company_count: None,
      }
    }
  };

  let mut archive = match ZipArchive::new(file) {
    Ok(archive) => archive,
    Err(error) => {
      return BackupValidationResult {
        valid: false,
        message: format!("invalid zip archive: {error}"),
        backup_type: None,
        created_at: None,
        company_count: None,
      }
    }
  };

  let metadata = match archive.by_name(BACKUP_METADATA_ENTRY) {
    Ok(mut metadata_file) => {
      let mut raw = String::new();
      if metadata_file.read_to_string(&mut raw).is_err() {
        return BackupValidationResult {
          valid: false,
          message: "metadata.json is unreadable".to_string(),
          backup_type: None,
          created_at: None,
          company_count: None,
        };
      }

      match serde_json::from_str::<BackupMetadata>(&raw) {
        Ok(metadata) => metadata,
        Err(error) => {
          return BackupValidationResult {
            valid: false,
            message: format!("metadata.json is invalid: {error}"),
            backup_type: None,
            created_at: None,
            company_count: None,
          }
        }
      }
    }
    Err(_) => {
      return BackupValidationResult {
        valid: false,
        message: "metadata.json is missing".to_string(),
        backup_type: None,
        created_at: None,
        company_count: None,
      }
    }
  };

  if archive.by_name(BACKUP_DB_ENTRY).is_err() {
    return BackupValidationResult {
      valid: false,
      message: "database payload is missing".to_string(),
      backup_type: Some(metadata.backup_type),
      created_at: Some(metadata.created_at),
      company_count: Some(metadata.company_count),
    };
  }

  BackupValidationResult {
    valid: true,
    message: "backup is valid".to_string(),
    backup_type: Some(metadata.backup_type),
    created_at: Some(metadata.created_at),
    company_count: Some(metadata.company_count),
  }
}

fn should_run_auto_backup(config: &BackupConfig) -> bool {
  if !config.auto_enabled {
    return false;
  }

  let now = Local::now();
  let last_run = config
    .last_auto_backup_at
    .as_ref()
    .and_then(|value| DateTime::parse_from_rfc3339(value).ok())
    .map(|dt| dt.with_timezone(&Local));

  match config.frequency {
    BackupFrequency::StartupOnly => false,
    BackupFrequency::Every6Hours => {
      if let Some(last) = last_run {
        now.signed_duration_since(last).num_hours() >= 6
      } else {
        true
      }
    }
    BackupFrequency::Every12Hours => {
      if let Some(last) = last_run {
        now.signed_duration_since(last).num_hours() >= 12
      } else {
        true
      }
    }
    BackupFrequency::Daily => {
      if now.hour() as u8 != config.backup_hour || now.minute() as u8 != config.backup_minute {
        return false;
      }

      if let Some(last) = last_run {
        last.date_naive() != now.date_naive()
      } else {
        true
      }
    }
  }
}

fn open_folder_in_os(path: &Path) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
      .arg(path)
      .status()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(path)
      .status()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[cfg(all(unix, not(target_os = "macos")))]
  {
    Command::new("xdg-open")
      .arg(path)
      .status()
      .map_err(|error| error.to_string())?;
    return Ok(());
  }

  #[allow(unreachable_code)]
  Err("unsupported platform".to_string())
}

#[tauri::command]
pub fn get_backup_config(token: String) -> Result<BackupConfig, String> {
  authorize(&token)?;
  load_backup_config_internal()
}

#[tauri::command]
pub fn update_backup_config(token: String, config: BackupConfig) -> Result<BackupConfig, String> {
  authorize(&token)?;
  save_backup_config_internal(&config)
}

#[tauri::command]
pub fn save_backup_client_state(token: String, client_state_json: String) -> Result<String, String> {
  authorize(&token)?;
  save_client_state_snapshot(&client_state_json)?;
  Ok("ok".to_string())
}

#[tauri::command]
pub fn create_manual_backup(token: String, client_state_json: Option<String>) -> Result<BackupHistoryItem, String> {
  authorize(&token)?;
  create_backup_internal("manual", client_state_json)
}

#[tauri::command]
pub fn create_startup_backup(token: String) -> Result<Option<BackupHistoryItem>, String> {
  authorize(&token)?;
  let config = load_backup_config_internal()?;
  if !config.auto_enabled || !config.startup_backup {
    return Ok(None);
  }

  let backup = create_backup_internal("startup", None)?;
  update_last_auto_backup_now()?;
  Ok(Some(backup))
}

#[tauri::command]
pub fn run_auto_backup_if_due(token: String) -> Result<Option<BackupHistoryItem>, String> {
  authorize(&token)?;
  let config = load_backup_config_internal()?;
  if !should_run_auto_backup(&config) {
    return Ok(None);
  }

  let backup = create_backup_internal("auto", None)?;
  update_last_auto_backup_now()?;
  Ok(Some(backup))
}

#[tauri::command]
pub fn list_backups(token: String) -> Result<Vec<BackupHistoryItem>, String> {
  authorize(&token)?;
  let config = load_backup_config_internal()?;
  let backup_dir = backup_root_dir(&config)?;
  list_backups_from_dir(&backup_dir)
}

#[tauri::command]
pub fn validate_backup(token: String, file_path: String) -> Result<BackupValidationResult, String> {
  authorize(&token)?;
  Ok(validate_backup_file(Path::new(&file_path)))
}

#[tauri::command]
pub fn delete_backup(token: String, file_path: String) -> Result<String, String> {
  authorize(&token)?;
  let path = PathBuf::from(file_path);
  if !path.exists() {
    return Ok("already deleted".to_string());
  }

  fs::remove_file(path).map_err(|error| error.to_string())?;
  Ok("deleted".to_string())
}

#[tauri::command]
pub fn open_backup_folder(token: String) -> Result<String, String> {
  authorize(&token)?;
  let config = load_backup_config_internal()?;
  let backup_dir = backup_root_dir(&config)?;
  open_folder_in_os(&backup_dir)?;
  Ok(backup_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn export_backup(token: String, file_path: String) -> Result<String, String> {
  authorize(&token)?;
  let source = PathBuf::from(file_path);
  if !source.exists() {
    return Err("backup file does not exist".to_string());
  }

  let downloads = dirs::download_dir().ok_or_else(|| "downloads folder not available".to_string())?;
  fs::create_dir_all(&downloads).map_err(|error| error.to_string())?;

  let target = downloads.join(
    source
      .file_name()
      .ok_or_else(|| "invalid backup filename".to_string())?
      .to_string_lossy()
      .to_string(),
  );

  fs::copy(&source, &target).map_err(|error| error.to_string())?;
  Ok(target.to_string_lossy().to_string())
}

#[tauri::command]
pub fn restore_backup(token: String, file_path: String, app: AppHandle) -> Result<RestoreResult, String> {
  authorize(&token)?;
  let backup_path = PathBuf::from(&file_path);
  if !backup_path.exists() {
    return Err("backup file does not exist".to_string());
  }

  let validation = validate_backup_file(&backup_path);
  if !validation.valid {
    return Err(format!("backup validation failed: {}", validation.message));
  }

  let _ = app.emit("backup-restore-progress", serde_json::json!({ "progress": 10, "stage": "validation_complete" }));

  let config = load_backup_config_internal()?;
  let backup_dir = backup_root_dir(&config)?;
  let temp_dir = backup_dir.join(format!(".restore_{}", Utc::now().timestamp_millis()));
  fs::create_dir_all(&temp_dir).map_err(|error| error.to_string())?;

  let file = File::open(&backup_path).map_err(|error| error.to_string())?;
  let mut archive = ZipArchive::new(file).map_err(|error| error.to_string())?;

  let extracted_db = temp_dir.join("restored.sqlite");
  {
    let mut db_file = archive.by_name(BACKUP_DB_ENTRY).map_err(|error| error.to_string())?;
    let mut output = File::create(&extracted_db).map_err(|error| error.to_string())?;
    std::io::copy(&mut db_file, &mut output).map_err(|error| error.to_string())?;
  }

  let _ = app.emit("backup-restore-progress", serde_json::json!({ "progress": 40, "stage": "backup_extracted" }));

  let sanity_connection = Connection::open(&extracted_db).map_err(|error| error.to_string())?;
  sanity_connection
    .query_row(
      "SELECT COUNT(1) FROM sqlite_master WHERE type = 'table' AND name = 'settings'",
      [],
      |row| row.get::<_, i64>(0),
    )
    .map_err(|error| error.to_string())?;

  let _ = app.emit("backup-restore-progress", serde_json::json!({ "progress": 65, "stage": "database_validated" }));

  let live_db = db_path()?;
  let safety_copy_path = backup_dir.join(format!(
    "pre_restore_{}.sqlite",
    Local::now().format("%Y_%m_%d_%H_%M_%S")
  ));

  if live_db.exists() {
    fs::copy(&live_db, &safety_copy_path).map_err(|error| error.to_string())?;
  }

  fs::copy(&extracted_db, &live_db).map_err(|error| error.to_string())?;

  let _ = app.emit("backup-restore-progress", serde_json::json!({ "progress": 90, "stage": "database_replaced" }));

  let client_state_json = read_client_state_from_zip(&backup_path);
  let _ = fs::remove_dir_all(&temp_dir);

  let metadata = read_metadata_from_zip(&backup_path);
  let result = RestoreResult {
    message: "Restore completed successfully. Application restart is required.".to_string(),
    restored_from: backup_path.to_string_lossy().to_string(),
    restored_at: Utc::now().to_rfc3339(),
    company_count: metadata.as_ref().map(|m| m.company_count).unwrap_or(0),
    client_state_json,
  };

  let _ = app.emit("backup-restore-progress", serde_json::json!({ "progress": 100, "stage": "completed" }));
  Ok(result)
}

#[tauri::command]
pub fn restart_application(app: AppHandle) -> Result<String, String> {
  app.request_restart();
  Ok("restarting".to_string())
}

pub fn start_backup_scheduler() {
  thread::spawn(|| loop {
    let _ = run_auto_backup_if_due();
    thread::sleep(Duration::from_secs(60));
  });
}
