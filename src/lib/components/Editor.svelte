<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let content: string = '';
  export let fileName: string = 'Untitled';
  
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    content = target.value;
    dispatch('change', { content });
  }
  
  function handleKeydown(event: KeyboardEvent) {
    // Tab key support
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      content = content.substring(0, start) + '  ' + content.substring(end);
      
      // Move cursor after inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }
</script>

<div class="editor-container">
  <div class="editor-header">
    <h3>✏️ {fileName}</h3>
    <div class="editor-actions">
      <span class="char-count">{content.length} characters</span>
    </div>
  </div>
  
  <textarea
    class="editor-textarea"
    bind:value={content}
    on:input={handleInput}
    on:keydown={handleKeydown}
    placeholder="Start writing in Markdown...

# Heading 1
## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

[[Wikilink to another note]]

```
Code block
```
"
    spellcheck="true"
  />
</div>

<style>
  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #1a1a1a;
  }
  
  .editor-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .editor-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .editor-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .char-count {
    font-size: 0.85rem;
    color: #666;
  }
  
  .editor-textarea {
    flex: 1;
    padding: 2rem;
    background: #1a1a1a;
    color: #e0e0e0;
    border: none;
    outline: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 1rem;
    line-height: 1.6;
    resize: none;
  }
  
  .editor-textarea::placeholder {
    color: #555;
  }
  
  .editor-textarea:focus {
    background: #1e1e1e;
  }
</style>
