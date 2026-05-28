import { invoke } from '@tauri-apps/api/core';

/**
 * Frontmatter service — IPC wrappers for frontmatter operations.
 * Phase 5/7: Frontmatter parsing and field updates.
 */

/** Parse frontmatter from a note's content */
export async function parseFrontmatter(content: string): Promise<Record<string, unknown>> {
    try {
        return await invoke<Record<string, unknown>>('parse_frontmatter', { content });
    } catch (error) {
        console.error('Failed to parse frontmatter:', error);
        return {};
    }
}

/** Update a single frontmatter field on a note */
export async function updateFrontmatterField(
    path: string,
    key: string,
    value: unknown
): Promise<void> {
    try {
        await invoke('update_frontmatter_field', { path, key, value });
    } catch (error) {
        throw new Error(`Failed to update frontmatter field "${key}": ${error}`);
    }
}

/** Update multiple frontmatter fields at once */
export async function updateFrontmatterFields(
    path: string,
    fields: Record<string, unknown>
): Promise<void> {
    for (const [key, value] of Object.entries(fields)) {
        await updateFrontmatterField(path, key, value);
    }
}

/** Get all tags from a note's frontmatter and inline content */
export async function getNoteTags(path: string): Promise<string[]> {
    try {
        return await invoke<string[]>('get_note_tags', { path });
    } catch {
        return [];
    }
}

/** Set tags on a note via frontmatter */
export async function setNoteTags(path: string, tags: string[]): Promise<void> {
    await updateFrontmatterField(path, 'tags', tags);
}
