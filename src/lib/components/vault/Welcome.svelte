<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  function createFirstNote() {
    dispatch('create');
  }
</script>

<div class="welcome">
  <div class="welcome-content">
    <h1>🔷 Welcome to Bismuth</h1>
    <p class="tagline">Your local-first Personal Knowledge Management system</p>
    
    <div class="features">
      <div class="feature">
        <span class="icon">📁</span>
        <h3>Johnny.Decimal</h3>
        <p>Organized file structure with decimal notation</p>
      </div>
      
      <div class="feature">
        <span class="icon">🔗</span>
        <h3>Zettelkasten</h3>
        <p>Atomic notes with powerful wikilinks</p>
      </div>
      
      <div class="feature">
        <span class="icon">🧠</span>
        <h3>Smart Search</h3>
        <p>Full-text search across all your notes</p>
      </div>
    </div>
    
    <button class="btn-primary" on:click={createFirstNote}>
      Create Your First Note
    </button>
    
    <p class="hint">Or press <kbd>Cmd+N</kbd> (Mac) / <kbd>Ctrl+N</kbd> (Windows/Linux)</p>
  </div>
</div>

<style>
  .welcome {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    height: 100vh;
  }
  
  .welcome-content {
    max-width: 600px;
    text-align: center;
    padding: 2rem;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #fff;
  }
  
  .tagline {
    font-size: 1.1rem;
    color: #999;
    margin-bottom: 3rem;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .feature {
    padding: 1.5rem;
    background: #242424;
    border-radius: 8px;
    border: 1px solid #333;
  }
  
  .icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .feature h3 {
    font-size: 1rem;
    margin: 0.5rem 0;
    color: #fff;
  }
  
  .feature p {
    font-size: 0.85rem;
    color: #888;
    margin: 0;
  }
  
  .btn-primary {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    background: #646cff;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
  }
  
  .btn-primary:hover {
    background: #535bf2;
    transform: translateY(-2px);
  }
  
  .hint {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  kbd {
    padding: 0.2rem 0.5rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
  }
</style>
