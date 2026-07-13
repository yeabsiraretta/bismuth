<script lang="ts">
  import SettingRow from '@/ui/settings-controls.svelte';
  import type { LlmSettings, MediaSettings } from '@/hubs/core/types/settings';
  import {
    AMBIENT_SOUNDS,
    getCurrentAmbientSound,
    playAmbient,
    stopAmbient,
    type AmbientSound,
  } from '@/hubs/core/services/ambient-music-service';

  let {
    llm = $bindable(),
    media = $bindable(),
  }: {
    llm: LlmSettings;
    media: MediaSettings;
  } = $props();

  let ambientSound = $state<AmbientSound>(getCurrentAmbientSound());

  function handleAmbientChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as AmbientSound;
    ambientSound = value;
    if (!media.musicEnabled) return;
    if (value === 'none') stopAmbient();
    else playAmbient(value);
  }

  $effect(() => {
    if (!media.musicEnabled) {
      stopAmbient();
    }
  });
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">AI Assistant</h3>

    <SettingRow label="Enable AI" hint="Enable AI-powered features" id="llm-enabled">
      <input id="llm-enabled" type="checkbox" bind:checked={llm.llmEnabled} />
    </SettingRow>

    {#if llm.llmEnabled}
      <SettingRow label="Provider" hint="AI service provider" id="llm-provider">
        <select id="llm-provider" bind:value={llm.llmProvider}>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="ollama">Ollama</option>
          <option value="custom">Custom</option>
        </select>
      </SettingRow>

      <SettingRow label="API key" hint="Authentication key for the provider" id="llm-api-key">
        <input
          id="llm-api-key"
          type="password"
          style="width:200px"
          bind:value={llm.llmApiKey}
          placeholder="sk-…"
          autocomplete="off"
        />
      </SettingRow>

      <SettingRow label="API URL" hint="Base URL for the API endpoint" id="llm-api-url">
        <input
          id="llm-api-url"
          type="text"
          style="width:200px"
          bind:value={llm.llmApiUrl}
          placeholder="https://api.openai.com/v1"
        />
      </SettingRow>

      <SettingRow label="Model" hint="Model identifier to use" id="llm-model">
        <input
          id="llm-model"
          type="text"
          style="width:160px"
          bind:value={llm.llmModel}
          placeholder="gpt-4o-mini"
        />
      </SettingRow>

      <SettingRow
        label="Include note context"
        hint="Send current note content as context to the AI"
        id="llm-note-ctx"
      >
        <input id="llm-note-ctx" type="checkbox" bind:checked={llm.llmNoteContext} />
      </SettingRow>

      <SettingRow
        label="Max history"
        hint="Number of messages to keep in conversation"
        id="llm-history"
      >
        <div class="flex">
          <input
            id="llm-history"
            type="range"
            bind:value={llm.llmMaxHistory}
            min="5"
            max="100"
            step="5"
          />
          <span>{llm.llmMaxHistory}</span>
        </div>
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">OCR</h3>

    <SettingRow label="Enable OCR" hint="Extract text from images" id="ocr-enabled">
      <input id="ocr-enabled" type="checkbox" bind:checked={media.ocrEnabled} />
    </SettingRow>

    {#if media.ocrEnabled}
      <SettingRow label="Default language" hint="Primary language for OCR" id="ocr-lang">
        <input id="ocr-lang" type="text" style="width:80px" bind:value={media.ocrDefaultLanguage} />
      </SettingRow>

      <SettingRow label="LLM correction" hint="Use AI to improve OCR accuracy" id="ocr-llm">
        <input id="ocr-llm" type="checkbox" bind:checked={media.ocrLlmCorrection} />
      </SettingRow>

      {#if media.ocrLlmCorrection}
        <SettingRow
          label="Cloud LLM for OCR"
          hint="Use cloud-based AI for OCR correction (otherwise local only)"
          id="ocr-llm-cloud"
        >
          <input id="ocr-llm-cloud" type="checkbox" bind:checked={media.ocrLlmCloudEnabled} />
        </SettingRow>
      {/if}

      <SettingRow label="OCR model path" hint="Path to local Tesseract/OCR model" id="ocr-model">
        <input
          id="ocr-model"
          type="text"
          style="width:200px"
          bind:value={media.ocrModelPath}
          placeholder="/usr/share/tessdata"
        />
      </SettingRow>

      <SettingRow
        label="Amharic model path"
        hint="Path to Amharic-specific OCR model"
        id="ocr-amharic"
      >
        <input
          id="ocr-amharic"
          type="text"
          style="width:200px"
          bind:value={media.ocrAmharicModelPath}
          placeholder="Path to amh.traineddata"
        />
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Media</h3>

    <SettingRow
      label="Ambient sounds"
      hint="Play background sounds while writing"
      id="music-enabled"
    >
      <input id="music-enabled" type="checkbox" bind:checked={media.musicEnabled} />
    </SettingRow>

    {#if media.musicEnabled}
      <SettingRow label="Sound" hint="Choose an ambient sound" id="ambient-sound">
        <select id="ambient-sound" value={ambientSound} onchange={handleAmbientChange}>
          {#each AMBIENT_SOUNDS as s (s.id)}
            <option value={s.id}>{s.label}</option>
          {/each}
        </select>
      </SettingRow>
    {/if}

    <SettingRow label="Voice format" hint="Recording format for voice notes" id="voice-format">
      <select id="voice-format" bind:value={media.voiceFormat}>
        <option value="webm">WebM</option>
        <option value="ogg">OGG</option>
        <option value="mp3">MP3</option>
      </select>
    </SettingRow>

    <SettingRow label="Voice quality" hint="Audio recording quality" id="voice-quality">
      <select id="voice-quality" bind:value={media.voiceQuality}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </SettingRow>
  </section>
</div>
