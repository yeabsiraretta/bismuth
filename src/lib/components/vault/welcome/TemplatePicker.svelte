<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import Icon from '@/components/icons/Icon.svelte';
  import { VaultTemplate } from '@/types/data/vault';
  import { log } from '@/utils/logger';

  export let onBack: () => void;
  export let onSelect: (parentPath: string, template: VaultTemplate) => void;
  export let isCreating = false;

  const templates = [
    { value: VaultTemplate.PARA, icon: 'layers', title: 'PARA', description: 'Projects, Areas, Resources, and Archive — ideal for GTD-style workflows' },
    { value: VaultTemplate.JohnnyDecimal, icon: 'grid', title: 'Johnny.Decimal', description: 'Structured numbering system (10–19, 20–29, …) for strict hierarchical organization' },
    { value: VaultTemplate.Zettelkasten, icon: 'share-2', title: 'Zettelkasten', description: 'Atomic, interconnected notes with unique IDs — ideal for research and creative writing' },
  ];

  async function handleSelect(template: VaultTemplate) {
    log.info('User selected template', { template: VaultTemplate[template] });
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Parent Folder for New Vault',
      });

      if (selected) {
        const path = Array.isArray(selected) ? selected[0] : selected;
        log.info('Folder selected for template vault', { path, template: VaultTemplate[template] });
        onSelect(path, template);
      } else {
        log.info('User cancelled folder selection for template vault');
      }
    } catch (error) {
      log.error('Failed to open folder selection dialog', error as Error);
    }
  }
</script>

<div class="template-picker">
  <button class="back-btn" on:click={onBack} title="Back to welcome">
    <Icon name="arrow-left" size={16} />
    <span>Back</span>
  </button>

  <h2 class="picker-title">Choose a Template</h2>
  <p class="picker-subtitle">Start with a pre-configured organizational system</p>

  <div class="template-grid">
    {#each templates as tmpl}
      <button class="template-card" on:click={() => handleSelect(tmpl.value)} disabled={isCreating}>
        <div class="template-icon"><Icon name={tmpl.icon} size={28} /></div>
        <h3 class="template-name">{tmpl.title}</h3>
        <p class="template-description">{tmpl.description}</p>
      </button>
    {/each}
  </div>
</div>

<style>
  .template-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--radius-s);
    position: absolute;
    top: 0;
    left: 0;
    transition: color var(--transition-fast), background-color var(--transition-fast);
  }

  .back-btn:hover {
    color: var(--text-normal);
    background-color: var(--interactive-hover);
  }

  .picker-title {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    text-align: center;
    margin: 0 0 var(--spacing-s) 0;
  }

  .picker-subtitle {
    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    text-align: center;
    margin: 0 0 var(--spacing-xxl) 0;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-l);
    width: 100%;
  }

  .template-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l);
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-medium);
  }

  .template-card:hover:not(:disabled) {
    border-color: var(--interactive-accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow-l);
  }

  .template-card:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .template-icon {
    color: var(--interactive-accent);
    margin-bottom: var(--spacing-m);
  }

  .template-name {
    font-size: var(--font-ui-large);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    margin: 0 0 var(--spacing-s) 0;
  }

  .template-description {
    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }
</style>
