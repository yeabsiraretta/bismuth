import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.svelte-kit/**',
      'build/**',
      'src-tauri/target/**',
      'coverage/**',
      'playwright-report/**',
      '*.config.{js,cjs,mjs,ts}',
    ],
  },

  // ── Base: eslint recommended ────────────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript recommended ──────────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Svelte recommended ──────────────────────────────────────────────────
  ...sveltePlugin.configs['flat/recommended'],

  // ── All TS/JS source files ──────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,js}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // File size
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],

      // Feature barrel enforcement — cross-feature deep imports forbidden
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*/stores/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
          {
            group: ['@/features/*/services/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
          {
            group: ['@/features/*/components/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
          {
            group: ['@/features/*/types/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
        ],
      }],
    },
  },

  // ── Svelte files ────────────────────────────────────────────────────────
  {
    files: ['src/**/*.svelte'],
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
      '@typescript-eslint/no-explicit-any': 'warn',
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*/stores/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
          {
            group: ['@/features/*/services/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
          {
            group: ['@/features/*/components/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
          {
            group: ['@/features/*/types/*'],
            message: 'Import from the feature barrel: import { x } from "@/features/<name>"',
          },
        ],
      }],
    },
  },

  // ── Intra-feature: allow deep imports within own feature ────────────────
  {
    files: ['src/lib/features/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // ── Test files: relaxed rules ───────────────────────────────────────────
  {
    files: ['src/**/*.{test,spec}.{ts,js}', 'tests/**/*.{test,spec}.{ts,js}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
    },
  },
);
