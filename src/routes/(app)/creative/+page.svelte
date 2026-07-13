<script lang="ts">
  import './+page.css';
  import { CREATIVE_IDEAS_KEY } from '@/constants/storage-keys';
  import { pageTitle, SITE_URL } from '@/constants/seo';
  import { MetaTags } from 'svelte-meta-tags';

  interface IdeaCard {
    id: string;
    text: string;
    tags: string;
    ts: number;
  }

  const IDEA_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

  const WRITING_PROMPTS = [
    'A letter arrives from your future self, warning about...',
    'Two strangers share an umbrella in a downpour and discover...',
    'The last bookshop in the world has one customer left...',
    'An astronaut returns to Earth to find everyone gone, except...',
    "A child discovers a door in the garden that wasn't there before...",
    'Write about a color without naming it.',
    'The first human to live forever has one regret...',
    "A detective solves crimes by reading people's dreams...",
    "An AI becomes self-aware inside a children's toy...",
    'The ocean dries up overnight, revealing...',
    'A musician discovers their songs literally change the weather...',
    'Your protagonist wakes up speaking a language no one recognizes...',
  ];

  const BRAINSTORM_TECHNIQUES = [
    {
      name: 'SCAMPER',
      desc: 'Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse',
    },
    {
      name: 'Six Hats',
      desc: 'White (facts), Red (feelings), Black (risks), Yellow (benefits), Green (ideas), Blue (process)',
    },
    { name: '5 Whys', desc: 'Ask "why" five times to drill down to the root of a problem' },
    {
      name: 'Mind Map',
      desc: 'Start with a central idea and branch outward with related concepts',
    },
    {
      name: 'Reverse',
      desc: 'Instead of solving a problem, think about how to make it worse, then invert',
    },
    {
      name: 'Random Entry',
      desc: 'Pick a random word and connect it to your challenge for unexpected ideas',
    },
  ];

  const RANDOM_WORDS = [
    'mirror',
    'lighthouse',
    'whisper',
    'clockwork',
    'labyrinth',
    'ember',
    'crystal',
    'compass',
    'threshold',
    'aurora',
    'echo',
    'mosaic',
    'silhouette',
    'cascade',
    'prism',
    'artifact',
    'horizon',
    'chimera',
    'paradox',
    'catalyst',
    'fragment',
    'nexus',
    'zenith',
    'cipher',
    'oracle',
    'tempest',
    'reverie',
    'genesis',
  ];

  function loadIdeas(): IdeaCard[] {
    try {
      const raw = localStorage.getItem(CREATIVE_IDEAS_KEY);
      return raw ? (JSON.parse(raw) as IdeaCard[]) : [];
    } catch {
      return [];
    }
  }

  function saveIdeas() {
    localStorage.setItem(CREATIVE_IDEAS_KEY, JSON.stringify(ideas));
  }

  let ideas = $state<IdeaCard[]>(loadIdeas());
  let newIdea = $state('');
  let currentPrompt = $state(WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]);
  let randomWords = $state<string[]>(pickRandomWords(3));
  let activeTechnique = $state<number | null>(null);

  function pickRandomWords(n: number): string[] {
    const shuffled = [...RANDOM_WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  function shufflePrompt() {
    currentPrompt = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
  }

  function shuffleWords() {
    randomWords = pickRandomWords(3);
  }

  function addIdea() {
    const text = newIdea.trim();
    if (!text) return;
    ideas = [{ id: crypto.randomUUID(), text, tags: '', ts: Date.now() }, ...ideas];
    newIdea = '';
    saveIdeas();
  }

  function removeIdea(id: string) {
    ideas = ideas.filter((i) => i.id !== id);
    saveIdeas();
  }
</script>

<MetaTags
  title={pageTitle('Creative')}
  description="Creative tools and brainstorming workspace."
  canonical="{SITE_URL}/creative"
  openGraph={{
    url: `${SITE_URL}/creative`,
    title: pageTitle('Creative'),
    description: 'Creative tools and brainstorming workspace.',
  }}
/>

<div class="creative-page">
  <header class="creative-header">
    <h1 class="page-title">Creative Space</h1>
  </header>

  <div class="creative-grid">
    <section class="card prompt-card">
      <h2 class="card-title">Writing Prompt</h2>
      <p class="prompt-text">{currentPrompt}</p>
      <div class="prompt-actions">
        <button class="action-btn" onclick={shufflePrompt}>New Prompt</button>
        <button
          class="action-btn"
          onclick={() => {
            const slug = currentPrompt
              .slice(0, 40)
              .replace(/[^a-zA-Z0-9]+/g, '-')
              .toLowerCase();
            window.dispatchEvent(
              new CustomEvent('open-note', { detail: { path: `creative/${slug}.md` } })
            );
          }}>Start Writing</button
        >
      </div>
    </section>

    <section class="card words-card">
      <h2 class="card-title">Random Words</h2>
      <div class="word-pills">
        {#each randomWords as word (word)}
          <span class="word-pill">{word}</span>
        {/each}
      </div>
      <p class="word-hint">Connect these words to spark an idea</p>
      <button class="action-btn" onclick={shuffleWords}>Shuffle</button>
    </section>
  </div>

  <section class="techniques-section">
    <h2 class="section-title">Brainstorming Techniques</h2>
    <div class="techniques-grid">
      {#each BRAINSTORM_TECHNIQUES as tech, i (tech.name)}
        <button
          class="technique-card"
          class:expanded={activeTechnique === i}
          onclick={() => (activeTechnique = activeTechnique === i ? null : i)}
        >
          <span class="tech-name">{tech.name}</span>
          {#if activeTechnique === i}
            <p class="tech-desc">{tech.desc}</p>
          {/if}
        </button>
      {/each}
    </div>
  </section>

  <section class="ideas-section">
    <h2 class="section-title">Idea Board</h2>
    <div class="idea-input-row">
      <input
        class="idea-input"
        placeholder="Capture an idea..."
        bind:value={newIdea}
        onkeydown={(e) => e.key === 'Enter' && addIdea()}
      />
      <button class="action-btn" onclick={addIdea} disabled={!newIdea.trim()}>Add</button>
    </div>

    {#if ideas.length > 0}
      <div class="ideas-grid">
        {#each ideas as idea (idea.id)}
          <div
            class="idea-card"
            style="border-left: 4px solid {IDEA_COLORS[ideas.indexOf(idea) % IDEA_COLORS.length]}"
          >
            <p class="idea-text">{idea.text}</p>
            <button class="idea-remove" onclick={() => removeIdea(idea.id)} title="Remove">×</button
            >
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>No ideas captured yet — start brainstorming!</p>
      </div>
    {/if}
  </section>
</div>
