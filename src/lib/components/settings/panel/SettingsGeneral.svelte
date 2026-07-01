<script lang="ts">
  import { homepageConfig, type HomepageOption } from '@/stores/settings/homepage';

  export let autoSave: boolean;
  export let autoSaveDelay: number;
  export let confirmBeforeDelete: boolean;
  export let defaultNoteLocation: string;
  export let dateFormat: string;
  export let timeFormat: string;
  export let newFileNameTemplate: string;
  export let language: string = 'en';
  export let autoCheckUpdates: boolean = false;
  export let updateChannel: 'alpha' | 'beta' | 'release' = 'release';
  export let startupThresholdMs: number = 4000;

  let homepageOption: HomepageOption;
  let specificNotePath: string;

  homepageConfig.subscribe((cfg) => {
    homepageOption = cfg.option;
    specificNotePath = cfg.specificNotePath || '';
  });

  function handleHomepageChange() {
    homepageConfig.setOption(homepageOption);
  }

  function handleSpecificNoteChange() {
    homepageConfig.setSpecificNote(specificNotePath);
  }
</script>

<div class="settings-section stack stack-md">
  <h3>General Settings</h3>

  <div class="setting-group">
    <h4>Language</h4>
    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="app-language">App Language</label>
      <select class="col-span-8" id="app-language" bind:value={language}>
        <option value="en">English</option>
      </select>
      <span class="setting-hint col-span-full">More languages coming soon</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Updates</h4>
    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={autoCheckUpdates} />
        Check for updates on startup
      </label>
      <span class="setting-hint">Silently checks for available updates when Bismuth opens</span>
    </div>
    <div class="setting-item">
      <label for="update-channel">Update channel</label>
      <select id="update-channel" bind:value={updateChannel}>
        <option value="release">Release — stable builds only</option>
        <option value="beta">Beta — pre-release builds</option>
        <option value="alpha">Alpha — experimental builds</option>
      </select>
      <span class="setting-hint">Which releases to check for when updates are enabled</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Performance</h4>
    <div class="setting-item">
      <label for="startup-threshold">Slow startup threshold</label>
      <input id="startup-threshold" type="range" bind:value={startupThresholdMs} min="1000" max="10000" step="500" />
      <span class="setting-value">{startupThresholdMs / 1000}s</span>
      <span class="setting-hint">Show a notification if startup takes longer than this</span>
    </div>
  </div>

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
      <input id="file-name-template" type="text" bind:value={newFileNameTemplate} placeholder={"Untitled {date}"} />
      <span class="setting-hint">Tokens: {'{date}'}, {'{time}'}, {'{title}'} — e.g. "Note {'{date}'}"</span>
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
    <h4>Homepage</h4>

    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="homepage-option">On startup, open</label>
      <select class="col-span-8" id="homepage-option" bind:value={homepageOption} on:change={handleHomepageChange}>
        <option value="last-opened">Last opened note</option>
        <option value="home">Home tab</option>
        <option value="graph">Graph view</option>
        <option value="random">Random note</option>
        <option value="specific">Specific note</option>
        <option value="daily">Daily note</option>
      </select>
      <span class="setting-hint col-span-full">Choose what to show when you open the vault</span>
    </div>

    {#if homepageOption === 'specific'}
      <div class="setting-item grid grid-cols-12 gap-sm items-center">
        <label class="col-span-4" for="homepage-note-path">Note path</label>
        <input
          class="col-span-8"
          id="homepage-note-path"
          type="text"
          bind:value={specificNotePath}
          on:change={handleSpecificNoteChange}
          placeholder="path/to/note.md"
        />
        <span class="setting-hint col-span-full">Relative path to the note within the vault</span>
      </div>
    {/if}
  </div>
</div>
