/**
 * App metadata injected at build time via Vite `define` (see vite.config.ts).
 * Single source of truth — never hardcode version strings elsewhere.
 */
export const APP_VERSION: string = __APP_VERSION__;
export const APP_BUILD_DATE: string = __APP_BUILD_DATE__;
const APP_NAME = 'Bismuth';
