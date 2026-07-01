<script lang="ts">
  export let changelogAutoUpdate: boolean;
  export let changelogPath: string;
  export let changelogDatetimeFormat: string;
  export let changelogMaxFiles: number;
  export let changelogUseWikilinks: boolean;
  export let changelogHeading: string;
  export let changelogExcludedFolders: string;
</script>

<div class="settings-section stack stack-md">
  <h3>Changelog Settings</h3>

  <div class="setting-group">
    <h4>Behavior</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={changelogAutoUpdate} />
        Auto-update changelog on file changes
      </label>
      <span class="setting-hint"
        >Automatically append entries when notes are created or modified</span
      >
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={changelogUseWikilinks} />
        Use wikilinks for note names
      </label>
      <span class="setting-hint">Wrap note names in [[ ]] instead of plain text</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>File</h4>

    <div class="setting-item">
      <label for="changelog-path">Changelog file path</label>
      <input
        id="changelog-path"
        type="text"
        bind:value={changelogPath}
        placeholder="Changelog.md"
      />
      <span class="setting-hint"
        >Path relative to vault root where changelog entries are written</span
      >
    </div>

    <div class="setting-item">
      <label for="changelog-heading">Heading text</label>
      <input
        id="changelog-heading"
        type="text"
        bind:value={changelogHeading}
        placeholder="(leave blank for no heading)"
      />
      <span class="setting-hint">Optional section heading inserted before each entry group</span>
    </div>

    <div class="setting-item">
      <label for="changelog-max-files">Max entries</label>
      <input
        id="changelog-max-files"
        type="number"
        bind:value={changelogMaxFiles}
        min="5"
        max="200"
        step="1"
      />
      <span class="setting-hint">Maximum number of entries to keep (5 – 200)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Format</h4>

    <div class="setting-item">
      <label for="changelog-datetime-format">Date/time format</label>
      <input
        id="changelog-datetime-format"
        type="text"
        bind:value={changelogDatetimeFormat}
        placeholder="YYYY-MM-DDTHH:mm"
      />
      <span class="setting-hint">Moment.js-compatible format string, e.g. YYYY-MM-DDTHH:mm</span>
    </div>

    <div class="setting-item">
      <label for="changelog-excluded-folders">Excluded folders</label>
      <input
        id="changelog-excluded-folders"
        type="text"
        bind:value={changelogExcludedFolders}
        placeholder=".backups, templates"
      />
      <span class="setting-hint">Comma-separated folder paths to ignore when recording changes</span
      >
    </div>
  </div>
</div>
