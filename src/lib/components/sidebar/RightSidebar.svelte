<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { activeNote } from '@/stores/vault/vault';

  type SidebarTab = 'backlinks' | 'outline' | 'tags' | 'properties' | 'calendar';

  let activeTab: SidebarTab = 'backlinks';
  let backlinks: Array<{ path: string; title: string; context: string }> = [];
  let outlineItems: Array<{ level: number; text: string; id: string }> = [];
  let tags: string[] = [];
  let properties: Record<string, any> = {};

  $: if ($activeNote) {
    loadSidebarData($activeNote);
  }

  function loadSidebarData(note: any) {
    // Extract tags from frontmatter
    if (note.frontmatter?.tags) {
      tags = Array.isArray(note.frontmatter.tags) ? note.frontmatter.tags : [note.frontmatter.tags];
    } else {
      tags = [];
    }

    // Extract properties from frontmatter
    properties = note.frontmatter || {};

    // Parse outline from content (headings)
    outlineItems = parseOutline(note.content);

    // Backlinks would be loaded from a service
    // For now, placeholder
    backlinks = [];
  }

  function parseOutline(content: string): Array<{ level: number; text: string; id: string }> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const items: Array<{ level: number; text: string; id: string }> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      items.push({ level, text, id });
    }

    return items;
  }

  function setActiveTab(tab: SidebarTab) {
    activeTab = tab;
  }

  function getTabIcon(tab: SidebarTab): string {
    switch (tab) {
      case 'backlinks':
        return 'link-2';
      case 'outline':
        return 'list';
      case 'tags':
        return 'tag';
      case 'properties':
        return 'file-text';
      case 'calendar':
        return 'calendar';
      default:
        return 'circle';
    }
  }
</script>

