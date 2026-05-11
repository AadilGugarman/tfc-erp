#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod backup;

fn main() {
  db::ensure_database().expect("failed to initialize the SQLite database");
  backup::get_backup_config().expect("failed to initialize backup configuration");

  tauri::Builder::default()
    .setup(|_app| {
      backup::start_backup_scheduler();
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      db::get_dashboard_summary,
      db::list_vehicle_registers,
      db::save_vehicle_register,
      db::init_database,
      db::load_app_state,
      db::save_app_state,
      backup::get_backup_config,
      backup::update_backup_config,
      backup::save_backup_client_state,
      backup::create_manual_backup,
      backup::create_startup_backup,
      backup::run_auto_backup_if_due,
      backup::list_backups,
      backup::validate_backup,
      backup::delete_backup,
      backup::open_backup_folder,
      backup::export_backup,
      backup::restore_backup,
      backup::restart_application
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}