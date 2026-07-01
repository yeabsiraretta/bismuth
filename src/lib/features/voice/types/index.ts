export interface RecordingMetadata {
  id: string;
  filename: string;
  path: string;
  duration: number;
  createdAt: string;
  attachedNote: string | null;
}

export type RecordingState = 'idle' | 'recording' | 'paused';
