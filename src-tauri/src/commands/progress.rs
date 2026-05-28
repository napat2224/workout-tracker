use crate::models::{err, Db, ExerciseHistoryEntry, Res};
use super::get_sets_for_exercise;

#[tauri::command]
pub fn get_exercise_history(state: Db, name: String) -> Res<Vec<ExerciseHistoryEntry>> {
    let conn = state.0.lock().map_err(err)?;

    let mut stmt = conn
        .prepare(
            "SELECT e.id, w.date, w.name
             FROM exercises e
             JOIN workouts w ON w.id = e.workout_id
             WHERE e.name = ?1 COLLATE NOCASE
             ORDER BY w.date DESC, e.id DESC",
        )
        .map_err(err)?;

    let exercise_rows = stmt
        .query_map([&name], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;

    let mut entries = Vec::new();
    for (ex_id, date, workout_name) in exercise_rows {
        let sets = get_sets_for_exercise(&conn, ex_id)?;
        let max_weight = sets.iter().filter_map(|s| s.weight).fold(None, |acc, w| {
            Some(acc.unwrap_or(f64::NEG_INFINITY).max(w))
        });
        let total_volume: f64 = sets
            .iter()
            .filter_map(|s| s.weight.zip(s.reps.map(|r| r as f64)))
            .map(|(w, r)| w * r)
            .sum();

        entries.push(ExerciseHistoryEntry { date, workout_name, sets, max_weight, total_volume });
    }

    Ok(entries)
}
