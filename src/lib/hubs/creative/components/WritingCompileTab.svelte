<script lang="ts">
  import { compileScenes } from '@/hubs/creative/services/writing-service';
  import type { SceneNode } from '@/hubs/creative/types/writing-types';
  import { DEFAULT_COMPILE_WORKFLOW } from '@/hubs/creative/types/writing-types';

  interface Props {
    scenes: SceneNode[];
  }

  let { scenes }: Props = $props();

  let compileOutput = $state('');

  function handleCompile() {
    if (!scenes.length) return;
    const contents = new Map<string, string>(scenes.map((s) => [s.id, s.synopsis ?? '']));
    const result = compileScenes(scenes, contents, DEFAULT_COMPILE_WORKFLOW);
    compileOutput = result.text;
  }
</script>

<div class="wr-section">
  <div class="wr-section-header">
    <h2 class="wr-section-title">Compile Manuscript</h2>
    <button class="wr-btn wr-btn-primary" onclick={handleCompile} disabled={scenes.length === 0}
      >Compile</button
    >
  </div>
  <p class="wr-meta">
    Compiles all non-excluded scenes into a single manuscript using the default workflow (strip
    frontmatter → concatenate with separators).
  </p>
  {#if compileOutput}
    <div class="wr-compile-output">
      <pre>{compileOutput}</pre>
    </div>
  {/if}
</div>

<style>
  .wr-section {
    margin-bottom: 24px;
  }
  .wr-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .wr-section-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .wr-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.72rem;
    cursor: pointer;
    transition: all var(--transition-base);
  }
  .wr-btn:hover {
    border-color: var(--color-accent);
  }
  .wr-btn-primary {
    background: var(--color-accent);
    color: var(--color-background);
    border-color: var(--color-accent);
  }
  .wr-meta {
    font-size: 0.68rem;
    color: var(--color-text-muted);
  }
  .wr-compile-output {
    margin-top: 12px;
    padding: 12px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-s);
    max-height: 400px;
    overflow-y: auto;
  }
  .wr-compile-output pre {
    font-size: 0.72rem;
    white-space: pre-wrap;
    color: var(--color-text);
    margin: 0;
  }
</style>
