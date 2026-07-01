import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import {
  getGraphData,
  getBacklinks,
  getBacklinksData,
  getOutgoingLinks,
  createLinkFromMention,
  getSimilarNotes,
  lookupByText,
  computeGraphLayout,
  getConceptSuggestions,
} from '../services/graph';
import { invoke } from '@tauri-apps/api/core';

describe('graph service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGraphData', () => {
    it('calls invoke with correct command', async () => {
      vi.mocked(invoke).mockResolvedValue({ nodes: [], edges: [] });
      const result = await getGraphData();
      expect(invoke).toHaveBeenCalledWith('get_graph_data');
      expect(result).toEqual({ nodes: [], edges: [] });
    });

    it('throws with descriptive error on failure', async () => {
      vi.mocked(invoke).mockRejectedValue('network error');
      await expect(getGraphData()).rejects.toThrow('Failed to get graph data');
    });
  });

  describe('getBacklinks', () => {
    it('calls invoke with path parameter', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getBacklinks('/vault/note.md');
      expect(invoke).toHaveBeenCalledWith('get_backlinks', { path: '/vault/note.md' });
    });

    it('returns array of links', async () => {
      const links = [{ source: 'a', target: 'b' }];
      vi.mocked(invoke).mockResolvedValue(links);
      const result = await getBacklinks('/vault/note.md');
      expect(result).toEqual(links);
    });
  });

  describe('getBacklinksData', () => {
    it('calls invoke with noteId', async () => {
      vi.mocked(invoke).mockResolvedValue({ linkedMentions: [], unlinkedMentions: [] });
      await getBacklinksData('note-123');
      expect(invoke).toHaveBeenCalledWith('get_backlinks', { noteId: 'note-123' });
    });
  });

  describe('getOutgoingLinks', () => {
    it('calls invoke with noteId', async () => {
      vi.mocked(invoke).mockResolvedValue({ links: [] });
      await getOutgoingLinks('note-456');
      expect(invoke).toHaveBeenCalledWith('get_outgoing_links', { noteId: 'note-456' });
    });
  });

  describe('createLinkFromMention', () => {
    it('calls invoke with all parameters', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);
      await createLinkFromMention('src', 'tgt', 42);
      expect(invoke).toHaveBeenCalledWith('create_link_from_mention', {
        sourceNoteId: 'src',
        targetNoteId: 'tgt',
        lineNumber: 42,
      });
    });
  });

  describe('getSimilarNotes', () => {
    it('calls invoke with path and default topK', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getSimilarNotes('/vault/a.md');
      expect(invoke).toHaveBeenCalledWith('get_similar_notes', { path: '/vault/a.md', topK: 8 });
    });

    it('accepts custom topK', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getSimilarNotes('/vault/a.md', 20);
      expect(invoke).toHaveBeenCalledWith('get_similar_notes', { path: '/vault/a.md', topK: 20 });
    });
  });

  describe('lookupByText', () => {
    it('calls invoke with query and default topK', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await lookupByText('typescript patterns');
      expect(invoke).toHaveBeenCalledWith('lookup_by_text', { query: 'typescript patterns', topK: 10 });
    });
  });

  describe('computeGraphLayout', () => {
    it('calls invoke with settings', async () => {
      const settings = {
        center_force: 0.1, repel_force: 500, link_force: 1,
        link_distance: 50, width: 800, height: 600, iterations: 100,
      };
      vi.mocked(invoke).mockResolvedValue([]);
      await computeGraphLayout(settings);
      expect(invoke).toHaveBeenCalledWith('compute_graph_layout', { settings });
    });
  });

  describe('getConceptSuggestions', () => {
    it('calls invoke with notePath and content', async () => {
      vi.mocked(invoke).mockResolvedValue([]);
      await getConceptSuggestions('/vault/note.md', 'Some content here');
      expect(invoke).toHaveBeenCalledWith('get_concept_suggestions', {
        notePath: '/vault/note.md',
        content: 'Some content here',
      });
    });

    it('returns suggestions array', async () => {
      const suggestions = [{ title: 'Test', path: '/p', matched_text: 'test', offset: 0, length: 4 }];
      vi.mocked(invoke).mockResolvedValue(suggestions);
      const result = await getConceptSuggestions('/n', 'test');
      expect(result).toEqual(suggestions);
    });
  });
});
