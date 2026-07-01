<script lang="ts">
  import Icon from '@/components/icons/Icon.svelte';
  import PanelHeader from '@/components/ui/layout/PanelHeader.svelte';
  import ActionButton from '@/components/ui/actions/ActionButton.svelte';
  import EmptyState from '@/components/ui/feedback/EmptyState.svelte';
  import { activeNote, updateNoteInStore } from '@/stores/vault/vault';
  import { writeNote } from '@/services/vault/vault';
  import { log } from '@/utils/logger';
  import PropertyRow from './PropertyRow.svelte';
  import {
    prettyPropertiesConfig,
    revealHidden,
    toggleRevealAll,
    toggleEnabled,
  } from '../stores/propertyStore';
  import { resolveCoverSrc, getCoverDimensions, resolveIcon } from '../services/propertyDisplay';

  interface NoteProperty {
    key: string;
    value: unknown;
  }

  let properties: NoteProperty[] = [];
  let frontmatter: Record<string, unknown> = {};
  let trackedPath = '';

  $: config = $prettyPropertiesConfig;

  $: {
    const path = $activeNote?.path ?? '';
    if (path !== trackedPath) {
      trackedPath = path;
      const result = extractProperties($activeNote?.content || '');
      properties = result.props;
      frontmatter = result.fm;
    }
  }

  // Cover, banner, icon from frontmatter
  $: coverValue = String(frontmatter[config.cover.propertyName] ?? '');
  $: bannerValue = String(frontmatter[config.banner.propertyName] ?? '');
  $: iconValue = String(frontmatter[config.icon.propertyName] ?? '');
  $: coverSrc = coverValue ? resolveCoverSrc(coverValue) : '';
  $: coverDims = getCoverDimensions(config.cover.defaultShape, config.cover.shapeWidths);
  $: resolvedIcon = iconValue ? resolveIcon(iconValue) : null;

  function extractProperties(content: string): {
    props: NoteProperty[];
    fm: Record<string, unknown>;
  } {
    if (!content.startsWith('---')) return { props: [], fm: {} };
    const end = content.indexOf('---', 3);
    if (end === -1) return { props: [], fm: {} };
    const fmText = content.slice(3, end).trim();
    const props: NoteProperty[] = [];
    const fm: Record<string, unknown> = {};
    for (const line of fmText.split('\n')) {
      const ci = line.indexOf(':');
      if (ci > 0) {
        const key = line.slice(0, ci).trim();
        let raw = line.slice(ci + 1).trim();
        let value: unknown = raw;
        if (raw === 'true') value = true;
        else if (raw === 'false') value = false;
        else if (/^-?\d+$/.test(raw)) value = parseInt(raw, 10);
        else if (/^-?\d+\.\d+$/.test(raw)) value = parseFloat(raw);
        else if (raw.startsWith('[') && raw.endsWith(']')) {
          value = raw
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
        } else {
          value = raw.replace(/^['"]|['"]$/g, '');
        }
        props.push({ key, value });
        fm[key] = value;
      }
    }
    return { props, fm };
  }

  function buildContent(props: NoteProperty[], origContent: string): string {
    const body = getBody(origContent);
    if (props.length === 0) return body;
    const fmLines = props.map((p) => {
      const v = Array.isArray(p.value)
        ? `[${(p.value as string[]).join(', ')}]`
        : String(p.value ?? '');
      return `${p.key}: ${v}`;
    });
    return `---\n${fmLines.join('\n')}\n---\n${body}`;
  }

  function getBody(content: string): string {
    if (!content.startsWith('---')) return content;
    const end = content.indexOf('---', 3);
    if (end === -1) return content;
    return content.slice(end + 3).replace(/^\n/, '');
  }

  async function saveProperties(updated: NoteProperty[]) {
    if (!$activeNote) return;
    properties = updated;
    frontmatter = Object.fromEntries(updated.map((p) => [p.key, p.value]));
    const newContent = buildContent(updated, $activeNote.content);
    try {
      await writeNote($activeNote.path, newContent);
      updateNoteInStore({ ...$activeNote, content: newContent });
    } catch (error) {
      log.error('Failed to save properties', error as Error);
    }
  }

  function handleValueChange(key: string, newVal: string) {
    const updated = properties.map((p) => (p.key === key ? { ...p, value: newVal } : p));
    saveProperties(updated);
  }

  function handleDelete(key: string) {
    saveProperties(properties.filter((p) => p.key !== key));
  }
</script>

<div class="pp-panel">
  <PanelHeader count={properties.length || undefined}>
    <svelte:fragment slot="actions">
      <ActionButton
        icon={config.enabled ? 'eye' : 'eye-off'}
        title={config.enabled ? 'Disable Pretty Properties' : 'Enable Pretty Properties'}
        on:click={toggleEnabled}
      />
      <ActionButton
        icon={$revealHidden ? 'unlock' : 'lock'}
        title={$revealHidden ? 'Hide hidden properties' : 'Reveal hidden properties'}
        on:click={toggleRevealAll}
      />
    </svelte:fragment>
  </PanelHeader>

  {#if !$activeNote}
    <EmptyState
      icon="file-text"
      title="No note open"
      description="Open a note to see its properties"
    />
  {:else}
    <div class="pp-body">
      <!-- Banner -->
      {#if bannerValue}
        <div class="pp-banner" style:height="{config.banner.height}px">
          <img src={resolveCoverSrc(bannerValue)} alt="banner" class="pp-banner-img" />
          <!-- Icon overlay on banner -->
          {#if resolvedIcon}
            <div class="pp-icon-on-banner">
              {#if resolvedIcon.source === 'lucide'}
                <Icon name={resolvedIcon.value} size={32} />
              {:else if resolvedIcon.source === 'image'}
                <img src={resolvedIcon.value} alt="icon" class="pp-icon-lg" />
              {:else}
                <span class="pp-icon-emoji-lg">{resolvedIcon.value}</span>
              {/if}
            </div>
          {/if}
        </div>
      {:else if resolvedIcon}
        <!-- Icon without banner -->
        <div class="pp-icon-standalone">
          {#if resolvedIcon.source === 'lucide'}
            <Icon name={resolvedIcon.value} size={28} />
          {:else if resolvedIcon.source === 'image'}
            <img src={resolvedIcon.value} alt="icon" class="pp-icon-lg" />
          {:else}
            <span class="pp-icon-emoji-lg">{resolvedIcon.value}</span>
          {/if}
        </div>
      {/if}

      <!-- Cover + properties layout -->
      <div class="pp-content" class:pp-has-cover={!!coverSrc}>
        {#if coverSrc}
          <div
            class="pp-cover"
            style:width="{coverDims.width}px"
            style:height={coverDims.height === 'auto' ? 'auto' : `${coverDims.height}px`}
            style:border-radius={coverDims.borderRadius}
          >
            <img
              src={coverSrc}
              alt="cover"
              class="pp-cover-img"
              style:border-radius={coverDims.borderRadius}
            />
          </div>
        {/if}

        <div class="pp-props-list">
          {#each properties as prop (prop.key)}
            <PropertyRow
              propertyKey={prop.key}
              propertyValue={prop.value}
              {frontmatter}
              onValueChange={handleValueChange}
              onDelete={handleDelete}
            />
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .pp-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .pp-body {
    flex: 1;
    overflow-y: auto;
  }
  .pp-banner {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  .pp-banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pp-icon-on-banner {
    position: absolute;
    bottom: -16px;
    left: 16px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background-primary);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  .pp-icon-standalone {
    padding: 12px 16px 4px;
    display: flex;
    align-items: center;
  }
  .pp-icon-lg {
    width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: 6px;
  }
  .pp-icon-emoji-lg {
    font-size: 28px;
    line-height: 1;
  }
  .pp-content {
    display: flex;
    gap: 12px;
    padding: 12px;
  }
  .pp-content.pp-has-cover {
    flex-direction: row;
  }
  .pp-content:not(.pp-has-cover) {
    flex-direction: column;
  }
  .pp-cover {
    flex-shrink: 0;
    overflow: hidden;
  }
  .pp-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .pp-props-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }
</style>
