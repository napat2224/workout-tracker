use crate::models::{err, Db, Exercise, Res};

#[tauri::command]
pub fn add_exercise(state: Db, workout_id: i64, name: String) -> Res<Exercise> {
    let conn = state.0.lock().map_err(err)?;
    conn.execute(
        "INSERT INTO exercises (workout_id, name) VALUES (?1, ?2)",
        rusqlite::params![workout_id, name],
    )
    .map_err(err)?;

    let id = conn.last_insert_rowid();
    Ok(Exercise { id, workout_id, name, sets: vec![] })
}

#[tauri::command]
pub fn delete_exercise(state: Db, id: i64) -> Res<()> {
    let conn = state.0.lock().map_err(err)?;
    conn.execute("DELETE FROM exercises WHERE id = ?1", [id]).map_err(err)?;
    Ok(())
}

#[tauri::command]
pub fn get_exercise_names(state: Db) -> Res<Vec<String>> {
    let conn = state.0.lock().map_err(err)?;
    let mut stmt = conn
        .prepare("SELECT DISTINCT name FROM exercises ORDER BY name COLLATE NOCASE")
        .map_err(err)?;

    let names = stmt
        .query_map([], |row| row.get(0))
        .map_err(err)?
        .collect::<Result<Vec<String>, _>>()
        .map_err(err)?;

    Ok(names)
}
