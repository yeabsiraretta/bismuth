<script lang="ts">
  import {
    DEFAULT_COLOR_COLLECTION,
    DEFAULT_SPACING_COLLECTION,
    DEFAULT_TYPOGRAPHY_COLLECTION,
    resolveToken,
    type TokenCollection,
    type DesignToken,
    type TokenValue,
    type TypographyValue,
  } from '@/utils/canvasDesignTokens';

  let collections: TokenCollection[] = [
    DEFAULT_COLOR_COLLECTION,
    DEFAULT_SPACING_COLLECTION,
    DEFAULT_TYPOGRAPHY_COLLECTION,
  ];

  let activeCollection = collections[0];
  let activeMode = activeCollection.modes[0];
  let searchQuery = '';
  let expandedToken: string | null = null;

  $: filteredTokens = searchQuery
    ? activeCollection.tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCollection.tokens;

  function switchCollection(collection: TokenCollection) {
    activeCollection = collection;
    activeMode = collection.modes[0];
    searchQuery = '';
  }

  function getDisplayValue(token: DesignToken): string {
    const value = resolveToken(token, activeMode);
    if (value === undefined) return '—';
    if (typeof value === 'object') {
      const tv = value as TypographyValue;
      return `${tv.fontFamily} ${tv.fontWeight} ${tv.fontSize}px`;
    }
    return String(value);
  }

  function isColor(token: DesignToken): boolean {
    return token.type === 'color';
  }

  function getColorValue(token: DesignToken): string {
    const value = resolveToken(token, activeMode);
    return typeof value === 'string' ? value : '#000000';
  }

  function getCSSVariable(token: DesignToken): string {
    return `--${token.name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()}`;
  }

  function toggleExpanded(tokenId: string) {
    expandedToken = expandedToken === tokenId ? null : tokenId;
  }
</script>

<div class="tokens-panel">
  <div class="tokens-header">
    <span class="tokens-title">Design Tokens</span>
  </div>

  <!-- Collection tabs -->
  <div class="collection-tabs">
    {#each collections as collection}
      <button
        class="collection-tab"
        class:active={activeCollection.id === collection.id}
        on:click={() => switchCollection(collection)}
      >
        {collection.name}
      </button>
    {/each}
  </div>

  <!-- Mode selector -->
  {#if activeCollection.modes.length > 1}
    <div class="mode-selector">
      {#each activeCollection.modes as mode}
        <button
          class="mode-btn"
          class:active={activeMode === mode}
          on:click={() => (activeMode = mode)}
        >
          {mode}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Search -->
  <div class="token-search">
    <input
      type="text"
      placeholder="Search tokens..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <!-- Token list -->
  <div class="token-list">
    {#each filteredTokens as token (token.id)}
      <button
        class="token-item"
        class:expanded={expandedToken === token.id}
        on:click={() => toggleExpanded(token.id)}
      >
        <div class="token-row">
          {#if isColor(token)}
            <span
              class="color-swatch"
              style="background: {getColorValue(token)}"
            ></span>
          {/if}
          <span class="token-name">{token.name}</span>
          <span class="token-value">{getDisplayValue(token)}</span>
        </div>

        {#if expandedToken === token.id}
          <div class="token-details">
            {#if token.description}
              <p class="token-description">{token.description}</p>
            {/if}
            <div class="token-meta">
              <span class="token-variable">{getCSSVariable(token)}</span>
            </div>
            <!-- Show all mode values -->
            {#each activeCollection.modes as mode}
              <div class="mode-value">
                <span class="mode-label">{mode}:</span>
                <span class="mode-val">{String(token.values[mode] ?? '—')}</span>
              </div>
            {/each}
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .tokens-panel {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--border-color);
    max-height: 400px;
    overflow: hidden;
  }

  .tokens-header {
    display: flex;
    align-items: center;
    padding: var(--spacing-s) var(--spacing-m);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .tokens-title {
    font-size: var(--font-smaller);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .collection-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
  }

  .collection-tab {
    flex: 1;
    padding: var(--spacing-xs) var(--spacing-s);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 11px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .collection-tab:hover {
    color: var(--text-normal);
  }

  .collection-tab.active {
    color: var(--interactive-accent);
    border-bottom-color: var(--interactive-accent);
  }

  .mode-selector {
    display: flex;
    gap: 4px;
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }

  .mode-btn {
    padding: 2px 8px;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 10px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .mode-btn.active {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .token-search {
    padding: var(--spacing-xs) var(--spacing-s);
    border-bottom: 1px solid var(--border-color);
  }

  .search-input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-s);
    font-size: 11px;
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .token-list {
    overflow-y: auto;
    flex: 1;
  }

  .token-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 6px var(--spacing-s);
    background: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .token-item:hover {
    background: var(--background-modifier-hover);
  }

  .token-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    width: 100%;
  }

  .color-swatch {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .token-name {
    flex: 1;
    font-size: 11px;
    color: var(--text-normal);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .token-value {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-monospace);
  }

  .token-details {
    margin-top: var(--spacing-xs);
    padding-top: var(--spacing-xs);
    border-top: 1px dashed var(--border-color);
  }

  .token-description {
    margin: 0 0 4px 0;
    font-size: 10px;
    color: var(--text-muted);
  }

  .token-meta {
    margin-bottom: 4px;
  }

  .token-variable {
    font-size: 10px;
    font-family: var(--font-monospace);
    color: var(--interactive-accent);
    background: var(--background-primary-alt);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .mode-value {
    display: flex;
    gap: var(--spacing-xs);
    font-size: 10px;
    margin-top: 2px;
  }

  .mode-label {
    color: var(--text-muted);
  }

  .mode-val {
    font-family: var(--font-monospace);
    color: var(--text-normal);
  }
</style>
