<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import {
    prettyPropertiesConfig,
    revealHidden,
    toggleHideProperty,
    setPropertyColor,
  } from '../stores/propertyStore';
  import {
    isPropertyHidden,
    getPropertyValueColor,
    calculateProgress,
    formatDate,
    getRelativeDate,
    resolveIcon,
    renderPropertyTemplate,
    getTagColor,
  } from '../services/propertyDisplay';

  export let propertyKey: string;
  export let propertyValue: unknown;
  export let frontmatter: Record<string, unknown> = {};
  export let onValueChange: (key: string, value: string) => void = () => {};
  export let onDelete: (key: string) => void = () => {};

  let showColorPicker = false;
  let colorInput = '';

  $: config = $prettyPropertiesConfig;
  $: hidden = isPropertyHidden(config.hiddenProperties, propertyKey);
  $: visible = !hidden || $revealHidden;

  // Property type detection
  $: isDate =
    typeof propertyValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(propertyValue as string);
  $: isNumber =
    typeof propertyValue === 'number' ||
    (typeof propertyValue === 'string' && /^-?\d+(\.\d+)?$/.test(propertyValue as string));
  $: isList = Array.isArray(propertyValue);
  $: isTag = propertyKey === 'tags' && isList;

  // Progress bar detection
  $: progressConfig = config.progressBars.find((p) => p.property === propertyKey);
  $: progressData =
    progressConfig && isNumber ? calculateProgress(frontmatter, progressConfig) : null;

  // Template detection
  $: template = config.templates.find((t) => t.property === propertyKey);
  $: renderedValue = template
    ? renderPropertyTemplate(template.template, propertyKey, propertyValue)
    : null;

  // Date formatting
  $: formattedDate =
    isDate && propertyValue
      ? formatDate(new Date(propertyValue as string), config.dateFormat.dateFormat)
      : null;
  $: relativeDate =
    isDate && propertyValue ? getRelativeDate(new Date(propertyValue as string)) : null;
  $: dateColor = relativeDate ? config.dateColors[relativeDate] : '';

  // Property value color
  $: valueColor = !isList
    ? getPropertyValueColor(config.propertyColors, propertyKey, String(propertyValue ?? ''))
    : null;

  // Cover/banner/icon special properties
  $: isCover = propertyKey === config.cover.propertyName;
  $: isBanner = propertyKey === config.banner.propertyName;
  $: isIcon = propertyKey === config.icon.propertyName;
  $: isSpecial = isCover || isBanner || isIcon;

  function handleColorSet() {
    if (colorInput) {
      setPropertyColor(propertyKey, String(propertyValue ?? ''), colorInput);
    }
    showColorPicker = false;
  }

  function handleColorClear() {
    setPropertyColor(propertyKey, String(propertyValue ?? ''), null);
    showColorPicker = false;
  }
</script>

