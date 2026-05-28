use tauri::Manager;

mod commands;
mod db;
mod models;

use models::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("could not resolve app data dir");
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("workouts.db");
            let conn = db::init(&db_path).expect("failed to initialize database");
            app.manage(AppState(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_workouts,
            commands::create_workout,
            commands::get_workout_detail,
            commands::delete_workout,
            commands::add_exercise,
            commands::delete_exercise,
            commands::add_set,
            commands::update_set,
            commands::delete_set,
            commands::get_exercise_names,
            commands::get_exercise_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
