/**
 * LLM feature public API barrel.
 */

// ─── Types ─────────────────────────────────────────────────────────────────
export type {
  LlmProvider,
  VaultLlmConfig,
  AgentMessage,
  AgentProposedChange,
  LlmConfig,
  ToolDefinition,
  ToolCall,
  ToolResult,
  McpTransport,
  McpServerConfig,
  ConversationTab,
  InlineEditRequest,
  InlineEditResult,
  DiffHunk,
  MentionType,
  MentionRef,
  SlashCommand,
} from './types/llm';

export { BUILTIN_SLASH_COMMANDS } from './types/llm';

// ─── Agent Store ───────────────────────────────────────────────────────────
export {
  conversationHistory,
  pendingChanges,
  llmConfig,
  isLoading,
  addMessage,
  clearHistory,
  loadPendingChanges,
  addProposedChange,
  approveChange,
  rejectChange,
  setProvider,
  setModel,
  setOllamaUrl,
  setMaxTokens,
} from './stores/agentStore';

// ─── Conversation Store ────────────────────────────────────────────────────
export {
  conversationTabs,
  activeTabId,
  activeConversation,
  activeMessages,
  isPlanMode,
  initConversations,
  newConversation,
  switchConversation,
  closeConversation,
  renameConversation,
  forkConversation,
  addMessageToActive,
  updateLastAssistantMessage,
  clearActiveConversation,
  togglePlanMode,
  compactConversation,
} from './stores/conversationStore';

// ─── Services ──────────────────────────────────────────────────────────────
export { listOllamaModels, chatOllama, chatOllamaStream } from './services/ollama';
export { sendClaudeMessage, sendClaudeMessageStream } from './services/claude';
export { readVaultLlmConfig, writeVaultLlmConfig } from './services/llmConfig';
export { VAULT_TOOLS, executeVaultTool } from './services/vaultTools';
export { performInlineEdit, computeWordDiff } from './services/inlineEdit';
export {
  mcpServers,
  mcpTools,
  addMcpServer,
  removeMcpServer,
  connectMcpServer,
  disconnectMcpServer,
  connectAllMcpServers,
  executeMcpTool,
  loadMcpServers,
} from './services/mcpClient';

// ─── Components ────────────────────────────────────────────────────────────
export { default as AgentModelPicker } from './components/AgentModelPicker.svelte';
export { default as AgentPanel } from './components/AgentPanel.svelte';
export { default as AgentChangeReview } from './components/AgentChangeReview.svelte';
export { default as LlmVaultConfig } from './components/LlmVaultConfig.svelte';
export { default as LlmPanel } from './components/LlmPanel.svelte';
export { default as ChatTabBar } from './components/ChatTabBar.svelte';
export { default as InlineEditModal } from './components/InlineEditModal.svelte';
export { default as McpServerConfigPanel } from './components/McpServerConfig.svelte';
