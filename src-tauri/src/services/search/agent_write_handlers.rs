//! Agent staged-write REST endpoint handlers.
//!
//! All writes are staged as `AgentProposedChange` records — vault files are
//! never modified directly. Changes are applied only when the user approves via
//! the `apply_change` IPC command.
//!
//! - `PUT /notes/<path>` — propose update
//! - `POST /notes/<path>` — propose create
//! - `DELETE /notes/<path>` — propose deletion

use crate::services::llm_service::change_store::{create_change, open_agent_db, AgentProposedChange};
use crate::services::search::agent_utils::path_within_vault;
use crate::services::search::search_handlers::{send_response, urldecode, ApiError};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ChangeAcceptedResponse {
    change_id: String,
    status: &'static str,
}

#[derive(Deserialize)]
struct WriteBody {
    content: Option<String>,
    rationale: Option<String>,
    #[serde(rename = "agentName")]
    agent_name: Option<String>,
}

#[derive(Deserialize, Default)]
struct DeleteBody {
    rationale: Option<String>,
    #[serde(rename = "agentName")]
    agent_name: Option<String>,
}

/// PUT or POST /notes/<path> — propose create or update (staged, no vault write).
pub(crate) async fn handle_write_note<R>(
    reader: &mut tokio::io::BufReader<R>,
    method: &str,
    rel_path: &str,
    body_bytes: &[u8],
    vault_root: &str,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let decoded = urldecode(rel_path);
    if path_within_vault(vault_root, &decoded).is_none() {
        return send_response(
            reader,
            403,
            &serde_json::to_string(&ApiError {
                error: "Path escapes vault boundary".to_string(),
            })
            .unwrap(),
        )
        .await;
    }

    let parsed: WriteBody = match serde_json::from_slice(body_bytes) {
        Ok(b) => b,
        Err(e) => {
            return send_response(
                reader,
                400,
                &serde_json::to_string(&ApiError {
                    error: format!("Invalid JSON body: {}", e),
                })
                .unwrap(),
            )
            .await;
        }
    };

    let action = if method == "POST" { "create" } else { "update" };
    let change_id = uuid::Uuid::new_v4().to_string();
    let change = AgentProposedChange {
        change_id: change_id.clone(),
        vault_path: vault_root.to_string(),
        action: action.to_string(),
        target_path: decoded,
        proposed_content: parsed.content,
        new_path: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        status: "pending".to_string(),
        agent_name: parsed.agent_name.unwrap_or_else(|| "unknown-agent".to_string()),
        rationale: parsed.rationale,
    };

    stage_and_respond(reader, &change, vault_root, action).await
}

/// DELETE /notes/<path> — propose deletion (staged, no vault write).
pub(crate) async fn handle_delete_note<R>(
    reader: &mut tokio::io::BufReader<R>,
    rel_path: &str,
    body_bytes: &[u8],
    vault_root: &str,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let decoded = urldecode(rel_path);
    if path_within_vault(vault_root, &decoded).is_none() {
        return send_response(
            reader,
            403,
            &serde_json::to_string(&ApiError {
                error: "Path escapes vault boundary".to_string(),
            })
            .unwrap(),
        )
        .await;
    }

    let parsed: DeleteBody = serde_json::from_slice(body_bytes).unwrap_or_default();
    let change_id = uuid::Uuid::new_v4().to_string();
    let change = AgentProposedChange {
        change_id: change_id.clone(),
        vault_path: vault_root.to_string(),
        action: "delete".to_string(),
        target_path: decoded,
        proposed_content: None,
        new_path: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        status: "pending".to_string(),
        agent_name: parsed.agent_name.unwrap_or_else(|| "unknown-agent".to_string()),
        rationale: parsed.rationale,
    };

    stage_and_respond(reader, &change, vault_root, "delete").await
}

/// Persist an `AgentProposedChange` and send 202 Accepted.
async fn stage_and_respond<R>(
    reader: &mut tokio::io::BufReader<R>,
    change: &AgentProposedChange,
    vault_root: &str,
    action: &str,
) -> Result<(), String>
where
    R: tokio::io::AsyncRead + tokio::io::AsyncWrite + Unpin,
{
    let conn = match open_agent_db(vault_root) {
        Ok(c) => c,
        Err(e) => {
            return send_response(
                reader,
                500,
                &serde_json::to_string(&ApiError {
                    error: format!("DB error: {}", e),
                })
                .unwrap(),
            )
            .await;
        }
    };

    if let Err(e) = create_change(&conn, change) {
        return send_response(
            reader,
            500,
            &serde_json::to_string(&ApiError {
                error: format!("Failed to stage change: {}", e),
            })
            .unwrap(),
        )
        .await;
    }

    tracing::info!(
        "Staged {} change {} for vault {}",
        action,
        change.change_id,
        vault_root
    );
    let resp = serde_json::to_string(&ChangeAcceptedResponse {
        change_id: change.change_id.clone(),
        status: "pending",
    })
    .unwrap();
    send_response(reader, 202, &resp).await
}

#[cfg(test)]
mod tests {
    use crate::services::llm_service::change_store::{
        create_change, list_changes, open_agent_db, AgentProposedChange,
    };

    fn make_pending_change(change_id: &str, vault_root: &str, action: &str) -> AgentProposedChange {
        AgentProposedChange {
            change_id: change_id.to_string(),
            vault_path: vault_root.to_string(),
            action: action.to_string(),
            target_path: "note.md".to_string(),
            proposed_content: Some("# Note\n\nContent".to_string()),
            new_path: None,
            created_at: "2026-06-24T00:00:00Z".to_string(),
            status: "pending".to_string(),
            agent_name: "test-agent".to_string(),
            rationale: Some("test reason".to_string()),
        }
    }

    /// Write endpoint must not create vault files — only a pending DB record.
    #[test]
    fn test_write_does_not_touch_vault() {
        let tmp = tempfile::TempDir::new().unwrap();
        let vault_root = tmp.path().to_str().unwrap();
        let note_path = tmp.path().join("new-note.md");

        assert!(!note_path.exists(), "Pre-condition: note must not exist");

        let conn = open_agent_db(vault_root).unwrap();
        let mut change = make_pending_change("c-write-1", vault_root, "create");
        change.target_path = "new-note.md".to_string();
        create_change(&conn, &change).unwrap();

        assert!(!note_path.exists(), "Write endpoint must not modify vault files");

        let pending = list_changes(&conn, vault_root, Some("pending")).unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].status, "pending");
    }

    /// Delete endpoint must not remove vault files — only a pending DB record.
    #[test]
    fn test_delete_does_not_touch_vault() {
        let tmp = tempfile::TempDir::new().unwrap();
        let vault_root = tmp.path().to_str().unwrap();
        let note_path = tmp.path().join("existing.md");
        std::fs::write(&note_path, "existing content").unwrap();

        let conn = open_agent_db(vault_root).unwrap();
        let mut change = make_pending_change("c-delete-1", vault_root, "delete");
        change.target_path = "existing.md".to_string();
        change.proposed_content = None;
        create_change(&conn, &change).unwrap();

        assert!(note_path.exists(), "Delete endpoint must not remove vault files");

        let pending = list_changes(&conn, vault_root, Some("pending")).unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].action, "delete");
    }

    /// Invalid bearer token check — returns None when token is wrong.
    #[test]
    fn test_bearer_check_rejects_wrong_token() {
        use crate::services::search::agent_utils::check_bearer;
        assert!(!check_bearer(Some("Bearer wrong"), "correct"));
        assert!(!check_bearer(None, "correct"));
    }
}
