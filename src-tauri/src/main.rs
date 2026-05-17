#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod auth;
mod db;
mod backup;

fn main() {
  db::init_database().expect("failed to initialize the SQLite database");
  backup::get_backup_config_internal().expect("failed to initialize backup configuration");

  tauri::Builder::default()
    .setup(|_app| {
      backup::start_backup_scheduler();
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // Auth commands
      auth::login,
      auth::has_users,
      auth::setup_initial_admin,
      auth::refresh_access_token,
      auth::verify_access_token,
      auth::get_user,
      auth::list_users,
      auth::create_user,
      auth::update_user,
      auth::update_user_companies,
      auth::change_password,
      // Database commands
      db::reset_database_dev,
      db::wipe_database,
      db::get_companies,
      db::get_vehicle_registers,
      db::create_vehicle_register,
      db::get_dashboard_summary,
      db::create_company,
      db::update_company,
      db::delete_company,
      // Backup commands
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