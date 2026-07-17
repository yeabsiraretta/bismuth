import { invokeCommand } from '@/ipc/invoke';

export interface NativeSmartConnection {
  path: string;
  title: string;
  score: number;
  snippet: string;
}

export async function findSimilarNotesNative(
  notePath: string,
  limit = 20,
  minScore = 0.05
): Promise<NativeSmartConnection[]> {
  return invokeCommand<NativeSmartConnection[]>('find_similar_notes', {
    notePath,
    limit,
    minScore,
  });
}

export async function findSimilarToTextNative(
  query: string,
  limit = 20,
  minScore = 0.05
): Promise<NativeSmartConnection[]> {
  return invokeCommand<NativeSmartConnection[]>('find_similar_to_text', {
    query,
    limit,
    minScore,
  });
}
