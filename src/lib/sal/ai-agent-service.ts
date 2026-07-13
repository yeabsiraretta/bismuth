/**
 * AI Agent Service — bridges AI chat with Bismuth MCP tools.
 *
 * Enables terminal-style agentic interactions where the AI can:
 *   1. Invoke any Bismuth MCP tool (notes, canvas, git, versions, etc.)
 *   2. Parse tool call requests from LLM responses
 *   3. Execute tools and feed results back into the conversation
 *   4. Maintain a structured message log for the agent session
 *
 * Designed for speed: tool calls go directly through the local MCP endpoint
 * at http://127.0.0.1:21721/mcp — zero network hops.
 */

import { mcpCallTool, mcpListTools, type McpToolResult } from '@/ipc/api-client';
import { type ChatMessage, isConfigured, type StreamCallbacks, streamChat } from '@/sal/ai-service';
import { log } from '@/utils/log/logger';

const agentLog = log.child('ai-agent');

// ── Types ────────────────────────────────────────────────────────────────────

export interface ToolCallRequest {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCall?: ToolCallRequest;
  toolResult?: McpToolResult;
  timestamp: number;
}

interface AgentSession {
  messages: AgentMessage[];
  isRunning: boolean;
  toolsAvailable: string[];
}

// ── Tool call parsing ────────────────────────────────────────────────────────

const TOOL_CALL_REGEX = /<tool_call>\s*\{[\s\S]*?\}\s*<\/tool_call>/g;
const JSON_BLOCK_REGEX = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;

export function parseToolCalls(text: string): ToolCallRequest[] {
  const calls: ToolCallRequest[] = [];

  // Pattern 1: <tool_call>{"name": "...", "arguments": {...}}</tool_call>
  for (const match of text.matchAll(TOOL_CALL_REGEX)) {
    try {
      const jsonStr = match[0].replace(/<\/?tool_call>/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.name && typeof parsed.name === 'string') {
        calls.push({
          name: parsed.name,
          arguments: parsed.arguments ?? {},
        });
      }
    } catch {
      agentLog.debug('Failed to parse tool_call block');
    }
  }

  // Pattern 2: JSON code block with name+arguments fields
  if (calls.length === 0) {
    for (const match of text.matchAll(JSON_BLOCK_REGEX)) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.name && typeof parsed.name === 'string' && parsed.arguments) {
          calls.push({
            name: parsed.name,
            arguments: parsed.arguments,
          });
        }
      } catch {
        // Not a tool call JSON block
      }
    }
  }

  return calls;
}

export function stripToolCalls(text: string): string {
  return text
    .replace(TOOL_CALL_REGEX, '')
    .replace(JSON_BLOCK_REGEX, (match, json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.name && parsed.arguments) return '';
      } catch {
        /* not a tool call */
      }
      return match;
    })
    .trim();
}

// ── System prompt builder ────────────────────────────────────────────────────

export function buildAgentSystemPrompt(
  tools: Array<{ name: string; description: string }>
): string {
  const toolList = tools.map((t) => `- **${t.name}**: ${t.description}`).join('\n');

  return `You are the Bismuth AI Agent — a powerful assistant deeply integrated with the user's knowledge base.

You have access to the following tools via the Bismuth local API. To use a tool, output a tool call in this exact format:

<tool_call>
{"name": "tool_name", "arguments": {"param": "value"}}
</tool_call>

You may make multiple tool calls in a single response. After each tool call, the result will be provided to you, and you can continue reasoning.

## Available Tools

${toolList}

## Guidelines

- Use tools proactively to answer questions — search, read, and analyze vault content.
- For canvas operations, read the canvas JSON to understand structure before modifying.
- For git operations, check status before committing.
- When creating or modifying notes, preserve existing frontmatter.
- Be concise in responses. Show tool results only when the user would benefit from seeing them.
- If a tool call fails, explain the error and suggest alternatives.
- You can chain multiple tool calls in sequence to accomplish complex tasks.`;
}

// ── Agent execution engine ───────────────────────────────────────────────────

export async function loadAvailableTools(): Promise<Array<{ name: string; description: string }>> {
  try {
    return await mcpListTools();
  } catch (e) {
    agentLog.warn('Failed to load MCP tools, using empty list', { error: String(e) });
    return [];
  }
}

export async function executeToolCall(call: ToolCallRequest): Promise<McpToolResult> {
  agentLog.info('Executing tool call', { tool: call.name, args: call.arguments });
  try {
    const result = await mcpCallTool(call.name, call.arguments);
    agentLog.debug('Tool call result', { tool: call.name, isError: result.isError });
    return result;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    agentLog.error('Tool call failed', { tool: call.name, error: errorMsg });
    return {
      content: [{ type: 'text', text: `Error: ${errorMsg}` }],
      isError: true,
    };
  }
}

