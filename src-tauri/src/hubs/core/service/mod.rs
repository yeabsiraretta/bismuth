use crate::infrastructure::error::AppResult;
use crate::infrastructure::state::AppState;

use super::types::AppInfo;

pub(crate) struct CoreService;

impl CoreService {
    pub fn greet(_state: &AppState, name: &str) -> AppResult<String> {
        Ok(format!("Hello, {name}! Welcome to Bismuth."))
    }

    pub fn app_info(_state: &AppState) -> AppResult<AppInfo> {
        Ok(AppInfo {
            name: env!("CARGO_PKG_NAME").to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_state() -> AppState {
        AppState::default()
    }

    #[test]
    fn greet_returns_formatted_message() {
        let state = test_state();
        let result = CoreService::greet(&state, "Alice").unwrap();
        assert_eq!(result, "Hello, Alice! Welcome to Bismuth.");
    }

    #[test]
    fn greet_includes_name_in_output() {
        let state = test_state();
        let result = CoreService::greet(&state, "世界").unwrap();
        assert!(result.contains("世界"));
    }

    #[test]
    fn greet_handles_empty_name() {
        let state = test_state();
        let result = CoreService::greet(&state, "").unwrap();
        assert_eq!(result, "Hello, ! Welcome to Bismuth.");
    }

    #[test]
    fn app_info_returns_package_metadata() {
        let state = test_state();
        let info = CoreService::app_info(&state).unwrap();
        assert_eq!(info.name, env!("CARGO_PKG_NAME"));
        assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
    }
}
