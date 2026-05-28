use rusqlite::{Connection, Result};
use std::path::Path;

pub fn init(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA foreign_keys=ON;

         CREATE TABLE IF NOT EXISTS workouts (
             id    INTEGER PRIMARY KEY AUTOINCREMENT,
             name  TEXT NOT NULL,
             date  TEXT NOT NULL,
             notes TEXT NOT NULL DEFAULT ''
         );

         CREATE TABLE IF NOT EXISTS exercises (
             id         INTEGER PRIMARY KEY AUTOINCREMENT,
             workout_id INTEGER NOT NULL,
             name       TEXT NOT NULL,
             FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
         );

         CREATE TABLE IF NOT EXISTS sets (
             id          INTEGER PRIMARY KEY AUTOINCREMENT,
             exercise_id INTEGER NOT NULL,
             set_number  INTEGER NOT NULL,
             reps        INTEGER,
             weight      REAL,
             notes       TEXT NOT NULL DEFAULT '',
             FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
         );",
    )?;

    Ok(conn)
}
