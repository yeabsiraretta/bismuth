<script lang="ts">
  import SettingRow from '@/ui/settings-controls.svelte';
  import type {
    GeneralSettings,
    PerformanceSettings,
    UpdateSettings,
  } from '@/hubs/core/types/settings';

  let {
    general = $bindable(),
    updates = $bindable(),
    performance = $bindable(),
  }: {
    general: GeneralSettings;
    updates: UpdateSettings;
    performance: PerformanceSettings;
  } = $props();

  if (!general.homepage) {
    general.homepage = { option: 'last-opened', specificNotePath: '' };
  }
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Language</h3>
    <SettingRow label="App Language" hint="More languages coming soon" id="app-language">
      <select id="app-language" bind:value={general.language}>
        <option value="en">English</option>
      </select>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Startup</h3>
    <SettingRow label="Homepage" hint="What to show when opening the vault" id="homepage-option">
      <select id="homepage-option" bind:value={general.homepage.option}>
        <option value="homepage">Homepage dashboard</option>
        <option value="last-opened">Last opened note</option>
        <option value="daily-note">Daily note</option>
        <option value="specific-note">Specific note</option>
        <option value="empty">Empty editor</option>
      </select>
    </SettingRow>

    {#if general.homepage.option === 'specific-note'}
      <SettingRow label="Note path" hint="Relative path to the note" id="homepage-path">
        <input
          id="homepage-path"
          type="text"
          style="width:160px"
          bind:value={general.homepage.specificNotePath}
          placeholder="path/to/note.md"
        />
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Saving</h3>
    <SettingRow label="Auto-save" hint="Automatically save notes after editing" id="auto-save">
      <input id="auto-save" type="checkbox" bind:checked={general.autoSave} />
    </SettingRow>

    <SettingRow
      label="Auto-save delay"
      hint="Milliseconds to wait before saving"
      id="auto-save-delay"
    >
      <div class="flex">
        <input
          id="auto-save-delay"
          type="range"
          bind:value={general.autoSaveDelay}
          min="200"
          max="5000"
          step="100"
        />
        <span>{general.autoSaveDelay}ms</span>
      </div>
    </SettingRow>

    <SettingRow
      label="Confirm before delete"
      hint="Show confirmation dialog when deleting notes"
      id="confirm-delete"
    >
      <input id="confirm-delete" type="checkbox" bind:checked={general.confirmBeforeDelete} />
    </SettingRow>

    <SettingRow
      label="New file name"
      hint="Default title for newly created notes"
      id="new-file-name"
    >
      <input
        id="new-file-name"
        type="text"
        style="width:128px"
        bind:value={general.newFileNameTemplate}
      />
    </SettingRow>

    <SettingRow
      label="Default note location"
      hint="Folder for new notes (blank = vault root)"
      id="default-note-loc"
    >
      <input
        id="default-note-loc"
        type="text"
        style="width:160px"
        bind:value={general.defaultNoteLocation}
        placeholder="e.g. Notes/Inbox"
      />
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Date &amp; Time</h3>
    <SettingRow label="Date format" hint="Date format string (date-fns)" id="date-format">
      <input id="date-format" type="text" style="width:128px" bind:value={general.dateFormat} />
    </SettingRow>

    <SettingRow label="Time format" hint="12h or 24h" id="time-format">
      <select id="time-format" bind:value={general.timeFormat}>
        <option value="24h">24-hour</option>
        <option value="12h">12-hour</option>
      </select>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Updates</h3>
    <SettingRow
      label="Check for updates on startup"
      hint="Silently checks for available updates"
      id="auto-updates"
    >
      <input id="auto-updates" type="checkbox" bind:checked={updates.autoCheckUpdates} />
    </SettingRow>

    <SettingRow label="Update channel" hint="Which releases to check for" id="update-channel">
      <select id="update-channel" bind:value={updates.updateChannel}>
        <option value="release">Release</option>
        <option value="beta">Beta</option>
        <option value="alpha">Alpha</option>
      </select>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Performance</h3>
    <SettingRow
      label="Slow startup threshold"
      hint="Show a notification if startup takes longer"
      id="startup-threshold"
    >
      <div class="flex">
        <input
          id="startup-threshold"
          type="range"
          bind:value={performance.startupThresholdMs}
          min="1000"
          max="10000"
          step="500"
        />
        <span>{performance.startupThresholdMs / 1000}s</span>
      </div>
    </SettingRow>

    <SettingRow
      label="Lazy-load extensions"
      hint="Load editor extensions on demand for faster startup"
      id="lazy-ext"
    >
      <input id="lazy-ext" type="checkbox" bind:checked={performance.lazyLoadExtensions} />
    </SettingRow>
  </section>
</div>
