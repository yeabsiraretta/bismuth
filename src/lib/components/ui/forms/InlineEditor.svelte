<script lang="ts">
  export let value: string = '';
  export let isEditing: boolean = false;
  export let onChange: (v: string) => void = () => {};
  export let multiline: boolean = false;
  export let ariaLabel: string;
</script>

{#if isEditing}
  <div class="inline-editor-wrapper" role="form" aria-label={ariaLabel}>
    {#if multiline}
      <div class="auto-resize">
        <textarea
          class="inline-input bismuth-body"
          aria-label={ariaLabel}
          {value}
          data-value={value}
          on:input={(e) => {
            const v = (e.target as HTMLTextAreaElement).value;
            (e.target as HTMLTextAreaElement).parentElement?.setAttribute('data-value', v);
            onChange(v);
          }}
        ></textarea>
      </div>
    {:else}
      <input
        class="inline-input bismuth-body"
        type="text"
        aria-label={ariaLabel}
        {value}
        on:input={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    {/if}
  </div>
{:else}
  <span class="inline-read bismuth-body">{value || ' '}</span>
{/if}

<style>
  .inline-editor-wrapper {
    display: block;
    width: 100%;
  }

  .inline-input {
    all: unset;
    display: block;
    width: 100%;
    box-sizing: border-box;
    color: var(--text-normal);
    caret-color: var(--interactive-accent);
    padding: 2px 4px;
    border-radius: var(--radius-xs, 2px);
    border: 1px solid var(--border-color);
    background: var(--background-primary);
  }

  .inline-input:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 1px;
  }

  .auto-resize {
    display: grid;
    width: 100%;
  }

  .auto-resize::after {
    content: attr(data-value) ' ';
    white-space: pre-wrap;
    visibility: hidden;
    grid-area: 1 / 1 / 2 / 2;
    word-break: break-word;
    padding: 2px 4px;
  }

  .auto-resize > textarea {
    grid-area: 1 / 1 / 2 / 2;
    resize: none;
    overflow: hidden;
    min-height: 1.5em;
  }

  .inline-read {
    display: block;
    padding: 2px 4px;
    color: var(--text-normal);
    word-break: break-word;
    min-height: 1.5em;
  }
</style>
