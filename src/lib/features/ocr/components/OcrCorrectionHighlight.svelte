<script lang="ts">
  /**
   * OcrCorrectionHighlight — renders OCR words with confidence highlighting.
   *
   * Pure presentational component — no store imports.
   * Words with confidence < 0.7 receive amber underline styling.
   * Clicking a low-confidence word dispatches a wordFocus event.
   */
  import type { OcrWord } from '../types/ocr';

  export let words: OcrWord[] = [];
  export let onWordFocus: ((detail: { word: OcrWord; x: number; y: number }) => void) | undefined = undefined;

  function handleWordClick(e: MouseEvent, word: OcrWord) {
    if (word.confidence < 0.7) {
      onWordFocus?.({ word, x: e.clientX, y: e.clientY });
    }
  }

  function isLowConfidence(word: OcrWord): boolean {
    return word.confidence < 0.7;
  }
</script>

<span class="ocr-text" aria-label="OCR recognized text">
  {#each words as word, i}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span
      class="ocr-word"
      class:ocr-low-confidence={isLowConfidence(word)}
      title={isLowConfidence(word) ? `Low confidence: ${(word.confidence * 100).toFixed(0)}%` : undefined}
      on:click={(e) => handleWordClick(e, word)}
    >{word.text}</span>{#if i < words.length - 1}<span aria-hidden="true"> </span>{/if}
  {/each}
</span>

<style>
  .ocr-text {
    font-size: var(--font-ui-small, 13px);
    color: var(--text-normal, #cdd6f4);
    line-height: 1.6;
    font-family: var(--font-text);
  }

  .ocr-word {
    display: inline;
  }

  .ocr-low-confidence {
    text-decoration: underline;
    text-decoration-color: var(--color-warning, #f9e2af);
    text-decoration-style: wavy;
    text-underline-offset: 2px;
    cursor: pointer;
    background-color: rgba(249, 226, 175, 0.12);
    border-radius: 2px;
    padding: 0 1px;
  }

  .ocr-low-confidence:hover {
    background-color: rgba(249, 226, 175, 0.25);
  }
</style>
