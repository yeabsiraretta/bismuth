import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

import { getNotes } from '@/hubs/core/stores/vault-store.svelte';

function wikilinkCompletions(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  const triggerIdx = textBefore.lastIndexOf('[[');
  if (triggerIdx === -1) return null;

  const afterTrigger = textBefore.slice(triggerIdx + 2);
  if (afterTrigger.includes(']]')) return null;

  const from = line.from + triggerIdx + 2;
  const query = afterTrigger.toLowerCase();

  const notes = getNotes();
  const options = notes
    .map((n) => {
      const title = n.path.split('/').pop()?.replace('.md', '') ?? n.title;
      return { label: title, detail: n.path, type: 'text' as const };
    })
    .filter((o) => !query || o.label.toLowerCase().includes(query));

  if (options.length === 0) return null;

  return {
    from,
    to: context.pos,
    options,
    filter: false,
  };
}

export { wikilinkCompletions };
