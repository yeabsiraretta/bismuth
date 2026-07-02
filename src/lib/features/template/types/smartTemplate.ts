/**
 * Smart Template types — context-first AI prompt building.
 *
 * Inspired by Obsidian Smart Templates: combine vault context with
 * reusable templates to build ready-to-run AI prompts.
 */

// ─── Template sources ──────────────────────────────────────────────────────────

export type TemplateSource =
  | 'folder' // From configured template folders
  | 'tagged' // Notes with `smart_template: true` frontmatter
  | 'builtin' // Built-in default templates
  | 'vault'; // Obsidian Templates folder fallback

export interface SmartTemplate {
  name: string;
  content: string;
  source: TemplateSource;
  description?: string;
}

// ─── Prompt context ────────────────────────────────────────────────────────────

export interface PromptContext {
  /** The active note title */
  noteTitle: string;
  /** The active note path */
  notePath: string;
  /** Full note content or selected text */
  content: string;
  /** Whether context came from a selection */
  isSelection: boolean;
  /** Additional notes added as context */
  additionalNotes: Array<{ title: string; content: string }>;
}

// ─── Built prompt ──────────────────────────────────────────────────────────────

export interface BuiltPrompt {
  /** The final assembled prompt text */
  text: string;
  /** Templates used in order */
  templateNames: string[];
  /** Character count */
  charCount: number;
  /** Estimated token count (~4 chars per token) */
  estimatedTokens: number;
  /** When the prompt was built */
  builtAt: string;
}

// ─── Config ────────────────────────────────────────────────────────────────────

export interface SmartTemplateConfig {
  /** Folders to scan for templates (relative to vault root) */
  templateFolders: string[];
  /** Include built-in default templates */
  includeBuiltins: boolean;
  /** Include notes tagged with smart_template: true */
  includeTagged: boolean;
  /** Maximum context length in characters */
  maxContextLength: number;
  /** Default instructions appended to every prompt */
  defaultInstructions: string;
  /** How many recent prompts to remember */
  recentLimit: number;
}

export const DEFAULT_SMART_TEMPLATE_CONFIG: SmartTemplateConfig = {
  templateFolders: ['Templates', '.bismuth/templates'],
  includeBuiltins: true,
  includeTagged: true,
  maxContextLength: 8000,
  defaultInstructions: '',
  recentLimit: 10,
};

// ─── Built-in templates ────────────────────────────────────────────────────────

export const BUILTIN_TEMPLATES: SmartTemplate[] = [
  {
    name: 'Add tags',
    source: 'builtin',
    description: 'Suggest relevant tags for the note',
    content: `Analyze the following note and suggest 5–10 relevant tags.
Return them as a YAML \`tags:\` array that can be pasted into frontmatter.
Only include tags that accurately describe the content. Prefer lowercase, hyphenated tags.`,
  },
  {
    name: 'Create summary',
    source: 'builtin',
    description: 'Summarize the note content',
    content: `Write a concise summary of the following note.
The summary should capture the key points in 2–4 paragraphs.
Use clear, direct language. Preserve any important details, dates, or names.`,
  },
  {
    name: 'Research paper',
    source: 'builtin',
    description: 'Structure content as a research paper',
    content: `Restructure the following content into a research paper format with:
- **Abstract** (150–250 words)
- **Introduction** (background and research question)
- **Methods** (if applicable)
- **Results/Findings**
- **Discussion**
- **Conclusion**
- **References** (if any are mentioned)

Maintain the original ideas and evidence. Use academic tone.`,
  },
  {
    name: 'Diagram',
    source: 'builtin',
    description: 'Generate a Mermaid diagram from content',
    content: `Analyze the following content and create a Mermaid diagram that visualizes the key relationships or processes described.
Return the diagram as a fenced \`\`\`mermaid code block.
Choose the most appropriate diagram type (flowchart, sequence, class, state, etc.).`,
  },
  {
    name: 'Flashcards',
    source: 'builtin',
    description: 'Generate flashcard Q&A pairs',
    content: `Create flashcards from the following content using this format:

Question :: Answer

Generate 5–15 flashcards that cover the key concepts. Make questions specific and answers concise.`,
  },
  {
    name: 'Action items',
    source: 'builtin',
    description: 'Extract action items and next steps',
    content: `Review the following note and extract all action items, tasks, and next steps.
Format each as a Markdown checkbox:
- [ ] Action item

Group related items under descriptive headings. Add suggested deadlines where appropriate.`,
  },
];
