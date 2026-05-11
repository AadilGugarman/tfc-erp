#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

fn main() {
  db::ensure_database().expect("failed to initialize the SQLite database");

  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      db::get_dashboard_summary,
      db::list_vehicle_registers,
      db::save_vehicle_register,
      db::init_database,
      db::load_app_state,
      db::save_app_state
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}