export function formatToolResult(result: McpToolResult): string {
  const text = result.content.map((c) => c.text).join('\n');
  if (result.isError) return `[Tool Error] ${text}`;
  // Truncate very large results to keep context manageable
  if (text.length > 8000) {
    return text.slice(0, 8000) + '\n\n... (truncated, ' + text.length + ' chars total)';
  }
  return text;
}

// ── Streaming agent loop ─────────────────────────────────────────────────────

export interface AgentCallbacks {
  onToken: (token: string) => void;
  onToolCall: (call: ToolCallRequest) => void;
  onToolResult: (call: ToolCallRequest, result: McpToolResult) => void;
  onDone: (fullResponse: string) => void;
  onError: (error: string) => void;
}

export async function runAgentTurn(
  history: AgentMessage[],
  tools: Array<{ name: string; description: string }>,
  callbacks: AgentCallbacks,
  maxToolRounds = 5
): Promise<void> {
  if (!isConfigured()) {
    callbacks.onError('AI not configured. Go to Settings → AI to enable.');
    return;
  }

  const systemPrompt = buildAgentSystemPrompt(tools);

  // Convert agent messages to chat messages
  const chatHistory: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of history) {
    if (msg.role === 'tool') {
      chatHistory.push({
        role: 'user',
        content: `[Tool Result for "${msg.toolCall?.name}"]\n${msg.content}`,
      });
    } else if (msg.role === 'system') {
      // Skip system messages (we already have our own)
    } else {
      chatHistory.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }
  }

  let fullResponse = '';
  let toolRound = 0;

  // Recursive streaming loop: stream LLM → detect tool calls → execute → feed back → repeat
  async function streamRound(): Promise<void> {
    return new Promise<void>((resolve) => {
      let roundText = '';

      const streamCallbacks: StreamCallbacks = {
        onToken: (token) => {
          roundText += token;
          fullResponse += token;
          callbacks.onToken(token);
        },
        onDone: async () => {
          const toolCalls = parseToolCalls(roundText);

          if (toolCalls.length > 0 && toolRound < maxToolRounds) {
            toolRound++;

            // Execute each tool call
            for (const call of toolCalls) {
              callbacks.onToolCall(call);
              const result = await executeToolCall(call);
              callbacks.onToolResult(call, result);

              // Add assistant message (with tool call) and tool result to history
              chatHistory.push({ role: 'assistant', content: roundText });
              chatHistory.push({
                role: 'user',
                content: `[Tool Result for "${call.name}"]\n${formatToolResult(result)}`,
              });
            }

            // Continue conversation with tool results
            fullResponse += '\n';
            callbacks.onToken('\n');
            await streamRound();
            resolve();
          } else {
            callbacks.onDone(fullResponse);
            resolve();
          }
        },
        onError: (error) => {
          callbacks.onError(error);
          resolve();
        },
      };

      streamChat(chatHistory, streamCallbacks);
    });
  }

  await streamRound();
}

// ── Terminal command parsing ─────────────────────────────────────────────────

export interface TerminalCommand {
  type: 'tool' | 'chat' | 'help' | 'tools' | 'clear';
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  text?: string;
}

export function parseTerminalInput(input: string): TerminalCommand {
  const trimmed = input.trim();

  if (trimmed === '/help' || trimmed === '?') return { type: 'help' };
  if (trimmed === '/tools' || trimmed === '/list') return { type: 'tools' };
  if (trimmed === '/clear') return { type: 'clear' };

  // Direct tool invocation: /tool_name {"arg": "val"}
  const toolMatch = trimmed.match(/^\/(\w+)\s*(.*)/s);
  if (toolMatch) {
    const name = toolMatch[1];
    let args: Record<string, unknown> = {};
    if (toolMatch[2]) {
      try {
        args = JSON.parse(toolMatch[2]);
      } catch {
        // Treat remaining text as a "query" or "path" argument
        args = { query: toolMatch[2].trim() };
      }
    }
    return { type: 'tool', toolName: name, toolArgs: args };
  }

  // Everything else is chat
  return { type: 'chat', text: trimmed };
}

export function getHelpText(): string {
  return `## Bismuth AI Agent — Commands

- Type naturally to chat with the AI agent (it has full vault access)
- **/tools** — list all available MCP tools
- **/tool_name {args}** — invoke a tool directly (e.g. \`/search_vault {"query": "react"}\`)
- **/clear** — clear the conversation
- **/help** — show this help

The agent can automatically call tools to answer your questions.
It has access to notes, canvas, git, versions, backups, and semantic search.`;
}
