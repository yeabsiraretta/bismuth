import { LanguageDescription } from '@codemirror/language';

export function gfmCodeLanguages() {
  return [
    LanguageDescription.of({
      name: 'javascript',
      alias: ['js', 'jsx', 'ts', 'tsx', 'typescript'],
      load: async () => {
        const { javascript } = await import('@codemirror/lang-javascript');
        return javascript({ jsx: true, typescript: true });
      },
    }),
    LanguageDescription.of({
      name: 'json',
      alias: ['jsonc'],
      load: async () => {
        const { json } = await import('@codemirror/lang-json');
        return json();
      },
    }),
    LanguageDescription.of({
      name: 'css',
      alias: ['scss', 'less'],
      load: async () => {
        const { css } = await import('@codemirror/lang-css');
        return css();
      },
    }),
    LanguageDescription.of({
      name: 'html',
      alias: ['htm', 'xml', 'svg'],
      load: async () => {
        const { html } = await import('@codemirror/lang-html');
        return html();
      },
    }),
    LanguageDescription.of({
      name: 'python',
      alias: ['py'],
      load: async () => {
        const { python } = await import('@codemirror/lang-python');
        return python();
      },
    }),
    LanguageDescription.of({
      name: 'rust',
      alias: ['rs'],
      load: async () => {
        const { rust } = await import('@codemirror/lang-rust');
        return rust();
      },
    }),
    LanguageDescription.of({
      name: 'java',
      alias: ['kotlin', 'scala'],
      load: async () => {
        const { java } = await import('@codemirror/lang-java');
        return java();
      },
    }),
    LanguageDescription.of({
      name: 'cpp',
      alias: ['c', 'h', 'hpp', 'cc', 'cxx', 'objc'],
      load: async () => {
        const { cpp } = await import('@codemirror/lang-cpp');
        return cpp();
      },
    }),
    LanguageDescription.of({
      name: 'php',
      alias: ['phtml'],
      load: async () => {
        const { php } = await import('@codemirror/lang-php');
        return php();
      },
    }),
    LanguageDescription.of({
      name: 'yaml',
      alias: ['yml'],
      load: async () => {
        const { yaml } = await import('@codemirror/lang-yaml');
        return yaml();
      },
    }),
    LanguageDescription.of({
      name: 'sql',
      alias: ['mysql', 'pgsql', 'sqlite'],
      load: async () => {
        const { sql } = await import('@codemirror/lang-sql');
        return sql();
      },
    }),
    LanguageDescription.of({
      name: 'go',
      alias: ['golang'],
      load: async () => {
        const { go } = await import('@codemirror/lang-go');
        return go();
      },
    }),
    LanguageDescription.of({
      name: 'markdown',
      alias: ['md', 'mdx'],
      load: async () => {
        const { markdown: md } = await import('@codemirror/lang-markdown');
        return md();
      },
    }),
  ];
}
