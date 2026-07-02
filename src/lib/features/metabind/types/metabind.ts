/**
 * MetaBind type definitions — interactive inline fields for notes.
 *
 * Syntax inspired by Obsidian Meta Bind plugin:
 *   INPUT[type:property]    — editable input bound to frontmatter
 *   VIEW[type:property]     — read-only display of frontmatter value
 *   BUTTON[label:action]    — clickable action button
 *
 * Supported input types: toggle, text, number, slider, date, select, textarea
 * Supported view types: text, number, date, list, link, progress, rating
 * Supported button actions: open, command, template, js, navigate
 */

// ─── Input field types ───────────────────────────────────────────────────────

export type InputFieldType =
  | 'toggle'
  | 'text'
  | 'number'
  | 'slider'
  | 'date'
  | 'select'
  | 'textarea'
  | 'suggester'
  | 'multi-select'
  | 'color'
  | 'time';

/** Parsed INPUT[type:property] declaration. */
export interface InputFieldDeclaration {
  kind: 'input';
  fieldType: InputFieldType;
  property: string;
  options: InputFieldOptions;
}

/** Optional parameters for input fields (parsed from parenthetical args). */
export interface InputFieldOptions {
  /** Placeholder text for text/textarea inputs */
  placeholder?: string;
  /** Min value for number/slider */
  min?: number;
  /** Max value for number/slider */
  max?: number;
  /** Step for number/slider */
  step?: number;
  /** Options list for select/multi-select (comma-separated in syntax) */
  choices?: string[];
  /** Default value if frontmatter property is missing */
  defaultValue?: string;
  /** CSS class override */
  cssClass?: string;
}

// ─── View field types ────────────────────────────────────────────────────────

export type ViewFieldType =
  'text' | 'number' | 'date' | 'list' | 'link' | 'progress' | 'rating' | 'tags' | 'boolean';

/** Parsed VIEW[type:property] declaration. */
export interface ViewFieldDeclaration {
  kind: 'view';
  fieldType: ViewFieldType;
  property: string;
  options: ViewFieldOptions;
}

export interface ViewFieldOptions {
  /** Max value for progress display */
  max?: number;
  /** Max stars for rating display */
  maxStars?: number;
  /** Date format string */
  format?: string;
  /** CSS class override */
  cssClass?: string;
}

// ─── Button types ────────────────────────────────────────────────────────────

export type ButtonAction = 'open' | 'command' | 'template' | 'navigate' | 'update' | 'js';

/** Parsed BUTTON[label:action(args)] declaration. */
export interface ButtonDeclaration {
  kind: 'button';
  label: string;
  action: ButtonAction;
  actionArgs: string;
  options: ButtonOptions;
}

export interface ButtonOptions {
  /** CSS class override */
  cssClass?: string;
  /** Icon name (Lucide) */
  icon?: string;
  /** Button style variant */
  style?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

// ─── Union type ──────────────────────────────────────────────────────────────

export type MetaBindDeclaration = InputFieldDeclaration | ViewFieldDeclaration | ButtonDeclaration;

// ─── Parsed inline code block match ──────────────────────────────────────────

export interface MetaBindMatch {
  declaration: MetaBindDeclaration;
  from: number;
  to: number;
}
