use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::{fs};
use crate::auth::authorize;

/// Mask sensitive database errors in production while logging them locally
pub fn map_db_error<E: std::fmt::Display>(e: E) -> String {
  let err_msg = e.to_string();
  eprintln!("[Database Error] {}", err_msg);
  
  if cfg!(debug_assertions) {
    err_msg
  } else {
    "A database error occurred. Please try again.".to_string()
  }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSummary {
  pub total_parties: i64,
  pub total_suppliers: i64,
  pub total_vehicles: i64,
  pub total_weight: f64,
  pub outstanding_payments: f64,
  pub low_stock_items: i64,
}


#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VehicleRegisterInput {
  pub company_id: String,
  pub date: String,
  pub day_of_week: Option<String>,
  pub vehicle_number: String,
  pub driver_name: String,
  pub broker_name: Option<String>,
  pub arrival_time: Option<String>,
  pub vehicle_description: Option<String>,
  pub scale_weight: Option<f64>,
  pub fruit_type_category: Option<String>,
  pub status: String,
  pub pending_amount: f64,
  pub outstanding_balance: f64,
  pub notes: String,
  pub rows: Vec<VehicleRegisterRowInput>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VehicleRegisterRowInput {
  pub party_id: Option<String>,
  pub party_name: String,
  pub lot_no: Option<String>,
  pub vakkal: String,
  pub boxes: Option<f64>,
  pub carat: f64,
  pub weight: f64,
  pub rate: f64,
  pub commission: Option<f64>,
  pub hamali: Option<f64>,
  pub total: Option<f64>,
  pub remarks: String,
  pub inventory_item_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VehicleRegisterRow {
  pub id: String,
  pub vehicle_register_id: String,
  pub party_id: Option<String>,
  pub party_name: String,
  pub lot_no: Option<String>,
  pub vakkal: String,
  pub boxes: Option<f64>,
  pub carat: f64,
  pub weight: f64,
  pub rate: f64,
  pub commission: Option<f64>,
  pub hamali: Option<f64>,
  pub total: f64,
  pub remarks: String,
  pub inventory_item_id: Option<String>,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VehicleRegister {
  pub id: String,
  pub company_id: String,
  pub entry_no: String,
  pub date: String,
  pub day_of_week: Option<String>,
  pub vehicle_number: String,
  pub driver_name: String,
  pub broker_name: Option<String>,
  pub arrival_time: Option<String>,
  pub vehicle_description: Option<String>,
  pub scale_weight: Option<f64>,
  pub fruit_type_category: Option<String>,
  pub status: String,
  pub total_rows: i64,
  pub total_weight: f64,
  pub total_boxes: Option<f64>,
  pub total_carats: Option<f64>,
  pub grand_total: f64,
  pub pending_amount: f64,
  pub outstanding_balance: f64,
  pub notes: String,
  pub created_at: String,
  pub updated_at: String,
  pub rows: Vec<VehicleRegisterRow>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanyInput {
  pub name: String,
  pub address: String,
  pub city: String,
  pub state: String,
  pub phone: String,
  pub email: String,
  pub gstin: String,
  pub invoice_prefix: String,
  pub language: String,
  pub theme: String,
  pub financial_year_start: i32,
  pub financial_year_end: i32,
  pub owner_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Company {
  pub id: String,
  pub name: String,
  pub address: String,
  pub city: String,
  pub state: String,
  pub phone: String,
  pub email: String,
  pub gstin: String,
  pub invoice_prefix: String,
  pub language: String,
  pub theme: String,
  pub financial_year_start: i32,
  pub financial_year_end: i32,
  pub owner_id: String,
  pub is_active: bool,
  pub created_at: String,
  pub updated_at: String,
}

pub fn db_path() -> Result<PathBuf, String> {
  let base_dir = dirs::data_dir().ok_or_else(|| "unable to locate application data directory".to_string())?;
  let app_dir = base_dir.join("Fruit Market ERP");
  fs::create_dir_all(&app_dir).map_err(|error| error.to_string())?;
  Ok(app_dir.join("fruit-market-erp.sqlite"))
}

pub fn open_connection() -> Result<Connection, String> {
  let path = db_path()?;
  
  // Perform automatic backup before opening
  if path.exists() {
    if let Err(e) = backup_database(&path) {
      eprintln!("[Database] Non-critical backup failure: {}. Continuing to open database.", e);
    }
  }
  
  Connection::open(path).map_err(|error| error.to_string())
}

/// Backup database to a timestamped file in the backups folder
fn backup_database(db_path: &Path) -> Result<(), String> {
  let app_dir = db_path.parent().ok_or("Invalid DB path")?;
  let backup_dir = app_dir.join("backups");
  fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

  // Simple daily backup logic
  let now = Utc::now();
  let backup_name = format!("backup_{}.sqlite", now.format("%Y-%m-%d"));
  let backup_path = backup_dir.join(backup_name);

  // Only backup once a day
  if !backup_path.exists() {
    fs::copy(db_path, backup_path).map_err(|e| e.to_string())?;
    
    // Cleanup old backups (keep last 7)
    let mut backups: Vec<_> = fs::read_dir(&backup_dir)
      .map_err(|e| e.to_string())?
      .filter_map(|r| r.ok())
      .collect();
      
    backups.sort_by_key(|a| a.metadata().and_then(|m| m.modified()).ok());
    
    if backups.len() > 7 {
      for old_backup in backups.iter().take(backups.len() - 7) {
        let _ = fs::remove_file(old_backup.path());
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub fn reset_database_dev(token: String) -> Result<(), String> {
  authorize(&token)?;
  #[cfg(debug_assertions)]
  {
    let path = db_path()?;
    if path.exists() {
      fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
  }
  #[cfg(not(debug_assertions))]
  {
    Err("Database reset is only allowed in development mode".to_string())
  }
}

#[tauri::command]
pub fn init_database() -> Result<(), String> {
  let connection = open_connection()?;

  // Enable foreign keys
  connection.execute_batch("
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      company_ids TEXT NOT NULL DEFAULT '[]',
      default_company_id TEXT,
      password_hash TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      gstin TEXT NOT NULL,
      invoice_prefix TEXT NOT NULL,
      language TEXT NOT NULL,
      theme TEXT NOT NULL,
      financial_year_start INTEGER NOT NULL,
      financial_year_end INTEGER NOT NULL,
      owner_id TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
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
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_parties_company ON parties(company_id);
    CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_ledger_company_party_date ON ledger_entries(company_id, party_id, date);

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_company_name_grade_warehouse ON inventory_items(company_id, name, grade, warehouse);
    CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);

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
    CREATE INDEX IF NOT EXISTS idx_inventory_txn_item_date ON inventory_transactions(item_id, date);

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_bills_company ON bills(company_id);

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
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_purchases_company ON purchases(company_id);

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
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

    CREATE TABLE IF NOT EXISTS vehicle_registers (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      entry_no TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      day_of_week TEXT,
      vehicle_number TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      broker_name TEXT,
      arrival_time TEXT,
      vehicle_description TEXT,
      scale_weight REAL,
      fruit_type_category TEXT,
      status TEXT NOT NULL,
      total_rows INTEGER NOT NULL,
      total_weight REAL NOT NULL,
      total_boxes REAL,
      total_carats REAL,
      grand_total REAL NOT NULL,
      pending_amount REAL NOT NULL,
      outstanding_balance REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vehicle_register_company ON vehicle_registers(company_id);

    CREATE TABLE IF NOT EXISTS vehicle_register_rows (
      id TEXT PRIMARY KEY,
      vehicle_register_id TEXT NOT NULL REFERENCES vehicle_registers(id) ON DELETE CASCADE,
      party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
      party_name TEXT NOT NULL,
      lot_no TEXT,
      vakkal TEXT NOT NULL,
      boxes REAL,
      carat REAL NOT NULL,
      weight REAL NOT NULL,
      rate REAL NOT NULL,
      commission REAL,
      hamali REAL,
      total REAL NOT NULL,
      remarks TEXT NOT NULL DEFAULT '',
      inventory_item_id TEXT REFERENCES inventory_items(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vehicle_rows_register ON vehicle_register_rows(vehicle_register_id);
    CREATE INDEX IF NOT EXISTS idx_vehicle_rows_party ON vehicle_register_rows(party_id);
    CREATE INDEX IF NOT EXISTS idx_vehicle_rows_inventory ON vehicle_register_rows(inventory_item_id);
  ")
  .map_err(|error| error.to_string())?;

  seed_default_settings(&connection)?;
  Ok(())
}

#[tauri::command]
pub fn wipe_database(token: String) -> Result<(), String> {
  authorize(&token)?;
  #[cfg(debug_assertions)]
  {
    let connection = open_connection()?;

    connection.execute_batch("
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS vehicle_register_rows;
      DROP TABLE IF EXISTS vehicle_registers;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS purchase_items;
      DROP TABLE IF EXISTS purchases;
      DROP TABLE IF EXISTS bill_items;
      DROP TABLE IF EXISTS bills;
      DROP TABLE IF EXISTS inventory_transactions;
      DROP TABLE IF EXISTS inventory_items;
      DROP TABLE IF EXISTS ledger_entries;
      DROP TABLE IF EXISTS suppliers;
      DROP TABLE IF EXISTS parties;
      DROP TABLE IF EXISTS settings;
      DROP TABLE IF EXISTS companies;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS app_state_snapshots;
      PRAGMA foreign_keys = ON;
    ")
    .map_err(|error| error.to_string())?;

    init_database()
  }
  #[cfg(not(debug_assertions))]
  {
    Err("Database wipe is only allowed in development mode".to_string())
  }
}

fn seed_default_settings(connection: &Connection) -> Result<(), String> {
  let now = now_iso();
  connection
    .execute(
      "INSERT OR REPLACE INTO settings (id, business_name, business_address, city, state, phone, email, gstin, commission_percent, tax_percent, currency, bill_prefix, purchase_prefix, vehicle_prefix, next_bill_no, next_purchase_no, next_vehicle_entry_no, language, dark_mode, low_stock_alert, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)",
      params![
        "default",
        "Talha Fruit Co.",
        "near chamak factory",
        "Nadiad",
        "Gujarat",
        "",
        "",
        "",
        3.0_f64,
        5.0_f64,
        "₹",
        "FM",
        "PO",
        "VR",
        1001_i64,
        5001_i64,
        2001_i64,
        "english",
        false,
        true,
        now,
        now,
      ],
    )
    .map_err(|error| error.to_string())?;

  Ok(())
}

#[tauri::command]
pub fn get_dashboard_summary(token: String) -> Result<DashboardSummary, String> {
  authorize(&token)?;
  let connection = open_connection().map_err(map_db_error)?;
  Ok(DashboardSummary {
    total_parties: scalar_count(&connection, "SELECT COUNT(1) FROM parties").map_err(map_db_error)?,
    total_suppliers: scalar_count(&connection, "SELECT COUNT(1) FROM suppliers").map_err(map_db_error)?,
    total_vehicles: scalar_count(&connection, "SELECT COUNT(1) FROM vehicle_registers").map_err(map_db_error)?,
    total_weight: scalar_float(&connection, "SELECT COALESCE(SUM(total_weight), 0) FROM vehicle_registers").map_err(map_db_error)?,
    outstanding_payments: scalar_float(&connection, "SELECT COALESCE(SUM(outstanding_balance), 0) FROM vehicle_registers").map_err(map_db_error)?,
    low_stock_items: scalar_count(&connection, "SELECT COUNT(1) FROM inventory_items WHERE status IN ('low_stock', 'out_of_stock')").map_err(map_db_error)?,
  })
}

#[tauri::command]
pub fn get_vehicle_registers(token: String) -> Result<Vec<VehicleRegister>, String> {
  authorize(&token)?;
  let connection = open_connection()?;
  let mut statement = connection
    .prepare("SELECT id, company_id, entry_no, date, day_of_week, vehicle_number, driver_name, broker_name, arrival_time, vehicle_description, scale_weight, fruit_type_category, status, total_rows, total_weight, total_boxes, total_carats, grand_total, pending_amount, outstanding_balance, notes, created_at, updated_at FROM vehicle_registers ORDER BY date DESC")
    .map_err(|error| error.to_string())?;

  let registers = statement
    .query_map([], |row| {
      let id: String = row.get(0)?;
      
      // Load rows for each register
      let mut row_statement = connection.prepare("SELECT id, vehicle_register_id, party_id, party_name, lot_no, vakkal, boxes, carat, weight, rate, commission, hamali, total, remarks, inventory_item_id, created_at, updated_at FROM vehicle_register_rows WHERE vehicle_register_id = ?").map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
      let rows_iter = row_statement.query_map([&id], |r| {
        Ok(VehicleRegisterRow {
          id: r.get(0)?,
          vehicle_register_id: r.get(1)?,
          party_id: r.get(2)?,
          party_name: r.get(3)?,
          lot_no: r.get(4)?,
          vakkal: r.get(5)?,
          boxes: r.get(6)?,
          carat: r.get(7)?,
          weight: r.get(8)?,
          rate: r.get(9)?,
          commission: r.get(10)?,
          hamali: r.get(11)?,
          total: r.get(12)?,
          remarks: r.get(13)?,
          inventory_item_id: r.get(14)?,
          created_at: r.get(15)?,
          updated_at: r.get(16)?,
        })
      }).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

      let rows: Vec<VehicleRegisterRow> = rows_iter.filter_map(|r| r.ok()).collect();

      Ok(VehicleRegister {
        id,
        company_id: row.get(1)?,
        entry_no: row.get(2)?,
        date: row.get(3)?,
        day_of_week: row.get(4)?,
        vehicle_number: row.get(5)?,
        driver_name: row.get(6)?,
        broker_name: row.get(7)?,
        arrival_time: row.get(8)?,
        vehicle_description: row.get(9)?,
        scale_weight: row.get(10)?,
        fruit_type_category: row.get(11)?,
        status: row.get(12)?,
        total_rows: row.get(13)?,
        total_weight: row.get(14)?,
        total_boxes: row.get(15)?,
        total_carats: row.get(16)?,
        grand_total: row.get(17)?,
        pending_amount: row.get(18)?,
        outstanding_balance: row.get(19)?,
        notes: row.get(20)?,
        created_at: row.get(21)?,
        updated_at: row.get(22)?,
        rows,
      })
    })
    .map_err(|error| error.to_string())?
    .filter_map(|r| r.ok())
    .collect();

  Ok(registers)
}

#[tauri::command]
pub fn create_vehicle_register(token: String, input: VehicleRegisterInput) -> Result<String, String> {
  authorize(&token)?;
  let mut connection = open_connection()?;
  let transaction = connection.transaction().map_err(|error| error.to_string())?;

  let next_entry_no: i64 = transaction
    .query_row("SELECT next_vehicle_entry_no FROM settings LIMIT 1", [], |row| row.get(0))
    .map_err(|error| error.to_string())?;
  let entry_no = format!("VR-{}", next_entry_no);
  let register_id = uuid_like_id();
  let now = now_iso();

  let totals = input.rows.iter().fold((0.0_f64, 0.0_f64, 0.0_f64, 0.0_f64), |mut acc, row| {
    let row_total = row.total.unwrap_or(row.carat * row.weight * row.rate);
    acc.0 += row.weight;
    acc.1 += row_total;
    acc.2 += row.boxes.unwrap_or(0.0);
    acc.3 += row.carat;
    acc
  });

  transaction
    .execute(
      "INSERT INTO vehicle_registers (id, company_id, entry_no, date, day_of_week, vehicle_number, driver_name, broker_name, arrival_time, vehicle_description, scale_weight, fruit_type_category, status, total_rows, total_weight, total_boxes, total_carats, grand_total, pending_amount, outstanding_balance, notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?22)",
      params![
        register_id,
        input.company_id,
        entry_no,
        input.date,
        input.day_of_week,
        input.vehicle_number,
        input.driver_name,
        input.broker_name,
        input.arrival_time,
        input.vehicle_description,
        input.scale_weight,
        input.fruit_type_category,
        input.status,
        input.rows.len() as i64,
        totals.0,
        totals.2,
        totals.3,
        totals.1,
        input.pending_amount,
        input.outstanding_balance,
        input.notes,
        now,
      ],
    )
    .map_err(|error| error.to_string())?;

  for row in &input.rows {
    let row_id = uuid_like_id();
    let row_total = row.total.unwrap_or(row.carat * row.weight * row.rate);
    transaction
      .execute(
        "INSERT INTO vehicle_register_rows (id, vehicle_register_id, party_id, party_name, lot_no, vakkal, boxes, carat, weight, rate, commission, hamali, total, remarks, inventory_item_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?16)",
        params![
          row_id,
          register_id,
          row.party_id,
          row.party_name,
          row.lot_no,
          row.vakkal,
          row.boxes,
          row.carat,
          row.weight,
          row.rate,
          row.commission,
          row.hamali,
          row_total,
          row.remarks,
          row.inventory_item_id,
          now,
        ],
      )
      .map_err(|error| error.to_string())?;

    if let Some(party_id) = &row.party_id {
      transaction
        .execute(
          "INSERT INTO ledger_entries (id, company_id, party_id, party_name, date, type, amount, description, reference_type, reference_id, running_balance, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'debit', ?6, ?7, 'vehicle_register', ?8, 0, ?9, ?10)",
          params![
            uuid_like_id(),
            input.company_id,
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
pub fn get_companies(token: String) -> Result<Vec<Company>, String> {
  authorize(&token)?;
  let connection = open_connection()?;
  let mut statement = connection
    .prepare("SELECT id, name, address, city, state, phone, email, gstin, invoice_prefix, language, theme, financial_year_start, financial_year_end, owner_id, is_active, created_at, updated_at FROM companies")
    .map_err(|error| error.to_string())?;

  let companies = statement
    .query_map([], |row| {
      Ok(Company {
        id: row.get(0)?,
        name: row.get(1)?,
        address: row.get(2)?,
        city: row.get(3)?,
        state: row.get(4)?,
        phone: row.get(5)?,
        email: row.get(6)?,
        gstin: row.get(7)?,
        invoice_prefix: row.get(8)?,
        language: row.get(9)?,
        theme: row.get(10)?,
        financial_year_start: row.get(11)?,
        financial_year_end: row.get(12)?,
        owner_id: row.get(13)?,
        is_active: row.get::<_, i64>(14)? != 0,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
      })
    })
    .map_err(|error| error.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|error| error.to_string())?;

  Ok(companies)
}

#[tauri::command]
pub fn create_company(token: String, data: CompanyInput) -> Result<Company, String> {
  authorize(&token)?;
  let connection = open_connection()?;
  let id = uuid_like_id();
  let now = now_iso();

  connection
    .execute(
      "INSERT INTO companies (id, name, address, city, state, phone, email, gstin, invoice_prefix, language, theme, financial_year_start, financial_year_end, owner_id, is_active, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 1, ?15, ?15)",
      params![
        id,
        data.name,
        data.address,
        data.city,
        data.state,
        data.phone,
        data.email,
        data.gstin,
        data.invoice_prefix,
        data.language,
        data.theme,
        data.financial_year_start,
        data.financial_year_end,
        data.owner_id,
        now,
      ],
    )
    .map_err(|error| error.to_string())?;

  Ok(Company {
    id: id.clone(),
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    phone: data.phone,
    email: data.email,
    gstin: data.gstin,
    invoice_prefix: data.invoice_prefix,
    language: data.language,
    theme: data.theme,
    financial_year_start: data.financial_year_start,
    financial_year_end: data.financial_year_end,
    owner_id: data.owner_id,
    is_active: true,
    created_at: now.clone(),
    updated_at: now,
  })
}

#[tauri::command]
pub fn update_company(token: String, data: Company) -> Result<Company, String> {
  authorize(&token)?;
  let connection = open_connection()?;
  let now = now_iso();

  connection
    .execute(
      "UPDATE companies SET name = ?1, address = ?2, city = ?3, state = ?4, phone = ?5, email = ?6, gstin = ?7, invoice_prefix = ?8, language = ?9, theme = ?10, financial_year_start = ?11, financial_year_end = ?12, is_active = ?13, updated_at = ?14 WHERE id = ?15",
      params![
        data.name,
        data.address,
        data.city,
        data.state,
        data.phone,
        data.email,
        data.gstin,
        data.invoice_prefix,
        data.language,
        data.theme,
        data.financial_year_start,
        data.financial_year_end,
        if data.is_active { 1 } else { 0 },
        now,
        data.id,
      ],
    )
    .map_err(|error| error.to_string())?;

  let mut updated = data;
  updated.updated_at = now;
  Ok(updated)
}

#[tauri::command]
pub fn delete_company(id: String) -> Result<(), String> {
  let connection = open_connection()?;
  connection
    .execute("DELETE FROM companies WHERE id = ?", params![id])
    .map_err(|error| error.to_string())?;
  Ok(())
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
