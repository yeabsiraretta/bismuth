use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize)]
pub struct JsonRpcRequest {
    #[serde(rename = "jsonrpc")]
    pub(super) _jsonrpc: String,
    pub(super) id: Option<Value>,
    pub(super) method: String,
    #[serde(default)]
    pub(super) params: Value,
}

#[derive(Serialize)]
pub(super) struct JsonRpcResponse {
    pub(super) jsonrpc: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(super) id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(super) result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(super) error: Option<JsonRpcError>,
}

#[derive(Serialize)]
pub(super) struct JsonRpcError {
    pub(super) code: i32,
    pub(super) message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(super) data: Option<Value>,
}

impl JsonRpcResponse {
    pub(super) fn ok(id: Option<Value>, result: Value) -> Self {
        Self {
            jsonrpc: "2.0",
            id,
            result: Some(result),
            error: None,
        }
    }

    pub(super) fn err(id: Option<Value>, code: i32, message: String) -> Self {
        Self {
            jsonrpc: "2.0",
            id,
            result: None,
            error: Some(JsonRpcError {
                code,
                message,
                data: None,
            }),
        }
    }
}

#[derive(Serialize)]
pub(super) struct McpCapabilities {
    pub(super) tools: McpToolCaps,
    pub(super) resources: McpResourceCaps,
}

#[derive(Serialize)]
pub(super) struct McpToolCaps {
    #[serde(rename = "listChanged")]
    pub(super) list_changed: bool,
}

#[derive(Serialize)]
pub(super) struct McpResourceCaps {
    pub(super) subscribe: bool,
    #[serde(rename = "listChanged")]
    pub(super) list_changed: bool,
}

#[derive(Serialize)]
pub(super) struct McpServerInfo {
    pub(super) name: &'static str,
    pub(super) version: &'static str,
}

#[derive(Serialize)]
pub(super) struct McpInitResult {
    #[serde(rename = "protocolVersion")]
    pub(super) protocol_version: &'static str,
    pub(super) capabilities: McpCapabilities,
    #[serde(rename = "serverInfo")]
    pub(super) server_info: McpServerInfo,
}

#[derive(Serialize)]
pub(super) struct McpTool {
    pub(super) name: String,
    pub(super) description: String,
    #[serde(rename = "inputSchema")]
    pub(super) input_schema: Value,
}

#[derive(Serialize)]
pub(super) struct McpResource {
    pub(super) uri: String,
    pub(super) name: String,
    pub(super) description: String,
    #[serde(rename = "mimeType")]
    pub(super) mime_type: String,
}

#[derive(Serialize)]
pub(super) struct McpResourceContent {
    pub(super) uri: String,
    #[serde(rename = "mimeType")]
    pub(super) mime_type: String,
    pub(super) text: String,
}

#[derive(Serialize)]
pub(super) struct McpToolResult {
    pub(super) content: Vec<McpTextContent>,
    #[serde(rename = "isError")]
    pub(super) is_error: bool,
}

#[derive(Serialize)]
pub(super) struct McpTextContent {
    #[serde(rename = "type")]
    pub(super) content_type: &'static str,
    pub(super) text: String,
}
