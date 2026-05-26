<script lang="ts">
  /**
   * Main application component for Bismuth PKM Editor
   *
   * This is the root component that initializes the application
   * and manages the overall application state.
   *
   * @component
   */

  /**
   * Demo counter state
   * @type {number}
   */
  let count = 0;

  /**
   * Increments the counter by 1
   * @returns {void}
   */
  function increment(): void {
    count += 1;
  }
</script>

<main>
  <div class="container">
    <h1>Bismuth PKM Editor</h1>
    <p>Welcome to Bismuth - Your local-first knowledge management system</p>

    <div class="card">
      <button on:click={increment}>
        Count is {count}
      </button>
      <p>Click the button to test Svelte reactivity</p>
    </div>

    <p class="read-the-docs">Development environment ready. Begin implementing features.</p>
  </div>
</main>

<style>
  :root {
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;

    color-scheme: light dark;
    color: rgba(255, 255, 255, 0.87);
    background-color: #242424;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
  }

  .container {
    margin: 0;
    padding: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }

  .card {
    padding: 2em;
  }

  .read-the-docs {
    color: #888;
  }

  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    cursor: pointer;
    transition: border-color 0.25s;
  }

  button:hover {
    border-color: #646cff;
  }

  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }
</style>
