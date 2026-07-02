/**
 * Link embed types — data structures for URL rich previews.
 */

/** Metadata fetched from a URL for rendering. */
export interface LinkEmbedData {
  title: string;
  image: string;
  description: string;
  url: string;
  favicon: string;
  site_name: string;
  /** Aspect ratio of the image (width/height). */
  aspectRatio?: string;
  /** Custom metadata string. */
  metadata?: string;
  /** Parser that was used. */
  parser?: string;
  /** Date the embed was created. */
  date?: string;
}

/** Supported parser types. */
export type LinkEmbedParser = 'local';

/** Settings for the link embed feature. */
export interface LinkEmbedSettings {
  /** Auto-embed URLs pasted on empty lines. */
  autoEmbed: boolean;
  /** Show paste popup with embed/link/dismiss options. */
  showPastePopup: boolean;
  /** Replace selection in-place vs insert on next line. */
  inPlace: boolean;
  /** Show favicons on embedded links. */
  showFavicon: boolean;
  /** Cache favicon images and aspect ratios. */
  useCache: boolean;
  /** Default parser to use. */
  defaultParser: LinkEmbedParser;
}

export const DEFAULT_LINK_EMBED_SETTINGS: LinkEmbedSettings = {
  autoEmbed: false,
  showPastePopup: true,
  inPlace: true,
  showFavicon: true,
  useCache: true,
  defaultParser: 'local',
};

/** Parse a ```link-embed code block body into LinkEmbedData. */
export function parseLinkEmbedBlock(body: string): LinkEmbedData | null {
  const data: Record<string, string> = {};
  for (const line of body.split('\n')) {
    const match = line.match(/^(\w[\w_]*):\s*"?([^"]*)"?\s*$/);
    if (match) {
      data[match[1]] = match[2];
    }
  }
  if (!data['url']) return null;

  return {
    title: data['title'] ?? '',
    image: data['image'] ?? '',
    description: data['description'] ?? '',
    url: data['url'],
    favicon: data['favicon'] ?? '',
    site_name: data['site_name'] ?? '',
    aspectRatio: data['aspectRatio'],
    metadata: data['metadata'],
    parser: data['parser'],
    date: data['date'],
  };
}

/** Serialize LinkEmbedData back to code block body format. */
export function serializeLinkEmbedData(data: LinkEmbedData): string {
  const lines: string[] = [];
  if (data.title) lines.push(`title: "${data.title}"`);
  if (data.image) lines.push(`image: "${data.image}"`);
  if (data.description) lines.push(`description: "${data.description}"`);
  lines.push(`url: "${data.url}"`);
  if (data.favicon) lines.push(`favicon: "${data.favicon}"`);
  if (data.site_name) lines.push(`site_name: "${data.site_name}"`);
  if (data.aspectRatio) lines.push(`aspectRatio: "${data.aspectRatio}"`);
  if (data.metadata) lines.push(`metadata: "${data.metadata}"`);
  if (data.parser) lines.push(`parser: "${data.parser}"`);
  if (data.date) lines.push(`date: "${data.date}"`);
  return lines.join('\n');
}
