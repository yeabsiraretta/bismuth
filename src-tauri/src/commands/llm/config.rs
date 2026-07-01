//! LLM per-vault configuration commands — reads and writes `.bismuth/config.json`.

use crate::config::constants::filesystem::VAULT_DIR_NAME;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VaultLlmConfig {
    pub agent_enabled: bool,
    pub rest_api_enabled: bool,
    pub rest_api_port: u16,
    pub agent_write_requires_approval: bool,
}

impl Default for VaultLlmConfig {
    fn default() -> Self {
        Self {
            agent_enabled: false,
            rest_api_enabled: false,
            rest_api_port: 47832,
            agent_write_requires_approval: true,
        }
    }
}

/// Reads `.bismuth/config.json` from the vault root. Returns defaults if absent.
#[tauri::command]
pub async fn read_vault_llm_config(vault_root: String) -> Result<Value, String> {
    let config_path = Path::new(&vault_root).join(VAULT_DIR_NAME).join("config.json");

    if !config_path.exists() {
        let default_config = VaultLlmConfig::default();
        return serde_json::to_value(&default_config)
            .map_err(|e| format!("Failed to serialize default config: {}", e));
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config.json: {}", e))?;

    serde_json::from_str::<Value>(&content)
        .map_err(|e| format!("Failed to parse config.json: {}", e))
}

/// Writes `.bismuth/config.json` to the vault root. Validates port range.
#[tauri::command]
pub async fn write_vault_llm_config(vault_root: String, config: Value) -> Result<(), String> {
    // Validate port if present
    if let Some(port) = config.get("restApiPort").and_then(|v| v.as_u64()) {
        if !(1024..=65535).contains(&port) {
            return Err(format!("restApiPort {} is out of valid range 1024-65535", port));
        }
    }

    let bismuth_dir = Path::new(&vault_root).join(VAULT_DIR_NAME);
    std::fs::create_dir_all(&bismuth_dir)
        .map_err(|e| format!("Failed to create .bismuth directory: {}", e))?;

    let config_path = bismuth_dir.join("config.json");
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config.json: {}", e))?;

    tracing::info!("Wrote vault LLM config");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    async fn read_config(vault_root: &str) -> Value {
        read_vault_llm_config(vault_root.to_string()).await.unwrap()
    }

    async fn write_config(vault_root: &str, config: Value) -> Result<(), String> {
        write_vault_llm_config(vault_root.to_string(), config).await
    }

    #[tokio::test]
    async fn test_returns_defaults_when_missing() {
        let dir = TempDir::new().unwrap();
        let vault_root = dir.path().to_str().unwrap().to_string();
        let config = read_config(&vault_root).await;
        assert_eq!(config["agentEnabled"], false);
        assert_eq!(config["restApiEnabled"], false);
        assert_eq!(config["restApiPort"], 47832);
        assert_eq!(config["agentWriteRequiresApproval"], true);
    }

    #[tokio::test]
    async fn test_write_then_read_round_trips() {
        let dir = TempDir::new().unwrap();
        let vault_root = dir.path().to_str().unwrap().to_string();
        let config = serde_json::json!({
            "agentEnabled": true,
            "restApiEnabled": true,
            "restApiPort": 8080,
            "agentWriteRequiresApproval": false
        });
        write_config(&vault_root, config.clone()).await.unwrap();
        let loaded = read_config(&vault_root).await;
        assert_eq!(loaded["agentEnabled"], true);
        assert_eq!(loaded["restApiPort"], 8080);
        assert_eq!(loaded["agentWriteRequiresApproval"], false);
    }

    #[tokio::test]
    async fn test_port_0_rejected() {
        let dir = TempDir::new().unwrap();
        let vault_root = dir.path().to_str().unwrap().to_string();
        let config = serde_json::json!({ "restApiPort": 0 });
        let result = write_config(&vault_root, config).await;
        assert!(result.is_err(), "Port 0 should be rejected");
    }

    #[tokio::test]
    async fn test_port_70000_rejected() {
        let dir = TempDir::new().unwrap();
        let vault_root = dir.path().to_str().unwrap().to_string();
        let config = serde_json::json!({ "restApiPort": 70000 });
        let result = write_config(&vault_root, config).await;
        assert!(result.is_err(), "Port 70000 should be rejected");
    }
}
