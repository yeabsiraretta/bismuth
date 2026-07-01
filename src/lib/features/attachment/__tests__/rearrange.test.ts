import { describe, it, expect } from 'vitest';
import { extractAttachmentLinks, resolveLink } from '../services/rearrange';

describe('extractAttachmentLinks', () => {
  it('extracts markdown image links', () => {
    const content = '![alt](images/photo.png) text ![](other.jpg)';
    const links = extractAttachmentLinks(content);
    expect(links).toContain('images/photo.png');
    expect(links).toContain('other.jpg');
  });

  it('extracts wikilink embeds', () => {
    const content = '![[assets/diagram.svg]] and ![[photo.png|200]]';
    const links = extractAttachmentLinks(content);
    expect(links).toContain('assets/diagram.svg');
    expect(links).toContain('photo.png');
  });

  it('ignores external URLs', () => {
    const content = '![alt](https://example.com/img.png)';
    const links = extractAttachmentLinks(content);
    expect(links).toHaveLength(0);
  });

  it('deduplicates links', () => {
    const content = '![](a.png) ![](a.png)';
    const links = extractAttachmentLinks(content);
    expect(links).toHaveLength(1);
  });

  it('strips fragment and query from markdown links', () => {
    const content = '![](img.png#center) ![](img.jpg?v=2)';
    const links = extractAttachmentLinks(content);
    expect(links).toContain('img.png');
    expect(links).toContain('img.jpg');
  });

  it('handles empty content', () => {
    expect(extractAttachmentLinks('')).toHaveLength(0);
  });
});

describe('resolveLink', () => {
  it('resolves relative path', () => {
    expect(resolveLink('assets/img.png', '/vault/notes', '/vault')).toBe(
      '/vault/notes/assets/img.png'
    );
  });

  it('resolves absolute path', () => {
    expect(resolveLink('/media/img.png', '/vault/notes', '/vault')).toBe('/vault/media/img.png');
  });

  it('collapses double slashes', () => {
    expect(resolveLink('img.png', '/vault/notes/', '/vault')).toBe('/vault/notes/img.png');
  });
});
