/**
 * Tailwind CSS v4 — Legacy config shim
 *
 * In Tailwind v4, configuration is done via CSS @theme blocks in src/app.css.
 * This file exists only for IDE tooling compatibility (IntelliSense, linting).
 * The actual theme tokens are defined in:
 *   - src/app.css (@theme block)
 *   - src/lib/styles/tokens.css (CSS custom properties)
 *
 * @see https://tailwindcss.com/docs/v4-beta
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {},
  plugins: [],
};
