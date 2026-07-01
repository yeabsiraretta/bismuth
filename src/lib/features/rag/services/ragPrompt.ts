/**
 * RAG Prompt Builder — constructs system + user prompts
 * with retrieved context and citation instructions.
 */

import type { RagContext, RagConfig } from '../types';
import type { AgentMessage } from '@/features/llm';

const RAG_SYSTEM_PROMPT = `You are a knowledgeable assistant with access to the user's personal knowledge base. Answer questions using the provided context from their notes.

IMPORTANT RULES:
1. Base your answers primarily on the provided context.
2. When you use information from a specific source, cite it using [N] notation matching the source numbers.
3. If the context doesn't contain enough information to answer, say so clearly.
4. Synthesize information across multiple sources when relevant — find connections.
5. Keep answers clear and well-structured.
6. If the user asks about relationships between concepts, trace the connections through the sources.`;

/**
 * Build the system prompt with retrieved context injected.
 */
export function buildRagSystemPrompt(context: RagContext, _config: RagConfig): string {
  if (context.citations.length === 0) {
    return `${RAG_SYSTEM_PROMPT}\n\nNo relevant context was found in the vault for this query. Answer based on your general knowledge, but note that no vault sources are available.`;
  }

  return `${RAG_SYSTEM_PROMPT}\n\n--- CONTEXT FROM VAULT ---\n${context.contextText}\n--- END CONTEXT ---\n\nYou have ${context.citations.length} source(s) available. Cite them as [1], [2], etc.`;
}

/**
 * Build the full message array for an LLM call with RAG context.
 */
export function buildRagMessages(
  query: string,
  context: RagContext,
  config: RagConfig,
  history: AgentMessage[] = [],
): AgentMessage[] {
  const systemMsg: AgentMessage = {
    id: 'rag-system',
    role: 'system',
    content: buildRagSystemPrompt(context, config),
    createdAt: new Date().toISOString(),
  };

  const historyMsgs = history
    .filter(m => m.role !== 'system')
    .slice(-10);

  const userMsg: AgentMessage = {
    id: `rag-user-${Date.now()}`,
    role: 'user',
    content: query,
    createdAt: new Date().toISOString(),
  };

  return [systemMsg, ...historyMsgs, userMsg];
}

/**
 * Format citation references as a readable footer block.
 */
export function formatCitationFooter(context: RagContext): string {
  if (context.citations.length === 0) return '';

  const lines = context.citations.map(c =>
    `[${c.index}] **${c.noteTitle}** (${c.notePath}) — ${c.source} search, score: ${c.score.toFixed(2)}`
  );

  return '\n\n---\n**Sources:**\n' + lines.join('\n');
}
