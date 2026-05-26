<script lang="ts">
  import Sidebar from './lib/components/Sidebar.svelte';
  import Editor from './lib/components/Editor.svelte';
  import Welcome from './lib/components/Welcome.svelte';
  
  interface Note {
    name: string;
    path: string;
    content: string;
  }
  
  let notes: Note[] = [
    {
      name: 'Welcome.md',
      path: 'welcome',
      content: `# Welcome to Bismuth

This is your first note! 

## Features

- **Markdown Support**: Write in plain Markdown
- **Wikilinks**: Link notes with [[Note Name]]
- **Local-First**: All data stays on your computer

## Getting Started

1. Create new notes with the + button
2. Edit this note to see live updates
3. Use Markdown for formatting

## Markdown Examples

### Text Formatting
**Bold text** and *italic text*

### Lists
- Item 1
- Item 2
- Item 3

### Code
\`\`\`javascript
console.log('Hello, Bismuth!');
\`\`\`

### Links
[[Another Note]] - Create wikilinks like this

---

Start building your knowledge base! 🚀`
    }
  ];
  
  let currentNotePath: string | null = 'welcome';
  let currentNote: Note | null = notes[0];
  let noteCounter = 1;
  
  function handleSelectFile(event: CustomEvent<{ path: string }>) {
    const note = notes.find(n => n.path === event.detail.path);
    if (note) {
      currentNotePath = note.path;
      currentNote = note;
    }
  }
  
  function handleCreateNote() {
    noteCounter++;
    const newNote: Note = {
      name: `Note ${noteCounter}.md`,
      path: `note-${noteCounter}`,
      content: `# Note ${noteCounter}

Start writing here...
`
    };
    
    notes = [...notes, newNote];
    currentNotePath = newNote.path;
    currentNote = newNote;
  }
  
  function handleEditorChange(event: CustomEvent<{ content: string }>) {
    if (currentNote) {
      currentNote.content = event.detail.content;
      // Update the note in the array
      notes = notes.map(n => 
        n.path === currentNote?.path 
          ? { ...n, content: event.detail.content }
          : n
      );
    }
  }
  
  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      handleCreateNote();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<main class="app">
  <Sidebar 
    files={notes}
    currentFile={currentNotePath}
    on:select={handleSelectFile}
    on:create={handleCreateNote}
  />
  
  {#if currentNote}
    <Editor 
      bind:content={currentNote.content}
      fileName={currentNote.name}
      on:change={handleEditorChange}
    />
  {:else}
    <Welcome on:create={handleCreateNote} />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    background-color: #1a1a1a;
    color: rgba(255, 255, 255, 0.87);
    overflow: hidden;
  }
  
  :global(*) {
    box-sizing: border-box;
  }

  .app {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
</style>
