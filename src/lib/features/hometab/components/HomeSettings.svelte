<script lang="ts">
  import { homeSettings, updateHomeSettings } from '../stores/homeStore';
</script>

<div class="settings-section stack stack-md">
  <div class="section-header">
    <h3>Home Tab</h3>
    <p class="setting-hint">Configure what appears on the home tab.</p>
  </div>

  <div class="setting-group">
    <h4>Home Tab Content</h4>
    <div class="setting-item">
      <label>
        <input type="checkbox" checked={$homeSettings.replaceNewTab} on:change={() => updateHomeSettings({ replaceNewTab: !$homeSettings.replaceNewTab })} />
        Replace empty new tabs with Home Tab
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" checked={$homeSettings.showSearchBar} on:change={() => updateHomeSettings({ showSearchBar: !$homeSettings.showSearchBar })} />
        Show search bar
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" checked={$homeSettings.showBookmarks} on:change={() => updateHomeSettings({ showBookmarks: !$homeSettings.showBookmarks })} />
        Show bookmarked files
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" checked={$homeSettings.showRecentFiles} on:change={() => updateHomeSettings({ showRecentFiles: !$homeSettings.showRecentFiles })} />
        Show recent files
      </label>
    </div>
    {#if $homeSettings.showRecentFiles}
      <div class="setting-item">
        <label for="max-recent">Max recent files to display</label>
        <input
          id="max-recent"
          type="number"
          min="2"
          max="24"
          value={$homeSettings.maxRecentFiles}
          on:input={(e) => updateHomeSettings({ maxRecentFiles: parseInt((e.target as HTMLInputElement).value) || 8 })}
        />
      </div>
    {/if}
  </div>
</div>
