import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@/utils/logger', () => ({ log: { info: vi.fn(), debug: vi.fn(), error: vi.fn() } }));

import { invoke } from '@tauri-apps/api/core';
import {
  isRecordingSupported,
  saveRecording,
  listRecordings,
  deleteRecording,
  attachRecordingToNote,
  generateRecordingFilename,
} from '../services/voice';

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('Voice Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects recording support (mocked as unsupported in test env)', () => {
    const supported = isRecordingSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('generates webm filename matching recording-YYYY-MM-DD-HHmmss.webm pattern', () => {
    const filename = generateRecordingFilename('audio/webm');
    expect(filename).toMatch(/^recording-\d{4}-\d{2}-\d{2}-\d{6}\.webm$/);
  });

  it('generates ogg filename for ogg mime type', () => {
    const filename = generateRecordingFilename('audio/ogg');
    expect(filename).toMatch(/^recording-\d{4}-\d{2}-\d{2}-\d{6}\.ogg$/);
  });

  it('generates mp3 filename for mp3 mime type', () => {
    const filename = generateRecordingFilename('audio/mp3');
    expect(filename).toMatch(/^recording-\d{4}-\d{2}-\d{2}-\d{6}\.mp3$/);
  });

  it('saves a recording', async () => {
    const metadata = {
      id: 'r1',
      filename: 'recording-2025-01-01-120000.webm',
      path: '.bismuth/recordings/recording-2025-01-01-120000.webm',
      duration: 30,
      createdAt: '2025-01-01T12:00:00Z',
      attachedNote: null,
    };
    mockInvoke.mockResolvedValue(metadata);
    const result = await saveRecording(new ArrayBuffer(100), 30, 'audio/webm');
    expect(result.id).toBe('r1');
    expect(result.duration).toBe(30);
    expect(mockInvoke).toHaveBeenCalledWith('save_voice_recording', {
      data: expect.any(Array),
      duration: 30,
      mimeType: 'audio/webm',
      filename: expect.stringMatching(/^recording-\d{4}-\d{2}-\d{2}-\d{6}\.webm$/),
    });
  });

  it('lists recordings', async () => {
    mockInvoke.mockResolvedValue([
      {
        id: 'r1',
        filename: 'test.webm',
        path: '.bismuth/recordings/test.webm',
        duration: 10,
        createdAt: '2025-01-01',
        attachedNote: null,
      },
    ]);
    const list = await listRecordings();
    expect(list).toHaveLength(1);
    expect(list[0].filename).toBe('test.webm');
  });

  it('deletes a recording', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await deleteRecording('r1');
    expect(mockInvoke).toHaveBeenCalledWith('delete_voice_recording', { recordingId: 'r1' });
  });

  it('attaches recording to note', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await attachRecordingToNote('r1', 'notes/my-note.md');
    expect(mockInvoke).toHaveBeenCalledWith('attach_voice_recording', {
      recordingId: 'r1',
      notePath: 'notes/my-note.md',
    });
  });

  it('throws on save error', async () => {
    mockInvoke.mockRejectedValue(new Error('disk full'));
    await expect(saveRecording(new ArrayBuffer(10), 5, 'audio/webm')).rejects.toThrow(
      'Failed to save recording'
    );
  });
});
