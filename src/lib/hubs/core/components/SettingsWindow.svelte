<script lang="ts">
  import SettingRow from '@/ui/settings-controls.svelte';
  import type { WindowSettings } from '@/hubs/core/types/settings';

  let {
    window: windowSettings = $bindable(),
  }: {
    window: WindowSettings;
  } = $props();
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Window Behavior</h3>

    <SettingRow
      label="Start in fullscreen"
      hint="Automatically enter fullscreen mode when the app launches"
      id="start-fullscreen"
    >
      <input id="start-fullscreen" type="checkbox" bind:checked={windowSettings.startFullscreen} />
    </SettingRow>

    <SettingRow
      label="Restore window size"
      hint="Remember the window size from the last session"
      id="restore-size"
    >
      <input id="restore-size" type="checkbox" bind:checked={windowSettings.restoreLastSize} />
    </SettingRow>

    <SettingRow
      label="Restore window position"
      hint="Remember the window position from the last session"
      id="restore-position"
    >
      <input
        id="restore-position"
        type="checkbox"
        bind:checked={windowSettings.restoreLastPosition}
      />
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">System Tray</h3>

    <SettingRow
      label="Close to tray"
      hint="Keep the app running in the system tray when the window is closed"
      id="close-to-tray"
    >
      <input id="close-to-tray" type="checkbox" bind:checked={windowSettings.closeToTray} />
    </SettingRow>

    <SettingRow
      label="Minimize to tray"
      hint="Move the app to the system tray when minimized instead of the dock"
      id="minimize-to-tray"
    >
      <input id="minimize-to-tray" type="checkbox" bind:checked={windowSettings.minimizeToTray} />
    </SettingRow>
  </section>
</div>
