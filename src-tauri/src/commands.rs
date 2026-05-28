mod exercises;
mod progress;
mod sets;
mod workouts;

pub use exercises::*;
pub use progress::*;
pub use sets::*;
pub use workouts::*;

use rusqlite::Connection;

use crate::models::{err, Res, WorkoutSet};

pub(crate) fn get_sets_for_exercise(conn: &Connection, exercise_id: i64) -> Res<Vec<WorkoutSet>> {
    let mut stmt = conn
        .prepare(
            "SELECT id, exercise_id, set_number, reps, weight, notes
             FROM sets WHERE exercise_id = ?1 ORDER BY set_number",
        )
        .map_err(err)?;

    let sets = stmt
        .query_map([exercise_id], |row| {
            Ok(WorkoutSet {
                id: row.get(0)?,
                exercise_id: row.get(1)?,
                set_number: row.get(2)?,
                reps: row.get(3)?,
                weight: row.get(4)?,
                notes: row.get(5)?,
            })
        })
        .map_err(err)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(err)?;

    Ok(sets)
}
