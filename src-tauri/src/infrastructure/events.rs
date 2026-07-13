use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::infrastructure::error::AppResult;

pub mod channels {
    pub const APP_READY: &str = "app:ready";
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventPayload<T: Serialize> {
    pub data: T,
    pub timestamp: u64,
}

impl<T: Serialize> EventPayload<T> {
    pub fn new(data: T) -> Self {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        Self { data, timestamp }
    }
}

pub fn emit_event<T: Serialize + Clone>(
    handle: &AppHandle,
    channel: &str,
    data: T,
) -> AppResult<()> {
    let payload = EventPayload::new(data);
    handle.emit(channel, payload)?;
    Ok(())
}
