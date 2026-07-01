//! HTTP request routing for the local Bismuth server.
//!
//! Routes:
//! - `GET /health` — liveness probe
//! - `GET /search?q=<query>&limit=<N>` — BM25 full-text search
//! - `GET /interactions?limit=<N>&level=<LEVEL>` — recent interaction log
//!
//! Agent routes (require `Authorization: Bearer {token}`):
//! - `GET /notes/search?q=<query>` — vault search
//! - `GET /notes/<path>` — read note content
//! - `GET /vault/list` — list all note paths
//! - `PUT /notes/<path>` — propose update
//! - `POST /notes/<path>` — propose create
//! - `DELETE /notes/<path>` — propose deletion
//!
//! Route dispatch logic lives in `search_routes.rs`.
//! Handler implementations live in `search_handlers.rs` and `agent_handlers.rs`.

pub(super) use super::search_routes::handle_connection;

#[cfg(test)]
mod tests {
    use crate::services::search::search_handlers::{parse_search_params, urldecode};

    #[test]
    fn test_parse_search_params_basic() {
        let (query, limit) = parse_search_params("?q=hello+world&limit=10");
        assert_eq!(query, "hello world");
        assert_eq!(limit, 10);
    }

    #[test]
    fn test_parse_search_params_encoded() {
        let (query, _) = parse_search_params("?q=rust%20programming");
        assert_eq!(query, "rust programming");
    }

    #[test]
    fn test_parse_search_params_default_limit() {
        let (query, limit) = parse_search_params("?q=notes");
        assert_eq!(query, "notes");
        assert_eq!(limit, 20);
    }

    #[test]
    fn test_urldecode() {
        assert_eq!(urldecode("hello+world"), "hello world");
        assert_eq!(urldecode("a%20b%21c"), "a b!c");
        assert_eq!(urldecode("normal"), "normal");
    }

    #[test]
    fn test_urldecode_multibyte_utf8() {
        assert_eq!(urldecode("%E4%B8%AD"), "中");
    }

    #[test]
    fn test_urldecode_mixed_ascii_utf8() {
        assert_eq!(urldecode("hello%E4%B8%ADworld"), "hello中world");
        assert_eq!(urldecode("%E6%97%A5%E6%9C%AC%E8%AA%9E"), "日本語");
    }
}
