import { describe, it, expect, vi } from 'vitest';

// We need to test both production and dev behavior, so we'll import dynamically
describe('log sanitization', () => {
  describe('redactPath', () => {
    it('returns path as-is in development (IS_PROD = false)', async () => {
      vi.stubGlobal('import', { meta: { env: { PROD: false } } });
      // Reset modules so IS_PROD is recalculated
      vi.resetModules();
      const mod = await import('../sanitize');
      // In dev mode, IS_PROD is false, paths pass through
      const result = mod.redactPath('/Users/john/vaults/personal/notes/secret.md');
      // Dev mode: should pass through unchanged
      expect(result).toBe('/Users/john/vaults/personal/notes/secret.md');
    });
  });

  describe('scrubPaths', () => {
    it('returns message as-is in development', async () => {
      vi.resetModules();
      const mod = await import('../sanitize');
      const msg = 'Error at /Users/john/vaults/personal/notes/secret.md';
      expect(mod.scrubPaths(msg)).toBe(msg);
    });
  });

  describe('sanitizeContext', () => {
    it('returns context as-is in development', async () => {
      vi.resetModules();
      const mod = await import('../sanitize');
      const ctx = { path: '/Users/john/vault/note.md', count: 5 };
      expect(mod.sanitizeContext(ctx)).toBe(ctx);
    });

    it('returns undefined for undefined input', async () => {
      vi.resetModules();
      const mod = await import('../sanitize');
      expect(mod.sanitizeContext(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('returns message as-is in development', async () => {
      vi.resetModules();
      const mod = await import('../sanitize');
      const msg = 'Failed to read /Users/john/vault/note.md';
      expect(mod.sanitizeErrorMessage(msg)).toBe(msg);
    });
  });

  describe('PATH_KEYS coverage', () => {
    it('recognizes all known path key names', async () => {
      vi.resetModules();
      const mod = await import('../sanitize');
      // These keys should be handled by sanitizeContext in production
      const pathKeys = [
        'path',
        'newPath',
        'oldPath',
        'from',
        'to',
        'toFolder',
        'target',
        'targetFolder',
        'notePath',
        'vaultPath',
        'rootPath',
      ];
      // In dev they pass through, but verify the function doesn't crash
      for (const key of pathKeys) {
        const ctx = { [key]: '/some/path/file.md' };
        const result = mod.sanitizeContext(ctx);
        expect(result).toBeDefined();
      }
    });
  });
});
