import "./app.css";
import App from "./App.svelte";

// Svelte 5: Use mount() function
// @ts-ignore - mount exists but TypeScript definitions may be outdated
import { mount } from "svelte";

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
