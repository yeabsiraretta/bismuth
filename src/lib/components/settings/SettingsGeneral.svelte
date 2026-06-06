<script lang="ts">
  export let autoSave: boolean;
  export let autoSaveDelay: number;
  export let confirmBeforeDelete: boolean;
  export let defaultNoteLocation: string;
  export let dateFormat: string;
  export let timeFormat: string;
</script>

<div class="settings-section stack stack-md">
  <h3>General Settings</h3>

  <div class="setting-group">
    <h4>File Management</h4>

    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="default-location">Default Note Location</label>
      <input
        class="col-span-8"
        id="default-location"
        type="text"
        bind:value={defaultNoteLocation}
        placeholder="/"
      />
      <span class="setting-hint col-span-full">Folder path where new notes are created (relative to vault root)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={confirmBeforeDelete} />
        Confirm before deleting notes
      </label>
      <span class="setting-hint">Show confirmation dialog when deleting notes</span>
    </div>

    <div class="setting-item">
      <label for="file-name-template">New File Name Template</label>
      <input id="file-name-template" type="text" value="Untitled" disabled />
      <span class="setting-hint">Template for new note names (coming soon)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Auto-Save</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={autoSave} />
        Enable auto-save
      </label>
      <span class="setting-hint">Automatically save notes as you type</span>
    </div>

    {#if autoSave}
      <div class="setting-item">
        <label for="autosave-delay">Auto-save delay</label>
        <input
          id="autosave-delay"
          type="range"
          bind:value={autoSaveDelay}
          min="100"
          max="5000"
          step="100"
        />
        <span class="setting-value">{autoSaveDelay}ms</span>
        <span class="setting-hint">Time to wait after typing before saving</span>
      </div>
    {/if}
  </div>

  <div class="setting-group">
    <h4>Date & Time</h4>

    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="date-format">Date Format</label>
      <select class="col-span-8" id="date-format" bind:value={dateFormat}>
        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-05-27)</option>
        <option value="MM/DD/YYYY">MM/DD/YYYY (05/27/2026)</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY (27/05/2026)</option>
        <option value="MMMM D, YYYY">MMMM D, YYYY (May 27, 2026)</option>
      </select>
      <span class="setting-hint col-span-full">Format for displaying dates</span>
    </div>

    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="time-format">Time Format</label>
      <select class="col-span-8" id="time-format" bind:value={timeFormat}>
        <option value="24h">24-hour (13:30)</option>
        <option value="12h">12-hour (1:30 PM)</option>
      </select>
    </div>
  </div>

  <div class="setting-group">
    <h4>Startup</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Open last vault on startup
      </label>
      <span class="setting-hint">Automatically open the last used vault (coming soon)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Restore open notes
      </label>
      <span class="setting-hint">Reopen notes that were open when you closed (coming soon)</span>
    </div>
  </div>
</div>
