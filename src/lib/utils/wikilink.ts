/**
 * Wikilink parsing and manipulation utilities
 */

export interface WikilinkMatch {
	raw: string;
	text: string;
	alias?: string;
	start: number;
	end: number;
}

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Parse wikilinks from markdown content
 */
export function parseWikilinks(content: string): WikilinkMatch[] {
	const matches: WikilinkMatch[] = [];
	let match: RegExpExecArray | null;

	while ((match = WIKILINK_REGEX.exec(content)) !== null) {
		matches.push({
			raw: match[0],
			text: match[1].trim(),
			alias: match[2]?.trim(),
			start: match.index,
			end: match.index + match[0].length,
		});
	}

	return matches;
}

/**
 * Extract all linked note names from content
 */
export function extractLinkedNotes(content: string): string[] {
	const wikilinks = parseWikilinks(content);
	return wikilinks.map((link) => link.text);
}

/**
 * Check if content contains a specific wikilink
 */
export function hasWikilink(content: string, noteName: string): boolean {
	const wikilinks = parseWikilinks(content);
	return wikilinks.some((link) => link.text === noteName);
}

/**
 * Create a wikilink string
 */
export function createWikilink(noteName: string, alias?: string): string {
	if (alias) {
		return `[[${noteName}|${alias}]]`;
	}
	return `[[${noteName}]]`;
}

/**
 * Update wikilinks when a note is renamed
 */
export function updateWikilinksOnRename(
	content: string,
	oldName: string,
	newName: string
): string {
	const wikilinks = parseWikilinks(content);
	let updatedContent = content;
	let offset = 0;

	for (const link of wikilinks) {
		if (link.text === oldName) {
			const newLink = createWikilink(newName, link.alias);
			const start = link.start + offset;
			const end = link.end + offset;

			updatedContent =
				updatedContent.substring(0, start) +
				newLink +
				updatedContent.substring(end);

			offset += newLink.length - link.raw.length;
		}
	}

	return updatedContent;
}

/**
 * Find unlinked mentions of a note name in content
 */
export function findUnlinkedMentions(
	content: string,
	noteName: string
): Array<{ text: string; start: number; end: number }> {
	const mentions: Array<{ text: string; start: number; end: number }> = [];
	const wikilinks = parseWikilinks(content);

	// Create a set of ranges that are already wikilinks
	const linkedRanges = wikilinks.map((link) => ({
		start: link.start,
		end: link.end,
	}));

	// Simple word boundary regex for the note name
	const mentionRegex = new RegExp(`\\b${escapeRegex(noteName)}\\b`, 'gi');
	let match: RegExpExecArray | null;

	while ((match = mentionRegex.exec(content)) !== null) {
		const start = match.index;
		const end = start + match[0].length;

		// Check if this mention is already a wikilink
		const isLinked = linkedRanges.some(
			(range) => start >= range.start && end <= range.end
		);

		if (!isLinked) {
			mentions.push({
				text: match[0],
				start,
				end,
			});
		}
	}

	return mentions;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
