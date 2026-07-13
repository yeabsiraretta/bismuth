<script lang="ts">
  import { CREATIVE_IDEAS_KEY } from '@/constants/storage-keys';
  import { openNote } from '@/ui/panel-actions';
  import Panel from '@/ui/panel.svelte';
  import BIcon from '@/ui/b-icon.svelte';
  import { goto } from '$app/navigation';
  const PROMPTS = [
    'What if the opposite were true?',
    'Combine two unrelated concepts.',
    'What would a child say about this?',
    'Describe it in one sentence.',
    'What problem does this solve?',
    'How would this look in 10 years?',
    'Write a metaphor for your idea.',
    'What is the simplest version?',
  ];

  interface Idea {
    id: string;
    text: string;
    tags: string;
    ts: number;
  }

  let ideas = $state<Idea[]>(loadIdeas());
  let newText = $state('');
  let newTags = $state('');
  let prompt = $state(randomPrompt());

  function loadIdeas(): Idea[] {
    try {
      return JSON.parse(localStorage.getItem(CREATIVE_IDEAS_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
  function save() {
    localStorage.setItem(CREATIVE_IDEAS_KEY, JSON.stringify(ideas));
  }
  function randomPrompt() {
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  }

  function addIdea() {
    if (!newText.trim()) return;
    ideas = [
      { id: crypto.randomUUID(), text: newText.trim(), tags: newTags.trim(), ts: Date.now() },
      ...ideas,
    ];
    newText = '';
    newTags = '';
    save();
  }

  function removeIdea(id: string) {
    ideas = ideas.filter((i) => i.id !== id);
    save();
  }

  function openAsNote(idea: Idea) {
    const title = idea.text
      .slice(0, 40)
      .replace(/[^\w\s-]/g, '')
      .trim();
    const tags = idea.tags ? `\ntags: ${idea.tags}` : '';
    const content = `# ${idea.text}${tags}\n\n`;
    openNote(`ideas/${title}.md`, { content });
  }

  function shufflePrompt() {
    prompt = randomPrompt();
  }
</script>

<Panel title="Ideas">
  {#snippet actions()}
    <button class="panel-action" onclick={() => goto('/creative')} title="Open Creative">
      <BIcon name="externalLink" size={14} />
    </button>
  {/snippet}
  <div class="ideas-prompt">
    <span class="ideas-prompt-text">{prompt}</span>
    <button class="panel-action" onclick={shufflePrompt} title="New prompt">
      <BIcon name="refresh" size={14} />
    </button>
  </div>
  <div class="ideas-input">
    <input
      type="text"
      bind:value={newText}
      placeholder="Capture an idea…"
      class="ideas-field"
      onkeydown={(e) => {
        if (e.key === 'Enter') addIdea();
      }}
    />
    <input
      type="text"
      bind:value={newTags}
      placeholder="Tags (optional)"
      class="ideas-field ideas-tags"
    />
    <button class="ideas-add" onclick={addIdea} disabled={!newText.trim()}>Add</button>
  </div>
  {#if ideas.length === 0}
    <p class="panel-empty">No ideas yet. Start capturing!</p>
  {:else}
    <ul class="ideas-list">
      {#each ideas as idea (idea.id)}
        <li class="ideas-item">
          <div class="ideas-item-text">{idea.text}</div>
          {#if idea.tags}<div class="ideas-item-tags">{idea.tags}</div>{/if}
          <div class="ideas-item-actions">
            <button class="panel-action" onclick={() => openAsNote(idea)} title="Open as note">
              <BIcon name="fileText" size={12} />
            </button>
            <button class="panel-action" onclick={() => removeIdea(idea.id)} title="Delete">
              <BIcon name="trash" size={12} />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .ideas-prompt {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 4px;
    margin-bottom: 6px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
    font-size: 0.72rem;
  }
  .ideas-prompt-text {
    flex: 1;
    font-style: italic;
    color: var(--color-text-muted);
  }
  .ideas-input {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }
  .ideas-field {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.75rem;
    outline: none;
  }
  .ideas-field:focus {
    border-color: var(--color-accent);
  }
  .ideas-tags {
    font-size: 0.68rem;
  }
  .ideas-add {
    align-self: flex-end;
    padding: 3px 10px;
    border: none;
    background: var(--color-accent);
    color: var(--color-background);
    border-radius: var(--radius-s);
    font-size: 0.7rem;
    cursor: pointer;
  }
  .ideas-add:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ideas-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ideas-item {
    padding: 6px 8px;
    background: var(--color-surface);
    border-radius: var(--radius-s);
    position: relative;
  }
  .ideas-item-text {
    font-size: 0.75rem;
    color: var(--color-text);
  }
  .ideas-item-tags {
    font-size: 0.65rem;
    color: var(--color-text-subtle);
    margin-top: 2px;
  }
  .ideas-item-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .ideas-item:hover .ideas-item-actions {
    opacity: 1;
  }
</style>
