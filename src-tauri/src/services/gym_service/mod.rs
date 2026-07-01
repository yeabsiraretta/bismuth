//! Gym service — SQLite database for workout and nutrition tracking.
//!
//! Data stored in a separate `.bismuth/db/gym.db` file, isolated from the main vault database.
//!
//! Module layout:
//! - `migration` — DB initialization, schema migration, exercise seed data
//! - `queries` — Session, set, exercise, and chart queries
//! - `nutrition_queries` — Nutrition log and workout template queries

pub mod migration;
pub mod nutrition_queries;
pub mod queries;

#[cfg(test)]
mod queries_tests;
