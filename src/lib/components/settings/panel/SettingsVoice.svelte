<script lang="ts">
  export let voiceFormat: 'webm' | 'ogg' | 'mp3';
  export let voiceQuality: 'low' | 'medium' | 'high';
</script>

<div class="settings-section stack stack-md">
  <h3>Voice Recorder Settings</h3>

  <div class="setting-group">
    <h4>Recording Format</h4>

    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="voice-format">Audio format</label>
      <select class="col-span-8" id="voice-format" bind:value={voiceFormat}>
        <option value="webm">WebM (default, smaller files)</option>
        <option value="ogg">OGG (open format, wide support)</option>
        <option value="mp3">MP3 (universal playback)</option>
      </select>
      <span class="setting-hint col-span-full">
        Container format for recorded audio files.
        WebM is recommended for best browser compatibility.
      </span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Recording Quality</h4>

    <div class="setting-item grid grid-cols-12 gap-sm items-center">
      <label class="col-span-4" for="voice-quality">Quality</label>
      <select class="col-span-8" id="voice-quality" bind:value={voiceQuality}>
        <option value="low">Low — 64 kbps, smallest files</option>
        <option value="medium">Medium — 128 kbps, balanced</option>
        <option value="high">High — 256 kbps, best clarity</option>
      </select>
      <span class="setting-hint col-span-full">
        Higher quality produces larger files. Medium is recommended for voice memos.
      </span>
    </div>
  </div>
</div>
