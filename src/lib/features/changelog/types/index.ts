export interface ChangelogEntry {
  path: string;
  action: 'created' | 'modified' | 'deleted' | 'renamed';
  timestamp: string;
  words_delta: number;
}
