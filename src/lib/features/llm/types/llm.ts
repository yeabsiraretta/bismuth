/**
 * LLM feature type definitions.
 * Interfaces and union literals only — no runtime code.
 */

export type LlmProvider = 'ollama' | 'claude' | 'openai';

export interface VaultLlmConfig {
  agentEnabled: boolean;
  restApiEnabled: boolean;
  restApiPort: number;
  agentWriteRequiresApproval: boolean;
  /** MCP server configurations for this vault. */
  mcpServers: McpServerConfig[];
  /** Custom system prompt prepended to all conversations. */
  systemPrompt: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: string;
  /** Tool call info when role === 'assistant' and the model invoked a tool. */
  toolCalls?: ToolCall[];
  /** Tool result when role === 'tool'. */
  toolResult?: ToolResult;
  /** @mentions resolved from user input. */
  mentions?: MentionRef[];
  /** Whether this is a plan-mode message (explore-only, no writes). */
  isPlan?: boolean;
}

export interface AgentProposedChange {
  changeId: string;
  action: 'create' | 'update' | 'delete' | 'rename';
  targetPath: string;
  proposedContent: string | null;
  newPath?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  agentName: string;
  rationale?: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  /** Base URL for the Ollama REST API (default: http://127.0.0.1:11434). */
  ollamaUrl: string;
  /** Maximum tokens for API responses (default: 4096). */
  maxTokens: number;
  /** Temperature (0-2, default 0.7). */
  temperature: number;
  /** OpenAI-compatible API base URL. */
  openaiBaseUrl: string;
}

// ─── Tool Calling ──────────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool parameters. */
  inputSchema: Record<string, unknown>;
  /** Which provider registered this tool ('vault' for built-in, MCP server name otherwise). */
  source: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  output: string;
  isError: boolean;
}

// ─── MCP (Model Context Protocol) ──────────────────────────────────────────

export type McpTransport = 'stdio' | 'sse' | 'http';

export interface McpServerConfig {
  /** Unique identifier for this server. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Transport type. */
  transport: McpTransport;
  /** For stdio: command to spawn. For sse/http: URL. */
  command: string;
  /** Command-line arguments (stdio only). */
  args: string[];
  /** Environment variables passed to the subprocess. */
  env: Record<string, string>;
  /** Whether this server is enabled. */
  enabled: boolean;
  /** Tools exposed by this server (populated after connection). */
  tools?: ToolDefinition[];
  /** Connection status. */
  status?: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Error message if status === 'error'. */
  error?: string;
}

// ─── Multi-Tab Conversations ───────────────────────────────────────────────

export interface ConversationTab {
  id: string;
  title: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
  /** Whether plan mode is active for this tab. */
  planMode: boolean;
  /** Forked from another tab's ID. */
  forkedFrom?: string;
}

// ─── Inline Edit ───────────────────────────────────────────────────────────

export interface InlineEditRequest {
  /** Note path being edited. */
  notePath: string;
  /** Selected text (or empty for cursor-position insert). */
  selectedText: string;
  /** User instruction for the edit. */
  instruction: string;
  /** Full note content for context. */
  fullContent: string;
  /** Selection start offset in the document. */
  selectionStart: number;
  /** Selection end offset. */
  selectionEnd: number;
}

export interface InlineEditResult {
  /** The replacement text proposed by the agent. */
  replacement: string;
  /** Word-level diff hunks for preview. */
  diffHunks: DiffHunk[];
}

export interface DiffHunk {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

// ─── @Mentions & Slash Commands ────────────────────────────────────────────

export type MentionType = 'file' | 'folder' | 'mcp-server' | 'url';

export interface MentionRef {
  type: MentionType;
  value: string;
  /** Display label shown in the chat. */
  label: string;
}

export interface SlashCommand {
  /** Command trigger (e.g. '/summarize'). */
  trigger: string;
  /** Human-readable name. */
  label: string;
  /** Description shown in autocomplete. */
  description: string;
  /** Prompt template with {{selection}} / {{note}} placeholders. */
  promptTemplate: string;
  /** Scope: 'builtin' | 'vault' | 'user'. */
  scope: 'builtin' | 'vault' | 'user';
}

/** Built-in slash commands shipped with Bismuth. */
export const BUILTIN_SLASH_COMMANDS: SlashCommand[] = [
  {
    trigger: '/summarize',
    label: 'Summarize',
    description: 'Summarize the current note or selection',
    promptTemplate: 'Please summarize the following text concisely:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/explain',
    label: 'Explain',
    description: 'Explain the selected text',
    promptTemplate: 'Please explain the following text in simple terms:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/fix',
    label: 'Fix Writing',
    description: 'Fix grammar, spelling, and style',
    promptTemplate: 'Fix grammar, spelling, and improve the writing style of the following text. Return only the corrected text:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/translate',
    label: 'Translate',
    description: 'Translate text to another language',
    promptTemplate: 'Translate the following text to English. If it is already in English, translate to the language specified by the user:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/outline',
    label: 'Generate Outline',
    description: 'Create an outline from notes or topic',
    promptTemplate: 'Create a detailed outline for the following topic or notes:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/flashcards',
    label: 'Generate Flashcards',
    description: 'Create flashcards from content',
    promptTemplate: 'Generate study flashcards in Q: / A: format from the following content:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/tags',
    label: 'Suggest Tags',
    description: 'Suggest relevant tags for a note',
    promptTemplate: 'Suggest 3-5 relevant tags (as #tag format) for the following note content:\n\n{{selection}}',
    scope: 'builtin',
  },
  {
    trigger: '/links',
    label: 'Suggest Links',
    description: 'Suggest wikilinks to other notes',
    promptTemplate: 'Based on the following content, suggest potential [[wikilinks]] to related concepts that could be separate notes:\n\n{{selection}}',
    scope: 'builtin',
  },
];
