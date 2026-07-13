import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.svelte-kit/**',
      'build/**',
      'src-tauri/target/**',
      'src-tauri/gen/**',
      'coverage/**',
      'playwright-report/**',
      '.agents/**',
      '_bmad/**',
      '_bmad-output/**',
      '.claude/**',
      '.windsurf/**',
      '*.config.{js,cjs,mjs,ts}',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],

  {
    files: ['src/**/*.{ts,js}'],
    ignores: ['src/**/*.svelte.ts'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',

      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',

      'max-lines': ['error', { max: 1200, skipBlankLines: true, skipComments: true }],

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['$lib/*'],
              message: 'Use @/ imports instead of $lib/',
            },
            {
              group: ['../*'],
              message: 'Use absolute @/ imports instead of relative paths',
            },
          ],
        },
      ],
      'svelte/no-navigation-without-resolve': 'off',
    },
  },

  {
    files: ['src/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        requestAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        crypto: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        PerformanceObserver: 'readonly',
        structuredClone: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        ResizeObserver: 'readonly',
        cancelAnimationFrame: 'readonly',
        getComputedStyle: 'readonly',
        WheelEvent: 'readonly',
        PointerEvent: 'readonly',
        HTMLTextAreaElement: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        DOMParser: 'readonly',
        history: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        StorageEvent: 'readonly',
      },
    },
    rules: {
      'max-lines': ['error', { max: 1200, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/no-at-html-tags': 'off',
    },
  },

  {
    files: ['src/**/*.svelte.ts'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'max-lines': ['error', { max: 1200, skipBlankLines: true, skipComments: true }],
      'svelte/prefer-svelte-reactivity': 'off',
      'svelte/no-navigation-without-resolve': 'off',
    },
  }
);
