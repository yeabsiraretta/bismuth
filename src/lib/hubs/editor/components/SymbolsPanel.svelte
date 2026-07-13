<script lang="ts">
  import Panel from '@/ui/panel.svelte';

  const SYMBOL_GROUPS = [
    { label: 'Arrows', symbols: ['←', '→', '↑', '↓', '↔', '⇐', '⇒', '⇑', '⇓', '⇔'] },
    {
      label: 'Math',
      symbols: ['±', '×', '÷', '≠', '≤', '≥', '∞', '√', '∑', '∏', 'π', 'θ', 'λ', 'Δ', '∫'],
    },
    {
      label: 'Typography',
      symbols: ['—', '–', '…', '•', '·', '†', '‡', '§', '¶', '©', '®', '™', '°'],
    },
    { label: 'Currency', symbols: ['$', '€', '£', '¥', '₹', '₿', '¢'] },
    {
      label: 'Greek',
      symbols: [
        'α',
        'β',
        'γ',
        'δ',
        'ε',
        'ζ',
        'η',
        'θ',
        'ι',
        'κ',
        'λ',
        'μ',
        'ν',
        'ξ',
        'ο',
        'π',
        'ρ',
        'σ',
        'τ',
        'υ',
        'φ',
        'χ',
        'ψ',
        'ω',
      ],
    },
    { label: 'Emoji', symbols: ['✓', '✗', '★', '☆', '♠', '♣', '♥', '♦', '♪', '♫'] },
  ];

  let recentSymbols = $state<string[]>([]);
  let copiedSymbol = $state('');

  function insertSymbol(symbol: string) {
    window.navigator.clipboard.writeText(symbol);
    copiedSymbol = symbol;
    recentSymbols = [symbol, ...recentSymbols.filter((s) => s !== symbol)].slice(0, 10);
    setTimeout(() => {
      copiedSymbol = '';
    }, 1200);
  }
</script>

<Panel title="Symbols">
  <div class="symbols-panel">
    {#if copiedSymbol}
      <div class="copied-toast">Copied {copiedSymbol}</div>
    {/if}

    {#if recentSymbols.length > 0}
      <div class="symbol-section">
        <h4 class="section-label">Recent</h4>
        <div class="symbol-grid">
          {#each recentSymbols as sym (sym)}
            <button class="symbol-btn" onclick={() => insertSymbol(sym)} title={sym}>{sym}</button>
          {/each}
        </div>
      </div>
    {/if}

    {#each SYMBOL_GROUPS as group (group.label)}
      <div class="symbol-section">
        <h4 class="section-label">{group.label}</h4>
        <div class="symbol-grid">
          {#each group.symbols as sym (sym)}
            <button class="symbol-btn" onclick={() => insertSymbol(sym)} title={sym}>{sym}</button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</Panel>

<style>
  .symbols-panel {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }
  .symbol-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .section-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }
  .symbol-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .symbol-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all var(--transition-fast);
  }
  .symbol-btn:hover {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .copied-toast {
    padding: 4px 8px;
    background: var(--color-accent);
    color: var(--color-background);
    border-radius: var(--radius-s);
    font-size: 0.7rem;
    text-align: center;
  }
</style>
