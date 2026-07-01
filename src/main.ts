// Record init start time before any module loads
(window as Window & { __bismuth_init_start?: number }).__bismuth_init_start = performance.now();

import '@fontsource-variable/inter';
import './app.css';
import App from './App.svelte';

// Svelte 5: Use mount() function
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
