<script lang="ts">
  import { marked } from 'marked';
  import { onMount } from 'svelte';

  export let content: string = '';
  export let onContentChange: ((newContent: string) => void) | undefined = undefined;
  export let onWikilinkClick: ((target: string) => void) | undefined = undefined;

  let previewContainer: HTMLDivElement;
  let isEditing = false;
  let editingElement: HTMLElement | null = null;
  let originalContent = '';

  // Configure marked for wikilinks
  const renderer = new marked.Renderer();

  renderer.text = (text: string) => {
    return text.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_match: string, target: string, alias: string) => {
        const displayText = alias || target;
        return `<a href="#" class="wikilink" data-target="${target}" contenteditable="false">${displayText}</a>`;
      }
    );
  };

  marked.setOptions({
    renderer,
    breaks: true,
    gfm: true,
  });

  let previewHtml = '';

  $: {
    try {
      previewHtml = marked(content || '');
    } catch (error) {
      console.error('Markdown parsing error:', error);
      previewHtml = '<p>Error rendering markdown</p>';
    }
  }

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Handle wikilink clicks
    if (target.classList.contains('wikilink')) {
      event.preventDefault();
      const wikilinkTarget = target.getAttribute('data-target');
      if (wikilinkTarget && onWikilinkClick) {
        onWikilinkClick(wikilinkTarget);
      }
      return;
    }

    // Make element editable on click
    if (!isEditing && target !== previewContainer) {
      startEditing(target);
    }
  }

  function startEditing(element: HTMLElement) {
    // Don't edit wikilinks or code blocks directly
    if (element.classList.contains('wikilink') || element.tagName === 'CODE') {
      return;
    }

    // Find the closest editable element (p, h1-h6, li, etc.)
    const editableElement = findEditableElement(element);
    if (!editableElement) return;

    isEditing = true;
    editingElement = editableElement;
    originalContent = editableElement.textContent || '';

    // Make contenteditable
    editableElement.setAttribute('contenteditable', 'true');
    editableElement.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(editableElement);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Add editing class for styling
    editableElement.classList.add('editing');
  }

  function findEditableElement(element: HTMLElement): HTMLElement | null {
    // List of editable element types
    const editableTypes = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'TD', 'TH'];

    let current: HTMLElement | null = element;
    while (current && current !== previewContainer) {
      if (editableTypes.includes(current.tagName)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function handleBlur() {
    if (!isEditing || !editingElement) return;

    const newText = editingElement.textContent || '';

    // Remove contenteditable
    editingElement.removeAttribute('contenteditable');
    editingElement.classList.remove('editing');

    // Update content if changed
    if (newText !== originalContent) {
      updateMarkdownContent(editingElement, newText);
    }

    isEditing = false;
    editingElement = null;
  }

  function updateMarkdownContent(element: HTMLElement, newText: string) {
    // Reconstruct markdown from the edited element
    const tagName = element.tagName;
    let newMarkdown = '';

    switch (tagName) {
      case 'H1':
        newMarkdown = `# ${newText}`;
        break;
      case 'H2':
        newMarkdown = `## ${newText}`;
        break;
      case 'H3':
        newMarkdown = `### ${newText}`;
        break;
      case 'H4':
        newMarkdown = `#### ${newText}`;
        break;
      case 'H5':
        newMarkdown = `##### ${newText}`;
        break;
      case 'H6':
        newMarkdown = `###### ${newText}`;
        break;
      case 'P':
        newMarkdown = newText;
        break;
      case 'LI':
        // Preserve list type
        const isList = element.parentElement?.tagName === 'OL';
        newMarkdown = isList ? `1. ${newText}` : `- ${newText}`;
        break;
      case 'BLOCKQUOTE':
        newMarkdown = `> ${newText}`;
        break;
      default:
        newMarkdown = newText;
    }

    // Find and replace in original content
    // This is a simplified approach - for production, you'd want more sophisticated parsing
    const lines = content.split('\n');
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const cleanOriginal = originalContent.trim();

      if (
        line.includes(cleanOriginal) ||
        cleanOriginal.includes(
          line
            .replace(/^#+\s*/, '')
            .replace(/^[-*]\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^>\s*/, '')
        )
      ) {
        lines[i] = newMarkdown;
        found = true;
        break;
      }
    }

    if (found && onContentChange) {
      onContentChange(lines.join('\n'));
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isEditing || !editingElement) return;

    // Save on Enter (for single-line elements)
    if (event.key === 'Enter' && !event.shiftKey) {
      const tagName = editingElement.tagName;
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
        event.preventDefault();
        editingElement.blur();
      }
    }

    // Cancel on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      if (editingElement) {
        editingElement.textContent = originalContent;
        editingElement.blur();
      }
    }
  }

  onMount(() => {
    // Add global keydown listener
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div
  class="editable-markdown-preview"
  bind:this={previewContainer}
  on:click={handleClick}
  on:blur={handleBlur}
  role="article"
  tabindex="0"
>
  {@html previewHtml}

  {#if !content}
    <p class="placeholder">Click to start writing...</p>
  {/if}
</div>

<style>
  .editable-markdown-preview {
    padding: var(--spacing-l);
    max-width: 800px;
    margin: 0 auto;
    color: var(--text-primary);
    line-height: 1.6;
    cursor: text;
    min-height: 100%;
  }

  .editable-markdown-preview:focus {
    outline: none;
  }

  .placeholder {
    color: var(--text-muted);
    font-style: italic;
  }

  /* Editable element styling */
  .editable-markdown-preview :global(.editing) {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: var(--radius-xs);
    background-color: var(--background-modifier-hover);
    padding: 2px 4px;
    margin: -2px -4px;
  }

  /* Hover effect for editable elements */
  .editable-markdown-preview :global(p:hover),
  .editable-markdown-preview :global(h1:hover),
  .editable-markdown-preview :global(h2:hover),
  .editable-markdown-preview :global(h3:hover),
  .editable-markdown-preview :global(h4:hover),
  .editable-markdown-preview :global(h5:hover),
  .editable-markdown-preview :global(h6:hover),
  .editable-markdown-preview :global(li:hover),
  .editable-markdown-preview :global(blockquote:hover) {
    background-color: var(--background-modifier-hover);
    border-radius: var(--radius-xs);
    padding: 2px 4px;
    margin: -2px -4px;
    cursor: text;
  }

  .editable-markdown-preview :global(h1) {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-top: var(--spacing-xl);
    margin-bottom: var(--spacing-m);
    color: var(--text-primary);
    border-bottom: 2px solid var(--background-modifier-border);
    padding-bottom: var(--spacing-s);
  }

  .editable-markdown-preview :global(h2) {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-m);
    color: var(--text-primary);
  }

  .editable-markdown-preview :global(h3) {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-top: var(--spacing-m);
    margin-bottom: var(--spacing-s);
    color: var(--text-primary);
  }

  .editable-markdown-preview :global(p) {
    margin-bottom: var(--spacing-m);
  }

  .editable-markdown-preview :global(ul),
  .editable-markdown-preview :global(ol) {
    margin-bottom: var(--spacing-m);
    padding-left: var(--spacing-xl);
  }

  .editable-markdown-preview :global(li) {
    margin-bottom: var(--spacing-xs);
  }

  .editable-markdown-preview :global(code) {
    background-color: var(--background-secondary);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
  }

  .editable-markdown-preview :global(pre) {
    background-color: var(--background-secondary);
    padding: var(--spacing-m);
    border-radius: var(--radius-s);
    overflow-x: auto;
    margin-bottom: var(--spacing-m);
  }

  .editable-markdown-preview :global(pre code) {
    background: none;
    padding: 0;
  }

  .editable-markdown-preview :global(blockquote) {
    border-left: 4px solid var(--accent-primary);
    padding-left: var(--spacing-m);
    margin-left: 0;
    margin-bottom: var(--spacing-m);
    color: var(--text-muted);
    font-style: italic;
  }

  .editable-markdown-preview :global(a) {
    color: var(--accent-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .editable-markdown-preview :global(a:hover) {
    color: var(--accent-hover);
    text-decoration: underline;
  }

  .editable-markdown-preview :global(.wikilink) {
    color: var(--accent-primary);
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
    user-select: none;
  }

  .editable-markdown-preview :global(.wikilink:hover) {
    color: var(--accent-hover);
    background-color: var(--background-modifier-hover);
    padding: 2px 4px;
    border-radius: var(--radius-xs);
  }

  .editable-markdown-preview :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: var(--spacing-m);
  }

  .editable-markdown-preview :global(th),
  .editable-markdown-preview :global(td) {
    border: 1px solid var(--background-modifier-border);
    padding: var(--spacing-s);
    text-align: left;
  }

  .editable-markdown-preview :global(th) {
    background-color: var(--background-secondary);
    font-weight: 600;
  }

  .editable-markdown-preview :global(td:hover),
  .editable-markdown-preview :global(th:hover) {
    background-color: var(--background-modifier-hover);
  }

  .editable-markdown-preview :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-s);
    margin: var(--spacing-m) 0;
  }

  .editable-markdown-preview :global(hr) {
    border: none;
    border-top: 2px solid var(--background-modifier-border);
    margin: var(--spacing-xl) 0;
  }

  /* Selection styling */
  .editable-markdown-preview :global([contenteditable='true']) {
    caret-color: var(--accent-primary);
  }

  .editable-markdown-preview :global([contenteditable='true']::selection) {
    background-color: var(--accent-primary);
    color: white;
  }
</style>