<div class="right-sidebar">
  <div class="sidebar-tabs">
    <button
      class="tab-btn"
      class:active={activeTab === 'backlinks'}
      on:click={() => setActiveTab('backlinks')}
      title="Backlinks"
      aria-label="Backlinks"
    >
      <Icon name={getTabIcon('backlinks')} size={18} />
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'outline'}
      on:click={() => setActiveTab('outline')}
      title="Outline"
      aria-label="Outline"
    >
      <Icon name={getTabIcon('outline')} size={18} />
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'tags'}
      on:click={() => setActiveTab('tags')}
      title="Tags"
      aria-label="Tags"
    >
      <Icon name={getTabIcon('tags')} size={18} />
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'properties'}
      on:click={() => setActiveTab('properties')}
      title="Properties"
      aria-label="Properties"
    >
      <Icon name={getTabIcon('properties')} size={18} />
    </button>
    <button
      class="tab-btn"
      class:active={activeTab === 'calendar'}
      on:click={() => setActiveTab('calendar')}
      title="Calendar"
      aria-label="Calendar"
    >
      <Icon name={getTabIcon('calendar')} size={18} />
    </button>
  </div>

  <div class="sidebar-content">
    {#if activeTab === 'backlinks'}
      <div class="panel">
        <h3 class="panel-title">Backlinks</h3>
        {#if backlinks.length > 0}
          <div class="backlinks-list">
            {#each backlinks as link}
              <div class="backlink-item">
                <div class="backlink-title">{link.title}</div>
                <div class="backlink-context">{link.context}</div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="placeholder">
            <Icon name="link-2" size={48} />
            <p>No backlinks found</p>
            <span class="placeholder-hint">Notes linking to this page will appear here</span>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'outline'}
      <div class="panel">
        <h3 class="panel-title">Outline</h3>
        {#if outlineItems.length > 0}
          <div class="outline-list">
            {#each outlineItems as item}
              <div
                class="outline-item"
                style="padding-left: {(item.level - 1) * 1}rem"
                class:h1={item.level === 1}
                class:h2={item.level === 2}
                class:h3={item.level === 3}
              >
                <a href="#{item.id}">{item.text}</a>
              </div>
            {/each}
          </div>
        {:else}
          <div class="placeholder">
            <Icon name="list" size={48} />
            <p>No headings found</p>
            <span class="placeholder-hint">Add headings to your note to see the outline</span>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'tags'}
      <div class="panel">
        <h3 class="panel-title">Tags</h3>
        {#if tags.length > 0}
          <div class="tags-list">
            {#each tags as tag}
              <span class="tag-badge">#{tag}</span>
            {/each}
          </div>
        {:else}
          <div class="placeholder">
            <Icon name="tag" size={48} />
            <p>No tags found</p>
            <span class="placeholder-hint">Add tags to your frontmatter to organize notes</span>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'properties'}
      <div class="panel">
        <h3 class="panel-title">Properties</h3>
        {#if Object.keys(properties).length > 0}
          <div class="properties-list">
            {#each Object.entries(properties) as [key, value]}
              <div class="property-item">
                <span class="property-key">{key}:</span>
                <span class="property-value">{JSON.stringify(value)}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="placeholder">
            <Icon name="file-text" size={48} />
            <p>No properties found</p>
            <span class="placeholder-hint">Add frontmatter to your note to see properties</span>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'calendar'}
      <div class="panel">
        <h3 class="panel-title">Calendar</h3>
        <div class="placeholder">
          <Icon name="calendar" size={48} />
          <p>Calendar view coming soon</p>
          <span class="placeholder-hint">Daily notes and calendar integration</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .right-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--background-primary);
    border-left: 1px solid var(--background-modifier-border);
  }

  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
    padding: var(--spacing-xs);
    gap: var(--spacing-xs);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size-4-9);
    height: var(--size-4-9);
    padding: 0;
    background: none;
    border: none;
    border-radius: var(--radius-s);
    cursor: pointer;
    color: var(--text-muted);
    transition: all var(--transition-fast);
  }

  .tab-btn:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-primary);
  }

  .tab-btn.active {
    background-color: var(--background-primary);
    color: var(--interactive-accent);
    box-shadow: var(--shadow-s);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-m);
  }

  .panel {
    height: 100%;
  }

  .panel-title {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-m) 0;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80%;
    text-align: center;
    color: var(--text-muted);
    gap: var(--spacing-s);
  }

  .placeholder p {
    font-size: var(--font-ui-medium);
    font-weight: var(--font-medium);
    margin: 0;
  }

  .placeholder-hint {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  /* Backlinks */
  .backlinks-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .backlink-item {
    padding: var(--spacing-s);
    background-color: var(--background-secondary);
    border-radius: var(--radius-s);
    border: 1px solid var(--background-modifier-border);
  }

  .backlink-title {
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .backlink-context {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  /* Outline */
  .outline-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .outline-item {
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-xs);
    transition: background-color var(--transition-fast);
  }

  .outline-item:hover {
    background-color: var(--background-modifier-hover);
  }

  .outline-item a {
    color: var(--text-primary);
    text-decoration: none;
    font-size: var(--font-ui-small);
  }

  .outline-item.h1 a {
    font-weight: var(--font-semibold);
    font-size: var(--font-ui-medium);
  }

  .outline-item.h2 a {
    font-weight: var(--font-medium);
  }

  /* Tags */
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-s);
  }

  .tag-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-s);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--spacing-m);
    font-size: var(--font-ui-small);
    color: var(--text-accent);
    font-weight: var(--font-medium);
  }

  /* Properties */
  .properties-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .property-item {
    display: flex;
    gap: var(--spacing-s);
    padding: var(--spacing-s);
    background-color: var(--background-secondary);
    border-radius: var(--radius-xs);
    font-size: var(--font-ui-small);
  }

  .property-key {
    font-weight: var(--font-medium);
    color: var(--text-muted);
    min-width: var(--size-4-16);
  }

  .property-value {
    color: var(--text-primary);
    font-family: var(--font-mono);
    word-break: break-word;
  }
</style>