{#if visible}
  <div
    class="pp-row"
    class:pp-hidden={hidden}
    class:pp-special={isSpecial}
    data-property-key={propertyKey}
    style:--pp-value-color={valueColor || ''}
    style:--pp-date-color={dateColor || ''}
  >
    <div class="pp-key-area">
      <button
        class="pp-key-btn"
        on:click={() => toggleHideProperty(propertyKey)}
        title={hidden ? 'Unhide property' : 'Hide property'}
      >
        <Icon name={hidden ? 'eye-off' : 'eye'} size={10} />
      </button>
      <span class="pp-key">{propertyKey}</span>
    </div>

    <div class="pp-value-area">
      {#if renderedValue !== null}
        <!-- Template-rendered value -->
        <span class="pp-rendered">{renderedValue}</span>
      {:else if progressData}
        <!-- Progress bar -->
        <div class="pp-progress-wrap">
          <progress class="pp-progress" max={progressData.max} value={progressData.value}
          ></progress>
          <span class="pp-progress-label">{progressData.percent}%</span>
        </div>
      {:else if isTag && isList}
        <!-- Colored tags -->
        <div class="pp-tags">
          {#each propertyValue as string[] as tag}
            {@const tagColor = getTagColor(config.tagColors, tag)}
            <span
              class="pp-tag-pill"
              data-property-pill-value={tag}
              style:background-color={tagColor || ''}
              style:color={tagColor ? '#fff' : ''}>#{tag}</span
            >
          {/each}
        </div>
      {:else if isList}
        <!-- Colored list items -->
        <div class="pp-pills">
          {#each propertyValue as string[] as item}
            {@const itemColor = getPropertyValueColor(config.propertyColors, propertyKey, item)}
            <span
              class="pp-pill"
              data-property-pill-value={item}
              style:background-color={itemColor || ''}
              style:color={itemColor ? '#fff' : ''}>{item}</span
            >
          {/each}
        </div>
      {:else if formattedDate}
        <!-- Formatted date with relative color -->
        <span class="pp-date" data-relative-date={relativeDate} style:color={dateColor || ''}>
          {formattedDate}
        </span>
      {:else if isIcon && propertyValue}
        <!-- Icon preview -->
        {@const icon = resolveIcon(String(propertyValue))}
        <span class="pp-icon-preview">
          {#if icon.source === 'lucide'}
            <Icon name={icon.value} size={16} />
          {:else if icon.source === 'image'}
            <img src={icon.value} alt="icon" class="pp-icon-img" />
          {:else}
            <span class="pp-icon-emoji">{icon.value}</span>
          {/if}
        </span>
      {:else}
        <!-- Standard editable value -->
        <input
          class="pp-value-input"
          value={String(propertyValue ?? '')}
          on:blur={(e) => onValueChange(propertyKey, e.currentTarget.value)}
          style:color={valueColor || ''}
        />
      {/if}

      <!-- Color button for text values -->
      {#if config.showTextColorButton && !isList && !isDate && !progressData && !isSpecial}
        <button
          class="pp-color-btn"
          on:click={() => {
            showColorPicker = !showColorPicker;
          }}
          title="Set color"
        >
          <span class="pp-color-dot" style:background={valueColor || 'var(--text-muted)'}></span>
        </button>
      {/if}

      <button class="pp-delete-btn" on:click={() => onDelete(propertyKey)} title="Remove property">
        <Icon name="x" size={10} />
      </button>
    </div>

    {#if showColorPicker}
      <div class="pp-color-picker">
        <input type="color" bind:value={colorInput} />
        <button class="pp-btn-sm" on:click={handleColorSet}>Apply</button>
        <button class="pp-btn-sm" on:click={handleColorClear}>Clear</button>
        <button class="pp-btn-sm" on:click={() => (showColorPicker = false)}>Cancel</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .pp-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 4px;
    background: var(--background-secondary);
    align-items: center;
  }
  .pp-row.pp-hidden {
    opacity: 0.5;
    border-left: 2px solid var(--text-muted);
  }
  .pp-row.pp-special {
    border-left: 2px solid var(--interactive-accent);
  }
  .pp-key-area {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    min-width: 80px;
    max-width: 140px;
  }
  .pp-key-btn {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 1px;
    cursor: pointer;
    color: var(--text-faint);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .pp-row:hover .pp-key-btn {
    opacity: 1;
  }
  .pp-key {
    font-size: var(--font-ui-smaller);
    font-weight: var(--font-semibold);
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pp-value-area {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .pp-value-input {
    flex: 1;
    min-width: 0;
    padding: 3px 6px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: var(--pp-value-color, var(--text-normal));
    font-size: var(--font-ui-small);
    outline: none;
  }
  .pp-value-input:focus {
    border-color: var(--interactive-accent);
    background: var(--background-primary);
  }
  .pp-rendered {
    font-size: var(--font-ui-small);
    color: var(--text-normal);
  }
  .pp-progress-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }
  .pp-progress {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    appearance: none;
    overflow: hidden;
    background: var(--background-modifier-border);
  }
  .pp-progress::-webkit-progress-bar {
    background: var(--background-modifier-border);
    border-radius: 4px;
  }
  .pp-progress::-webkit-progress-value {
    background: var(--interactive-accent);
    border-radius: 4px;
  }
  .pp-progress-label {
    font-size: 11px;
    color: var(--text-muted);
    min-width: 30px;
    text-align: right;
  }
  .pp-tags,
  .pp-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .pp-tag-pill,
  .pp-pill {
    display: inline-flex;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 11px;
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    cursor: default;
  }
  .pp-date {
    font-size: var(--font-ui-small);
  }
  .pp-icon-preview {
    display: flex;
    align-items: center;
  }
  .pp-icon-img {
    width: 18px;
    height: 18px;
    object-fit: cover;
    border-radius: 3px;
  }
  .pp-icon-emoji {
    font-size: 16px;
  }
  .pp-color-btn {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .pp-row:hover .pp-color-btn {
    opacity: 1;
  }
  .pp-color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
  }
  .pp-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .pp-row:hover .pp-delete-btn {
    opacity: 1;
  }
  .pp-delete-btn:hover {
    color: var(--text-error, #ef4444);
  }
  .pp-color-picker {
    display: flex;
    gap: 4px;
    align-items: center;
    width: 100%;
    padding-top: 4px;
  }
  .pp-color-picker input[type='color'] {
    width: 28px;
    height: 24px;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .pp-btn-sm {
    padding: 2px 6px;
    font-size: 11px;
    border: 1px solid var(--border-color);
    border-radius: 3px;
    background: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
  }
  .pp-btn-sm:hover {
    background: var(--background-modifier-hover);
  }
</style>
