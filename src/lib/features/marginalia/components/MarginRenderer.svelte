<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import { marginaliaSettings, activeRecall } from '../stores/marginStore';
  import type { MarginNote } from '../types';

  export let notes: MarginNote[] = [];
  export let lineHeight: number = 24;

  $: alignment = $marginaliaSettings.alignment;
  $: width = $marginaliaSettings.marginWidth;
  $: fontSize = $marginaliaSettings.fontSize;
  $: fontFamily = $marginaliaSettings.fontFamily;

  function noteStyle(note: MarginNote): string {
    const top = (note.line - 1) * lineHeight;
    const bg = note.prefix?.bgColor ?? 'transparent';
    const border = note.prefix?.color ?? 'var(--text-muted)';
    return `top:${top}px;border-left-color:${border};background:${bg};font-size:${fontSize}px;font-family:${fontFamily}`;
  }

  function shouldBlur(note: MarginNote): boolean {
    return $activeRecall && note.isBlur;
  }
</script>

<div
  class="margin-column"
  class:left={alignment === 'left'}
  class:right={alignment === 'right'}
  style="width:{width}%"
  role="complementary"
  aria-label="Margin notes"
>
  {#each notes as note (note.id)}
    <div
      class="margin-note"
      class:blur={shouldBlur(note)}
      style={noteStyle(note)}
      title="Line {note.line}"
      role="note"
    >
      {#if note.isImage && note.imagePath}
        <div class="margin-image">
          <img src={note.imagePath} alt="Margin sketch" loading="lazy" />
        </div>
      {:else}
        <span class="margin-text">{note.text}</span>
      {/if}
      {#if note.isBlur}
        <span class="blur-badge" title="Active Recall">
          <Icon name="eye-off" size={8} />
        </span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .margin-column {
    position: absolute;
    top: 0;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }
  .margin-column.left {
    left: 0;
  }
  .margin-column.right {
    right: 0;
  }
  .margin-note {
    position: absolute;
    padding: 4px 8px;
    border-left: 3px solid var(--text-muted);
    pointer-events: auto;
    max-width: 100%;
    word-wrap: break-word;
    border-radius: 0 var(--radius-s) var(--radius-s) 0;
    transition:
      filter 0.2s,
      opacity 0.2s;
    cursor: default;
  }
  .margin-note.blur .margin-text {
    filter: blur(5px);
  }
  .margin-note.blur:hover .margin-text {
    filter: none;
  }
  .margin-text {
    color: var(--text-normal);
    line-height: 1.4;
  }
  .margin-image {
    max-width: 100%;
  }
  .margin-image img {
    max-width: 100%;
    border-radius: var(--radius-s);
    cursor: zoom-in;
    transition: transform 0.2s;
  }
  .margin-image img:hover {
    transform: scale(1.5);
    z-index: 100;
    position: relative;
  }
  .blur-badge {
    display: inline-flex;
    margin-left: 4px;
    opacity: 0.5;
    vertical-align: middle;
  }
</style>
