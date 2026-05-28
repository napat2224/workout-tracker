use crate::models::{err, Db, Res, WorkoutSet};

#[tauri::command]
pub fn add_set(
    state: Db,
    exercise_id: i64,
    reps: Option<i32>,
    weight: Option<f64>,
    notes: String,
) -> Res<WorkoutSet> {
    let conn = state.0.lock().map_err(err)?;

    let set_number: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(set_number), 0) + 1 FROM sets WHERE exercise_id = ?1",
            [exercise_id],
            |row| row.get(0),
        )
        .map_err(err)?;

    conn.execute(
        "INSERT INTO sets (exercise_id, set_number, reps, weight, notes) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![exercise_id, set_number, reps, weight, notes],
    )
    .map_err(err)?;

    let id = conn.last_insert_rowid();
    Ok(WorkoutSet { id, exercise_id, set_number, reps, weight, notes })
}

#[tauri::command]
pub fn update_set(
    state: Db,
    id: i64,
    reps: Option<i32>,
    weight: Option<f64>,
    notes: String,
) -> Res<WorkoutSet> {
    let conn = state.0.lock().map_err(err)?;
    conn.execute(
        "UPDATE sets SET reps = ?2, weight = ?3, notes = ?4 WHERE id = ?1",
        rusqlite::params![id, reps, weight, notes],
    )
    .map_err(err)?;

    let (exercise_id, set_number): (i64, i32) = conn
        .query_row(
            "SELECT exercise_id, set_number FROM sets WHERE id = ?1",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(err)?;

    Ok(WorkoutSet { id, exercise_id, set_number, reps, weight, notes })
}

#[tauri::command]
pub fn delete_set(state: Db, id: i64) -> Res<()> {
    let conn = state.0.lock().map_err(err)?;
    conn.execute("DELETE FROM sets WHERE id = ?1", [id]).map_err(err)?;
    Ok(())
}
