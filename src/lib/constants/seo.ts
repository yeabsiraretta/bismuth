export const SITE_NAME = 'Bismuth';
export const SITE_DESCRIPTION =
  'A local-first personal knowledge management app with Zettelkasten, knowledge graphs, and intelligent workflows.';
export const SITE_URL = 'https://bismuth.app';
const SITE_LOCALE = 'en_US';
export const SITE_THEME_COLOR = '#cba6f7';

export const DEFAULT_OG = {
  type: 'website' as const,
  siteName: SITE_NAME,
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  locale: SITE_LOCALE,
};

const TWITTER_HANDLE = '@bismuthapp';

export const DEFAULT_TWITTER = {
  cardType: 'summary_large_image' as const,
  site: TWITTER_HANDLE,
};

export function pageTitle(page: string): string {
  return `${page} | ${SITE_NAME}`;
}
