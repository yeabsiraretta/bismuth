<script lang="ts">
  import type { KnowledgeSettings } from '@/hubs/core/types/settings';
  import SettingRow from '@/ui/settings-controls.svelte';

  let {
    knowledge = $bindable(),
  }: {
    knowledge: KnowledgeSettings;
  } = $props();
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Topic Linking</h3>

    <SettingRow
      label="Enable topic linking"
      hint="Detect unlinked mentions of note titles in your content"
      id="kn-topic-enabled"
    >
      <input id="kn-topic-enabled" type="checkbox" bind:checked={knowledge.topicLinkingEnabled} />
    </SettingRow>

    {#if knowledge.topicLinkingEnabled}
      <SettingRow
        label="Minimum title length"
        hint="Shortest title to match (characters)"
        id="kn-topic-min-len"
      >
        <div class="flex">
          <input
            id="kn-topic-min-len"
            type="range"
            bind:value={knowledge.topicLinkMinTitleLength}
            min="2"
            max="8"
            step="1"
          />
          <span>{knowledge.topicLinkMinTitleLength} chars</span>
        </div>
      </SettingRow>

      <SettingRow
        label="Case-sensitive matching"
        hint="Require exact case when detecting mentions"
        id="kn-topic-case"
      >
        <input id="kn-topic-case" type="checkbox" bind:checked={knowledge.topicLinkCaseSensitive} />
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Writing</h3>

    <SettingRow label="Daily word goal" hint="Target word count per day" id="kn-writing-goal">
      <div class="flex">
        <input
          id="kn-writing-goal"
          type="range"
          bind:value={knowledge.writingDailyGoal}
          min="100"
          max="5000"
          step="100"
        />
        <span>{knowledge.writingDailyGoal} words</span>
      </div>
    </SettingRow>

    <SettingRow label="Sprint duration" hint="Minutes per writing sprint" id="kn-writing-sprint">
      <div class="flex">
        <input
          id="kn-writing-sprint"
          type="range"
          bind:value={knowledge.writingSprintDuration}
          min="5"
          max="90"
          step="5"
        />
        <span>{knowledge.writingSprintDuration} min</span>
      </div>
    </SettingRow>

    <SettingRow
      label="Auto-save during writing"
      hint="Save automatically while in a writing session"
      id="kn-writing-autosave"
    >
      <input id="kn-writing-autosave" type="checkbox" bind:checked={knowledge.writingAutoSave} />
    </SettingRow>
  </section>
</div>
