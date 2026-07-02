import { ipcCall } from '@/utils/ipc';
import { log } from '@/utils/logger';

/** Matches the Rust EmbeddingStats struct returned by get_embedding_stats. */
export interface EmbeddingStats {
  total_embeddings: number;
  is_ready: boolean;
}

export async function initializeEmbeddings(vaultRoot: string): Promise<number> {
  return await ipcCall<number>('initialize_embeddings', { vaultRoot });
}

export async function indexAllEmbeddings(): Promise<number> {
  return await ipcCall<number>('index_all_embeddings');
}

export async function getEmbeddingStats(): Promise<EmbeddingStats> {
  try {
    return await ipcCall<EmbeddingStats>('get_embedding_stats');
  } catch (e) {
    log.warn('Embedding stats unavailable', { error: String(e) });
    return { total_embeddings: 0, is_ready: false };
  }
}
