import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  getExtension,
  isCodeFile,
  isMarkdownFile,
  getLanguageDisplayName,
  getLanguageAccentColor,
} from '../services/languageDetector';

describe('getExtension', () => {
  it('extracts extension from path', () => {
    expect(getExtension('/src/main.ts')).toBe('ts');
  });

  it('extracts extension from filename', () => {
    expect(getExtension('file.py')).toBe('py');
  });

  it('returns null for no extension', () => {
    expect(getExtension('README')).toBeNull();
  });

  it('handles Dockerfile', () => {
    expect(getExtension('Dockerfile')).toBe('dockerfile');
  });

  it('handles Makefile', () => {
    expect(getExtension('Makefile')).toBe('makefile');
  });

  it('handles CMakeLists.txt', () => {
    expect(getExtension('CMakeLists.txt')).toBe('makefile');
  });

  it('returns null for trailing dot', () => {
    expect(getExtension('file.')).toBeNull();
  });
});

describe('detectLanguage', () => {
  it('detects TypeScript', () => {
    const lang = detectLanguage('app.ts');
    expect(lang?.id).toBe('typescript');
    expect(lang?.name).toBe('TypeScript');
  });

  it('detects JavaScript from .jsx', () => {
    const lang = detectLanguage('component.jsx');
    expect(lang?.id).toBe('javascript');
  });

  it('detects Python', () => {
    expect(detectLanguage('script.py')?.id).toBe('python');
  });

  it('detects Rust', () => {
    expect(detectLanguage('main.rs')?.id).toBe('rust');
  });

  it('detects Go', () => {
    expect(detectLanguage('main.go')?.id).toBe('go');
  });

  it('detects C from .h', () => {
    expect(detectLanguage('header.h')?.id).toBe('c');
  });

  it('detects C++ from .cpp', () => {
    expect(detectLanguage('main.cpp')?.id).toBe('cpp');
  });

  it('detects YAML', () => {
    expect(detectLanguage('config.yml')?.id).toBe('yaml');
  });

  it('detects JSON', () => {
    expect(detectLanguage('package.json')?.id).toBe('json');
  });

  it('detects HTML', () => {
    expect(detectLanguage('index.html')?.id).toBe('html');
  });

  it('detects CSS', () => {
    expect(detectLanguage('styles.css')?.id).toBe('css');
  });

  it('detects Shell', () => {
    expect(detectLanguage('deploy.sh')?.id).toBe('shell');
  });

  it('detects Svelte', () => {
    expect(detectLanguage('App.svelte')?.id).toBe('svelte');
  });

  it('returns null for unknown extension', () => {
    expect(detectLanguage('file.xyz')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectLanguage('file.PY')?.id).toBe('python');
  });
});

describe('isCodeFile', () => {
  it('identifies .ts as code', () => {
    expect(isCodeFile('src/main.ts')).toBe(true);
  });

  it('identifies .py as code', () => {
    expect(isCodeFile('script.py')).toBe(true);
  });

  it('rejects .md as code', () => {
    expect(isCodeFile('notes.md')).toBe(false);
  });

  it('handles Dockerfile', () => {
    expect(isCodeFile('Dockerfile')).toBe(true);
  });

  it('uses custom config extensions', () => {
    expect(
      isCodeFile('file.xyz', {
        extensions: ['xyz'],
        fontSize: 14,
        fontFamily: 'monospace',
        fontLigatures: false,
        lineNumbers: true,
        wordWrap: false,
        minimap: false,
        indentGuides: true,
        tabSize: 2,
        theme: 'auto',
      })
    ).toBe(true);
  });
});

describe('isMarkdownFile', () => {
  it('identifies .md', () => expect(isMarkdownFile('note.md')).toBe(true));
  it('identifies .markdown', () => expect(isMarkdownFile('note.markdown')).toBe(true));
  it('identifies .mdx', () => expect(isMarkdownFile('doc.mdx')).toBe(true));
  it('rejects .ts', () => expect(isMarkdownFile('file.ts')).toBe(false));
});

describe('getLanguageDisplayName', () => {
  it('returns TypeScript for .ts', () => {
    expect(getLanguageDisplayName('file.ts')).toBe('TypeScript');
  });
  it('returns Plain Text for unknown', () => {
    expect(getLanguageDisplayName('file.xyz')).toBe('Plain Text');
  });
});

describe('getLanguageAccentColor', () => {
  it('returns color for TypeScript', () => {
    expect(getLanguageAccentColor('file.ts')).toBe('#3178c6');
  });
  it('returns grey for unknown', () => {
    expect(getLanguageAccentColor('file.xyz')).toBe('#6b7280');
  });
});
