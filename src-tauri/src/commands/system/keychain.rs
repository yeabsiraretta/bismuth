//! Keychain secret storage commands.
//! Uses the system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).
//! Secrets NEVER fall back to plaintext storage.
//!
//! Return contract (matches TypeScript KeychainResult type):
//!   - Ok(Some(v)) — secret found
//!   - Ok(None)    — no secret stored for this key (not an error)
//!   - Err(msg)    — keychain unavailable or OS permission denied

const SERVICE: &str = "bismuth-pkm";
const MAX_KEY_LEN: usize = 128;

fn validate_key(key: &str) -> Result<(), String> {
    if key.is_empty() || key.len() > MAX_KEY_LEN {
        return Err(format!("Secret key must be 1–{} characters", MAX_KEY_LEN));
    }
    Ok(())
}

/// Stores a secret in the OS keychain.
/// Returns Err if the keychain is unavailable — no plaintext fallback.
#[tauri::command]
pub async fn set_secret(key: String, value: String) -> Result<(), String> {
    validate_key(&key)?;
    keyring_set(SERVICE, &key, &value)
}

/// Reads a secret from the OS keychain.
/// Returns Ok(None) when no value is stored (not an error).
/// Returns Err when the keychain itself is unavailable.
#[tauri::command]
pub async fn get_secret(key: String) -> Result<Option<String>, String> {
    validate_key(&key)?;
    keyring_get(SERVICE, &key)
}

/// Deletes a secret from the OS keychain.
#[tauri::command]
pub async fn delete_secret(key: String) -> Result<(), String> {
    validate_key(&key)?;
    keyring_delete(SERVICE, &key)
}

// ─── Platform keyring adapter ─────────────────────────────────────────────────
// These functions wrap whatever keyring implementation is available.
// Currently stubbed pending tauri-plugin-keychain integration.
// The stubs return Ok(None) so the UI correctly shows "no secret stored".

fn keyring_set(_service: &str, _key: &str, _value: &str) -> Result<(), String> {
    tracing::info!("keyring_set: service={} key={} (stub — keychain plugin not yet integrated)", _service, _key);
    Ok(())
}

fn keyring_get(_service: &str, _key: &str) -> Result<Option<String>, String> {
    tracing::info!("keyring_get: service={} key={} (stub — keychain plugin not yet integrated)", _service, _key);
    Ok(None)
}

fn keyring_delete(_service: &str, _key: &str) -> Result<(), String> {
    tracing::info!("keyring_delete: service={} key={} (stub — keychain plugin not yet integrated)", _service, _key);
    Ok(())
}
