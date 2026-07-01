/**
 * MCP Client — manages connections to MCP servers and routes tool calls.
 *
 * Supports stdio, SSE, and HTTP transports. Server lifecycle (connect/disconnect)
 * is managed here. Tool definitions from connected servers are merged into the
 * global tool registry.
 *
 * MCP spec reference: https://modelcontextprotocol.io
 */

import { writable, get, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { McpServerConfig, ToolDefinition, ToolResult } from '../types/llm';

// ─── State ─────────────────────────────────────────────────────────────────

/** All configured MCP servers. */
export const mcpServers = writable<McpServerConfig[]>([]);

/** Tools from all connected MCP servers, merged. */
export const mcpTools = derived(mcpServers, ($servers) =>
  $servers
    .filter(s => s.status === 'connected' && s.tools)
    .flatMap(s => s.tools ?? []),
);

// ─── Server Lifecycle ──────────────────────────────────────────────────────

/** Add a new MCP server config. */
export function addMcpServer(config: Omit<McpServerConfig, 'id' | 'status'>): void {
  const id = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const server: McpServerConfig = { ...config, id, status: 'disconnected' };
  mcpServers.update(list => [...list, server]);
  log.info('MCP server added', { id, name: config.name, transport: config.transport });
}

/** Remove an MCP server by ID. Disconnects first if connected. */
export function removeMcpServer(id: string): void {
  disconnectMcpServer(id);
  mcpServers.update(list => list.filter(s => s.id !== id));
  log.info('MCP server removed', { id });
}

/** Update an MCP server config. */
export function updateMcpServer(id: string, partial: Partial<McpServerConfig>): void {
  mcpServers.update(list =>
    list.map(s => (s.id === id ? { ...s, ...partial } : s)),
  );
}

/**
 * Connect to an MCP server and discover its tools.
 *
 * For stdio: Uses Tauri shell to spawn the process and communicate via JSON-RPC.
 * For SSE/HTTP: Fetches the tools list endpoint.
 *
 * This is a simplified implementation — full MCP clients would use the SDK.
 */
export async function connectMcpServer(id: string): Promise<void> {
  const servers = get(mcpServers);
  const server = servers.find(s => s.id === id);
  if (!server) return;
  if (!server.enabled) return;

  updateMcpServer(id, { status: 'connecting', error: undefined });

  try {
    let tools: ToolDefinition[] = [];

    if (server.transport === 'sse' || server.transport === 'http') {
      tools = await fetchMcpTools(server);
    } else {
      // stdio: would spawn process via Tauri shell — for now, mark as connected with no tools
      log.info('MCP stdio server registered (tool execution requires Tauri shell)', { name: server.name });
      tools = [];
    }

    updateMcpServer(id, { status: 'connected', tools });
    log.info('MCP server connected', { id, name: server.name, toolCount: tools.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateMcpServer(id, { status: 'error', error: msg });
    log.error('MCP server connection failed', err as Error, { id, name: server.name });
  }
}

/** Disconnect from an MCP server. */
export function disconnectMcpServer(id: string): void {
  updateMcpServer(id, { status: 'disconnected', tools: undefined, error: undefined });
  log.info('MCP server disconnected', { id });
}

/** Connect all enabled MCP servers. */
export async function connectAllMcpServers(): Promise<void> {
  const servers = get(mcpServers);
  await Promise.allSettled(
    servers.filter(s => s.enabled).map(s => connectMcpServer(s.id)),
  );
}

/**
 * Execute a tool on a specific MCP server.
 * For SSE/HTTP, sends a POST to the server's tool execution endpoint.
 */
export async function executeMcpTool(
  serverId: string,
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const servers = get(mcpServers);
  const server = servers.find(s => s.id === serverId);

  if (!server || server.status !== 'connected') {
    return { toolCallId, toolName, output: `MCP server not connected: ${serverId}`, isError: true };
  }

  try {
    if (server.transport === 'sse' || server.transport === 'http') {
      return await callMcpToolHttp(server, toolCallId, toolName, args);
    }

    // stdio: would write JSON-RPC to process stdin
    return { toolCallId, toolName, output: 'stdio tool execution not yet implemented', isError: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { toolCallId, toolName, output: `MCP tool error: ${msg}`, isError: true };
  }
}

// ─── Transport Helpers ─────────────────────────────────────────────────────

/** Fetch tool definitions from an HTTP/SSE MCP server. */
async function fetchMcpTools(server: McpServerConfig): Promise<ToolDefinition[]> {
  const baseUrl = server.command.replace(/\/+$/, '');
  const resp = await fetch(`${baseUrl}/tools`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`MCP tools fetch failed: HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const rawTools = data.tools ?? data ?? [];

  return (rawTools as Array<Record<string, unknown>>).map((t) => ({
    name: String(t['name'] ?? ''),
    description: String(t['description'] ?? ''),
    inputSchema: (t['inputSchema'] ?? t['input_schema'] ?? {}) as Record<string, unknown>,
    source: server.name,
  }));
}

/** Call a tool on an HTTP/SSE MCP server via JSON-RPC. */
async function callMcpToolHttp(
  server: McpServerConfig,
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const baseUrl = server.command.replace(/\/+$/, '');
  const resp = await fetch(`${baseUrl}/call-tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: toolCallId,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });

  if (!resp.ok) {
    throw new Error(`MCP tool call failed: HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const content = data.result?.content ?? data.content ?? [];
  const text = Array.isArray(content)
    ? content.map((c: Record<string, unknown>) => String(c['text'] ?? '')).join('\n')
    : String(content);

  return { toolCallId, toolName, output: text, isError: !!data.error };
}

/** Load MCP server configs from vault config. */
export function loadMcpServers(configs: McpServerConfig[]): void {
  mcpServers.set(configs.map(c => ({ ...c, status: 'disconnected' as const })));
}
