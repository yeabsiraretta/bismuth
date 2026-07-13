<script lang="ts">
  import './+page.css';
  import BIcon from '@/ui/b-icon.svelte';
  import { setActiveHub } from '@/hubs/core/stores/layout-store.svelte';
  import { pageTitle, SITE_DESCRIPTION, SITE_URL } from '@/constants/seo';
  import {
    getVault,
    getNotes,
    getRecentFiles,
    rescanVault,
  } from '@/hubs/core/stores/vault-store.svelte';
  import { createNote } from '@/sal/note-service';
  import { createCanvasFile } from '@/hubs/canvas/services/canvas-file-service';
  import { openCanvas } from '@/hubs/canvas/stores/canvas-store.svelte';
  import { goto } from '$app/navigation';
  import { MetaTags } from 'svelte-meta-tags';
  import { openSettings } from '@/hubs/core/stores/settings-modal.svelte';
  import { togglePalette } from '@/hubs/core/stores/command-store.svelte';
  import {
    getGamification,
    getTierForLevel,
    getTodayChallenge,
    getTodayXp,
    xpToNextLevel,
  } from '@/hubs/core/stores/gamification-store.svelte';

  let { data } = $props();

  let vault = $derived(getVault());
  let notes = $derived(getNotes());
  let recentPaths = $derived(getRecentFiles());

  let recentNotes = $derived(
    recentPaths
      .map((p) => notes.find((n) => n.path === p))
      .filter((n): n is (typeof notes)[number] => !!n)
      .slice(0, 8)
  );

  let totalNotes = $derived(notes.length);
  let totalFolders = $derived(countUniqueFolders(notes));
  let totalWords = $derived(estimateWords(notes));

  let gamification = $derived(getGamification());
  let todayXpAmount = $derived(getTodayXp());
  let levelProgress = $derived(xpToNextLevel(gamification.xp, gamification.level));
  let tier = $derived(getTierForLevel(gamification.level));
  let dailyChallenge = $derived(getTodayChallenge());

  function countUniqueFolders(noteList: typeof notes): number {
    const seen: Record<string, boolean> = {};
    let count = 0;
    for (const n of noteList) {
      const folder = n.path.split('/').slice(0, -1).join('/');
      if (folder && !seen[folder]) {
        seen[folder] = true;
        count++;
      }
    }
    return count;
  }

  function estimateWords(noteList: typeof notes): string {
    const bytes = noteList.reduce((s, n) => s + n.size, 0);
    const est = Math.round(bytes / 5);
    return est >= 1000 ? `${(est / 1000).toFixed(1)}k` : `${est}`;
  }

  function greeting(): string {
    const h = new Date().getHours();
    if (h < 6) return 'Working late';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Working late';
  }

  function todayFormatted(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function timeAgo(ms: number): string {
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  function openNote(path: string) {
    window.dispatchEvent(new CustomEvent('open-note', { detail: { path } }));
  }

  async function newNote() {
    const title = prompt('New note title:');
    if (!title?.trim()) return;
    try {
      const note = await createNote(title.trim());
      await rescanVault();
      openNote(note.path);
    } catch {
      /* browser dev */
    }
  }

  const QUICK_ACTIONS = [
    { label: 'New Note', hint: '⌘N', icon: 'plus', action: newNote },
    { label: 'Search', hint: '⌘P', icon: 'search', action: togglePalette },
    {
      label: 'Graph',
      hint: '',
      icon: 'graph',
      action: () => setActiveHub('right', 'graph', 'local-graph'),
    },
    { label: 'Settings', hint: '⌘,', icon: 'settings', action: () => openSettings() },
  ];

  async function newCanvas() {
    try {
      const entry = await createCanvasFile(`Canvas ${Date.now()}`);
      await openCanvas(entry.path);
      goto('/canvas');
    } catch {
      goto('/canvas');
    }
  }

  const NAV_ITEMS: {
    href?: string;
    action?: () => void;
    label: string;
    desc: string;
    icon: string;
    color: string;
  }[] = [
    {
      href: '/editor',
      label: 'Editor',
      desc: 'Write & edit notes',
      icon: 'editor',
      color: 'accent',
    },
    {
      href: '/calendar',
      label: 'Calendar',
      desc: 'Plan your day',
      icon: 'calendar',
      color: 'info',
    },
    {
      href: '/projects',
      label: 'Projects',
      desc: 'Organize work',
      icon: 'projects',
      color: 'success',
    },
    {
      href: '/writing',
      label: 'Writing',
      desc: 'Track long-form',
      icon: 'writing',
      color: 'accent',
    },
    {
      href: '/flashcards',
      label: 'Flashcards',
      desc: 'Study & review',
      icon: 'flashcards',
      color: 'warning',
    },
    { href: '/import', label: 'Import', desc: 'Bring in data', icon: 'import', color: 'info' },
    {
      href: '/creative',
      label: 'Creative',
      desc: 'Brainstorm ideas',
      icon: 'creative',
      color: 'warning',
    },
    {
      action: newCanvas,
      label: 'Canvas',
      desc: 'New visual workspace',
      icon: 'canvas',
      color: 'primary',
    },
    {
      href: '/pokemon',
      label: 'Pokémon',
      desc: 'Competitive tools',
      icon: 'pokemon',
      color: 'warning',
    },
    { href: '/graph', label: 'Graph', desc: 'Knowledge graph', icon: 'graph', color: 'success' },
    { href: '/media', label: 'Media', desc: 'Images & audio', icon: 'media', color: 'primary' },
    {
      href: '/gamification',
      label: 'Gamification',
      desc: 'XP & achievements',
      icon: 'trophy',
      color: 'warning',
    },
  ];
</script>

<MetaTags
  title={pageTitle(data.title ?? 'Home')}
  description={data.description ?? SITE_DESCRIPTION}
  canonical="{SITE_URL}/"
  openGraph={{
    url: `${SITE_URL}/`,
    title: pageTitle(data.title ?? 'Home'),
    description: data.description ?? SITE_DESCRIPTION,
  }}
/>

<div class="hp">
  {#if vault}
    <div class="hp-dash">
      <header class="hp-hero">
        <div class="hp-greeting">
          <p class="hp-date">{todayFormatted()}</p>
          <h1 class="hp-hello">
            {greeting()}, <span class="hp-vault-name">{vault?.name ?? 'Vault'}</span>
          </h1>
        </div>
        <div class="hp-quick-actions">
          {#each QUICK_ACTIONS as qa (qa.label)}
            <button class="hp-qa-btn" onclick={qa.action} title={qa.label}>
              <BIcon name={qa.icon} size={14} class="hp-qa-icon" />
              <span class="hp-qa-label">{qa.label}</span>
              {#if qa.hint}<span class="hp-qa-hint">{qa.hint}</span>{/if}
            </button>
          {/each}
        </div>
      </header>

      <div class="hp-stats">
        <div class="hp-stat hp-stat-accent">
          <span class="hp-stat-value">{totalNotes}</span>
          <span class="hp-stat-label">Notes</span>
        </div>
        <div class="hp-stat hp-stat-primary">
          <span class="hp-stat-value">{totalFolders}</span>
          <span class="hp-stat-label">Folders</span>
        </div>
        <div class="hp-stat hp-stat-success">
          <span class="hp-stat-value">{totalWords}</span>
          <span class="hp-stat-label">Words</span>
        </div>
      </div>

      <div class="hp-gamify">
        <div class="hp-gamify-row">
          <div class="hp-gamify-badge">
            <span class="hp-gamify-level">Lv.{gamification.level}</span>
            <span class="hp-gamify-tier">{tier.name}</span>
          </div>
          <div class="hp-gamify-info">
            <div class="hp-gamify-top">
              <span class="hp-gamify-xp">{gamification.xp} XP</span>
              <span class="hp-gamify-today">+{todayXpAmount} today</span>
            </div>
            <div
              class="hp-xp-bar"
              role="progressbar"
              aria-valuenow={Math.round(levelProgress.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="XP progress to next level"
            >
              <div class="hp-xp-fill" style="width: {levelProgress.progress}%"></div>
            </div>
            <span class="hp-xp-next"
              >{levelProgress.needed -
                Math.round((levelProgress.progress * levelProgress.needed) / 100)} XP to next level</span
            >
          </div>
          <div class="hp-streak">
            <span class="hp-streak-value">{gamification.currentStreak}</span>
            <span class="hp-streak-label">day streak</span>
          </div>
        </div>
        <div class="hp-daily-challenge">
          <span class="hp-daily-label">Daily Challenge:</span>
          <span class="hp-daily-desc">{dailyChallenge.challenge.description}</span>
          <span class="hp-daily-progress"
            >{dailyChallenge.progress.current}/{dailyChallenge.challenge.target}</span
          >
          {#if dailyChallenge.progress.completed}
            <span class="hp-daily-done">Done!</span>
          {/if}
        </div>
      </div>

      <section class="hp-section">
        <h2 class="hp-section-title">Recent Notes</h2>
        {#if recentNotes.length === 0}
          <div class="hp-empty">
            <BIcon name="documentBlank" size={32} class="hp-empty-icon" />
            <p class="hp-empty-text">No recent notes yet</p>
            <button class="hp-empty-action" onclick={newNote}>Create your first note</button>
          </div>
        {:else}
          <div class="hp-recent-grid">
            {#each recentNotes as note (note.path)}
              <button class="hp-recent-card" onclick={() => openNote(note.path)}>
                <span class="hp-recent-title">{note.title}</span>
                <div class="hp-recent-meta">
                  <span class="hp-recent-path"
                    >{note.path.split('/').slice(0, -1).join('/') || '/'}</span
                  >
                  <span class="hp-recent-time">{timeAgo(note.modifiedAt)}</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </section>

      <section class="hp-section">
        <h2 class="hp-section-title">Navigate</h2>
        <div class="hp-nav-grid">
          {#each NAV_ITEMS as item (item.label)}
            {#if item.href}
              <a class="hp-nav-card" href={item.href}>
                <BIcon name={item.icon} size={22} class="hp-nav-icon hp-nav-icon-{item.color}" />
                <span class="hp-nav-label">{item.label}</span>
                <span class="hp-nav-desc">{item.desc}</span>
              </a>
            {:else if item.action}
              <button class="hp-nav-card" onclick={item.action}>
                <BIcon name={item.icon} size={22} class="hp-nav-icon hp-nav-icon-{item.color}" />
                <span class="hp-nav-label">{item.label}</span>
                <span class="hp-nav-desc">{item.desc}</span>
              </button>
            {/if}
          {/each}
        </div>
      </section>
    </div>
  {/if}
</div>
