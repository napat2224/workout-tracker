use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

pub struct AppState(pub Mutex<Connection>);

pub type Db<'a> = State<'a, AppState>;
pub type Res<T> = Result<T, String>;

pub fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Workout {
    pub id: i64,
    pub name: String,
    pub date: String,
    pub notes: String,
    pub exercise_count: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Exercise {
    pub id: i64,
    pub workout_id: i64,
    pub name: String,
    pub sets: Vec<WorkoutSet>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WorkoutSet {
    pub id: i64,
    pub exercise_id: i64,
    pub set_number: i32,
    pub reps: Option<i32>,
    pub weight: Option<f64>,
    pub notes: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WorkoutDetail {
    pub id: i64,
    pub name: String,
    pub date: String,
    pub notes: String,
    pub exercises: Vec<Exercise>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ExerciseHistoryEntry {
    pub date: String,
    pub workout_name: String,
    pub sets: Vec<WorkoutSet>,
    pub max_weight: Option<f64>,
    pub total_volume: f64,
}
