//! Credential helpers for git operations.
//!
//! Uses SSH agent and OS-level credential stores. Never stores secrets in vault.

use git2::{Cred, CredentialType, RemoteCallbacks};

/// Build remote callbacks with credential resolution.
///
/// Tries in order:
/// 1. SSH agent (for SSH URLs)
/// 2. Default SSH key (~/.ssh/id_rsa, id_ed25519)
/// 3. User-pass from git credential helper
pub fn build_callbacks<'a>() -> RemoteCallbacks<'a> {
    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(|_url, username_from_url, allowed_types| {
        if allowed_types.contains(CredentialType::SSH_KEY) {
            // Try SSH agent first
            if let Ok(cred) = Cred::ssh_key_from_agent(username_from_url.unwrap_or("git")) {
                return Ok(cred);
            }
            // Fallback to default SSH key
            let home = dirs::home_dir().unwrap_or_default();
            let key_paths = ["id_ed25519", "id_rsa"];
            for key in &key_paths {
                let private = home.join(".ssh").join(key);
                if private.exists() {
                    if let Ok(cred) = Cred::ssh_key(
                        username_from_url.unwrap_or("git"),
                        None,
                        &private,
                        None,
                    ) {
                        return Ok(cred);
                    }
                }
            }
        }
        if allowed_types.contains(CredentialType::USER_PASS_PLAINTEXT) {
            return Cred::credential_helper(
                &git2::Config::open_default().unwrap_or_else(|_| git2::Config::new().unwrap()),
                _url,
                username_from_url,
            );
        }
        Cred::default()
    });
    callbacks
}
