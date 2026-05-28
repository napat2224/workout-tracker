use crate::models::{err, Db, Exercise, Res, Workout, WorkoutDetail};
use super::get_sets_for_exercise;

#[tauri::command]
pub fn get_workouts(state: Db) -> Res<Vec<Workout>> {
    let conn = state.0.lock().map_err(err)?;
    let mut stmt = conn
        .prepare(
            "SELECT w.id, w.name, w.date, w.notes,
                    COUNT(e.id) AS exercise_count
             FROM workouts w
             LEFT JOIN exercises e ON e.workout_id = w.id
             GROUP BY w.id
             ORDER BY w.date DESC, w.id DESC",
        )
        .map_err(err)?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Workout {
                id: row.get(0)?,
                name: row.get(1)?,
                date: row.get(2)?,
                notes: row.get(3)?,
                exercise_count: row.get(4)?,
            })
        })
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;

    Ok(rows)
}

#[tauri::command]
pub fn create_workout(state: Db, name: String, date: String, notes: String) -> Res<Workout> {
    let conn = state.0.lock().map_err(err)?;
    conn.execute(
        "INSERT INTO workouts (name, date, notes) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, date, notes],
    )
    .map_err(err)?;

    let id = conn.last_insert_rowid();
    Ok(Workout { id, name, date, notes, exercise_count: 0 })
}

#[tauri::command]
pub fn get_workout_detail(state: Db, id: i64) -> Res<WorkoutDetail> {
    let conn = state.0.lock().map_err(err)?;

    let (name, date, notes): (String, String, String) = conn
        .query_row(
            "SELECT name, date, notes FROM workouts WHERE id = ?1",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(err)?;

    let mut ex_stmt = conn
        .prepare("SELECT id, name FROM exercises WHERE workout_id = ?1 ORDER BY id")
        .map_err(err)?;

    let exercise_rows = ex_stmt
        .query_map([id], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;

    let mut exercises = Vec::new();
    for (ex_id, ex_name) in exercise_rows {
        let sets = get_sets_for_exercise(&conn, ex_id)?;
        exercises.push(Exercise { id: ex_id, workout_id: id, name: ex_name, sets });
    }

    Ok(WorkoutDetail { id, name, date, notes, exercises })
}

#[tauri::command]
pub fn delete_workout(state: Db, id: i64) -> Res<()> {
    let conn = state.0.lock().map_err(err)?;
    conn.execute("DELETE FROM workouts WHERE id = ?1", [id]).map_err(err)?;
    Ok(())
}
