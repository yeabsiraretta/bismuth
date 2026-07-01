<script lang="ts">
  import type { CanvasElement, FeatureCardData } from '@/features/canvas/types/elements';
  import { log } from '@/utils/logger';

  export const elementId: string = ''; // passed by parent for future filtering
  export let selectedElement: CanvasElement | null = null;

  interface CSSProperty {
    name: string;
    value: string;
    tokenRef?: string;
  }

  export let properties: CSSProperty[] = [];

  $: isFeatureCard = selectedElement?.element_type === 'feature_card';
  $: featureCardData = selectedElement?.properties.featureCardData as FeatureCardData | undefined;
  $: specPath = featureCardData?.specPath ?? '';

  function handleSpecPathInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = input.value.trim() || undefined;
    if (!selectedElement) return;
    const fcd = selectedElement.properties.featureCardData as FeatureCardData | undefined;
    if (!fcd) return;
    (selectedElement.properties.featureCardData as FeatureCardData).specPath = value;
    log.debug('PropertyInspector: specPath updated', { id: selectedElement.id, specPath: value });
  }

  function copyProperty(prop: CSSProperty) {
    const text = prop.tokenRef
      ? `${prop.name}: var(--${prop.tokenRef});`
      : `${prop.name}: ${prop.value};`;
    navigator.clipboard.writeText(text);
  }

  function copyAllCSS() {
    const css = properties
      .map(p => p.tokenRef
        ? `  ${p.name}: var(--${p.tokenRef});`
        : `  ${p.name}: ${p.value};`
      )
      .join('\n');
    navigator.clipboard.writeText(`{\n${css}\n}`);
  }
</script>

<div class="property-inspector">
  <div class="inspector-header">
    <h4>Properties</h4>
    <button class="copy-all" on:click={copyAllCSS} title="Copy all as CSS">
      Copy CSS
    </button>
  </div>

  {#if isFeatureCard}
    <div class="spec-path-row">
      <label for="spec-path-input" class="spec-path-label">Spec Path</label>
      <input
        id="spec-path-input"
        class="spec-path-input"
        type="text"
        value={specPath}
        placeholder="specs/NNN-feature/spec.md"
        on:change={handleSpecPathInput}
      />
    </div>
  {/if}

  <div class="property-list">
    {#each properties as prop (prop.name)}
      <div class="property-row" on:click={() => copyProperty(prop)} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && copyProperty(prop)}>
        <span class="prop-name">{prop.name}</span>
        <span class="prop-value">
          {#if prop.tokenRef}
            <span class="token-ref">var(--{prop.tokenRef})</span>
          {:else}
            {prop.value}
          {/if}
        </span>
      </div>
    {/each}
  </div>

  {#if properties.length === 0 && !isFeatureCard}
    <div class="empty">Select an element to inspect properties</div>
  {/if}
</div>

<style>
  .property-inspector { display: flex; flex-direction: column; gap: var(--spacing-xs); }
  .inspector-header { display: flex; align-items: center; justify-content: space-between; }
  .inspector-header h4 { margin: 0; font-size: var(--font-size-sm); }
  .copy-all { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 2px 6px; cursor: pointer; font-size: var(--font-size-xs); }
  .spec-path-row { display: flex; flex-direction: column; gap: 2px; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color, #e4e4e7); }
  .spec-path-label { font-size: var(--font-size-xs); color: var(--text-muted); font-weight: 500; }
  .spec-path-input { font-size: var(--font-size-sm); padding: 4px 6px; border: 1px solid var(--border-color, #e4e4e7); border-radius: var(--radius-sm); background: var(--background-primary); color: var(--text-primary); width: 100%; box-sizing: border-box; }
  .spec-path-input:focus { outline: 2px solid var(--interactive-accent); outline-offset: 1px; }
  .property-list { display: flex; flex-direction: column; font-family: monospace; font-size: var(--font-size-sm); }
  .property-row { display: flex; justify-content: space-between; padding: 2px var(--spacing-xs); border-radius: 2px; cursor: pointer; }
  .property-row:hover { background: var(--bg-hover); }
  .prop-name { color: var(--text-muted); }
  .prop-value { color: var(--text-primary); }
  .token-ref { color: var(--accent); }
  .empty { color: var(--text-muted); font-size: var(--font-size-sm); text-align: center; padding: var(--spacing-md); }
</style>
