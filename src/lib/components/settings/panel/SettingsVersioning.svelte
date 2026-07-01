<script lang="ts">
  export let versioningEnabled: boolean;
  export let versionRetentionCount: number;
  export let versioningLlmClassify: boolean;
</script>

<div class="setting-group">
  <h4>Knowledge Versioning</h4>

  <div class="setting-item">
    <label>
      <input type="checkbox" bind:checked={versioningEnabled} />
      Enable version history
    </label>
    <span class="setting-hint"
      >Save a diff snapshot on each note save; view history in the Version History panel</span
    >
  </div>

  {#if versioningEnabled}
    <div class="setting-item">
      <label for="version-retention">Retention count</label>
      <input
        id="version-retention"
        type="number"
        bind:value={versionRetentionCount}
        min="5"
        max="500"
        step="5"
      />
      <span class="setting-hint">Maximum number of version snapshots kept per note (5–500)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={versioningLlmClassify} />
        LLM bump classification
      </label>
      <span class="setting-hint"
        >Use the AI agent (spec 040) to override the auto-detected semver bump type — requires AI
        Agent enabled</span
      >
    </div>
  {/if}
</div>
