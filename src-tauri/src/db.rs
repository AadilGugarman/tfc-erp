use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf};

#[derive(Debug, Serialize)]
pub struct DashboardSummary {
  pub total_parties: i64,
  pub total_suppliers: i64,
  pub total_vehicles: i64,
  pub total_weight: f64,
  pub outstanding_payments: f64,
  pub low_stock_items: i64,
}

#[derive(Debug, Serialize)]
pub struct VehicleRegisterSummary {
  pub id: String,
  pub entry_no: String,
  pub date: String,
  pub vehicle_number: String,
  pub driver_name: String,
  pub status: String,
  pub total_rows: i64,
  pub total_weight: f64,
  pub grand_total: f64,
}

#[derive(Debug, Deserialize)]
pub struct VehicleRegisterRowInput {
  pub party_id: Option<String>,
  pub party_name: String,
  pub vakkal: String,
  pub carat: f64,
  pub weight: f64,
  pub rate: f64,
  pub remarks: String,
  pub inventory_item_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VehicleRegisterInput {
  pub date: String,
  pub vehicle_number: String,
  pub driver_name: String,
  pub status: String,
  pub pending_amount: f64,
  pub outstanding_balance: f64,
  pub notes: String,
  pub rows: Vec<VehicleRegisterRowInput>,
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

pub fn ensure_database() -> Result<(), String> {
  let connection = open_connection()?;
  connection.execute_batch(
    r#"
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_state_snapshots (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      business_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      gstin TEXT NOT NULL,
      commission_percent REAL NOT NULL,
      tax_percent REAL NOT NULL,
      currency TEXT NOT NULL,
      bill_prefix TEXT NOT NULL,
      purchase_prefix TEXT NOT NULL,
      vehicle_prefix TEXT NOT NULL,
      next_bill_no INTEGER NOT NULL,
      next_purchase_no INTEGER NOT NULL,
      next_vehicle_entry_no INTEGER NOT NULL,
      language TEXT NOT NULL,
      dark_mode INTEGER NOT NULL DEFAULT 0,
      low_stock_alert INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      gstin TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      balance_type TEXT NOT NULL,
      is_supplier INTEGER NOT NULL DEFAULT 0,
      commission_percent REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
    CREATE INDEX IF NOT EXISTS idx_parties_phone ON parties(phone);

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      balance_type TEXT NOT NULL,
      commission_percent REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
      party_name TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      running_balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ledger_party_date ON ledger_entries(party_id, date);

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      category TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      low_stock_threshold REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      warehouse TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      bill_no TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
      party_name TEXT NOT NULL,
      subtotal REAL NOT NULL,
      commission REAL NOT NULL,
      tax_amount REAL NOT NULL,
      tax_percent REAL NOT NULL,
      total REAL NOT NULL,
      previous_balance REAL NOT NULL,
      paid_amount REAL NOT NULL,
      net_balance REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
      fruit_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      box_count REAL NOT NULL,
      weight_per_box REAL NOT NULL,
      total_weight REAL NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      lot_no TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      purchase_no TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      supplier_name TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total REAL NOT NULL,
      paid_amount REAL NOT NULL,
      net_balance REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      fruit_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      lot_no TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
      party_name TEXT NOT NULL,
      amount REAL NOT NULL,
      mode TEXT NOT NULL,
      type TEXT NOT NULL,
      reference_no TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      ledger_entry_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
    CREATE INDEX IF NOT EXISTS idx_payments_party ON payments(party_id);

    CREATE TABLE IF NOT EXISTS vehicle_registers (
      id TEXT PRIMARY KEY,
      entry_no TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      status TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      total_weight REAL NOT NULL,
      grand_total REAL NOT NULL,
      pending_amount REAL NOT NULL,
      outstanding_balance REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vehicle_register_date ON vehicle_registers(date);

    CREATE TABLE IF NOT EXISTS vehicle_register_rows (
      id TEXT PRIMARY KEY,
      vehicle_register_id TEXT NOT NULL REFERENCES vehicle_registers(id) ON DELETE CASCADE,
      party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
      party_name TEXT NOT NULL,
      vakkal TEXT NOT NULL,
      carat REAL NOT NULL,
      weight REAL NOT NULL,
      rate REAL NOT NULL,
      total REAL NOT NULL,
      remarks TEXT NOT NULL DEFAULT '',
      inventory_item_id TEXT REFERENCES inventory_items(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    "#,
  ).map_err(|error| error.to_string())?;

  seed_default_settings(&connection)?;
  Ok(())
}

fn seed_default_settings(connection: &Connection) -> Result<(), String> {
  let count: i64 = connection
    .query_row("SELECT COUNT(1) FROM settings", [], |row| row.get(0))
    .map_err(|error| error.to_string())?;

  if count == 0 {
    connection
      .execute(
        "INSERT INTO settings (id, business_name, business_address, city, state, phone, email, gstin, commission_percent, tax_percent, currency, bill_prefix, purchase_prefix, vehicle_prefix, next_bill_no, next_purchase_no, next_vehicle_entry_no, language, dark_mode, low_stock_alert, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)",
        params![
          "default",
          "ફળ માર્કેટ કમિશન એજન્ટ",
          "મુખ્ય બજાર યાર્ડ",
          "અમદાવાદ",
          "ગુજરાત",
          "+91 98765 43210",
          "info@fruitmarket.com",
          "24ABCDE1234F1Z5",
          3.0_f64,
          5.0_f64,
          "₹",
          "FM",
          "PO",
          "VR",
          1001_i64,
          5001_i64,
          2001_i64,
          "gujarati",
          false,
          true,
          now_iso(),
          now_iso(),
        ],
      )
      .map_err(|error| error.to_string())?;
  }

  Ok(())
}

#[tauri::command]
pub fn init_database() -> Result<String, String> {
  ensure_database()?;
  Ok("ok".to_string())
}

#[tauri::command]
pub fn get_dashboard_summary() -> Result<DashboardSummary, String> {
  let connection = open_connection()?;
  Ok(DashboardSummary {
    total_parties: scalar_count(&connection, "SELECT COUNT(1) FROM parties")?,
    total_suppliers: scalar_count(&connection, "SELECT COUNT(1) FROM suppliers")?,
    total_vehicles: scalar_count(&connection, "SELECT COUNT(1) FROM vehicle_registers")?,
    total_weight: scalar_float(&connection, "SELECT COALESCE(SUM(total_weight), 0) FROM vehicle_registers")?,
    outstanding_payments: scalar_float(&connection, "SELECT COALESCE(SUM(outstanding_balance), 0) FROM vehicle_registers")?,
    low_stock_items: scalar_count(&connection, "SELECT COUNT(1) FROM inventory_items WHERE status IN ('low_stock', 'out_of_stock')")?,
  })
}

#[tauri::command]
pub fn list_vehicle_registers() -> Result<Vec<VehicleRegisterSummary>, String> {
  let connection = open_connection()?;
  let mut statement = connection
    .prepare(
      "SELECT id, entry_no, date, vehicle_number, driver_name, status, total_rows, total_weight, grand_total FROM vehicle_registers ORDER BY date DESC, created_at DESC",
    )
    .map_err(|error| error.to_string())?;

  let registers = statement
    .query_map([], |row| {
      Ok(VehicleRegisterSummary {
        id: row.get(0)?,
        entry_no: row.get(1)?,
        date: row.get(2)?,
        vehicle_number: row.get(3)?,
        driver_name: row.get(4)?,
        status: row.get(5)?,
        total_rows: row.get(6)?,
        total_weight: row.get(7)?,
        grand_total: row.get(8)?,
      })
    })
    .map_err(|error| error.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|error| error.to_string())?;

  Ok(registers)
}

#[tauri::command]
pub fn save_vehicle_register(input: VehicleRegisterInput) -> Result<String, String> {
  let mut connection = open_connection()?;
  let transaction = connection.transaction().map_err(|error| error.to_string())?;

  let next_entry_no: i64 = transaction
    .query_row("SELECT next_vehicle_entry_no FROM settings LIMIT 1", [], |row| row.get(0))
    .map_err(|error| error.to_string())?;
  let entry_no = format!("VR-{}", next_entry_no);
  let register_id = uuid_like_id();
  let now = now_iso();

  let totals = input.rows.iter().fold((0.0_f64, 0.0_f64), |mut acc, row| {
    let total = row.carat * row.weight * row.rate;
    acc.0 += row.weight;
    acc.1 += total;
    acc
  });

  transaction
    .execute(
      "INSERT INTO vehicle_registers (id, entry_no, date, vehicle_number, driver_name, status, total_rows, total_weight, grand_total, pending_amount, outstanding_balance, notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
      params![
        register_id,
        entry_no,
        input.date,
        input.vehicle_number,
        input.driver_name,
        input.status,
        input.rows.len() as i64,
        totals.0,
        totals.1,
        input.pending_amount,
        input.outstanding_balance,
        input.notes,
        now,
        now,
      ],
    )
    .map_err(|error| error.to_string())?;

  for row in &input.rows {
    let row_id = uuid_like_id();
    let row_total = row.carat * row.weight * row.rate;
    transaction
      .execute(
        "INSERT INTO vehicle_register_rows (id, vehicle_register_id, party_id, party_name, vakkal, carat, weight, rate, total, remarks, inventory_item_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
          row_id,
          register_id,
          row.party_id,
          row.party_name,
          row.vakkal,
          row.carat,
          row.weight,
          row.rate,
          row_total,
          row.remarks,
          row.inventory_item_id,
          now,
          now,
        ],
      )
      .map_err(|error| error.to_string())?;

    if let Some(party_id) = &row.party_id {
      transaction
        .execute(
          "INSERT INTO ledger_entries (id, party_id, party_name, date, type, amount, description, reference_type, reference_id, running_balance, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 'debit', ?5, ?6, 'vehicle_register', ?7, 0, ?8, ?9)",
          params![
            uuid_like_id(),
            party_id,
            row.party_name,
            input.date,
            row_total,
            format!("Vehicle Register {}", entry_no),
            register_id,
            now,
            now,
          ],
        )
        .map_err(|error| error.to_string())?;
    }
  }

  transaction
    .execute(
      "UPDATE settings SET next_vehicle_entry_no = next_vehicle_entry_no + 1, updated_at = ?1 WHERE id = 'default'",
      params![now],
    )
    .map_err(|error| error.to_string())?;

  transaction.commit().map_err(|error| error.to_string())?;
  Ok(register_id)
}

#[tauri::command]
pub fn load_app_state() -> Result<Option<String>, String> {
  let connection = open_connection()?;
  let data = connection
    .query_row(
      "SELECT data FROM app_state_snapshots WHERE id = 'default' LIMIT 1",
      [],
      |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|error| error.to_string())?;

  Ok(data)
}

#[tauri::command]
pub fn save_app_state(data: String) -> Result<String, String> {
  let _: Value = serde_json::from_str(&data).map_err(|error| error.to_string())?;
  let connection = open_connection()?;
  let now = now_iso();

  connection
    .execute(
      "INSERT INTO app_state_snapshots (id, data, created_at, updated_at) VALUES ('default', ?1, ?2, ?2)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      params![data, now],
    )
    .map_err(|error| error.to_string())?;

  Ok("ok".to_string())
}

fn scalar_count(connection: &Connection, query: &str) -> Result<i64, String> {
  connection
    .query_row(query, [], |row| row.get(0))
    .map_err(|error| error.to_string())
}

fn scalar_float(connection: &Connection, query: &str) -> Result<f64, String> {
  connection
    .query_row(query, [], |row| row.get(0))
    .map_err(|error| error.to_string())
}

fn now_iso() -> String {
  Utc::now().to_rfc3339()
}

fn uuid_like_id() -> String {
  Utc::now().timestamp_nanos_opt().unwrap_or_default().to_string()
}