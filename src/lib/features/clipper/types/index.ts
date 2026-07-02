/**
 * ReadItLater / Web Clipper types.
 * Supports clipping web content from clipboard URLs into markdown notes.
 */

export type ContentType =
  | 'youtube'
  | 'youtube-channel'
  | 'twitter'
  | 'bluesky'
  | 'stackexchange'
  | 'pinterest'
  | 'mastodon'
  | 'vimeo'
  | 'bilibili'
  | 'tiktok'
  | 'website'
  | 'text-snippet';

export interface ClipperConfig {
  inboxDir: string;
  assetsDir: string;
  dateFormat: string;
  batchDelimiter: string;
  downloadImages: boolean;
  footnoteSectionHeading: string;
  contentTypeSettings: Partial<Record<ContentType, ContentTypeConfig>>;
}

export interface ContentTypeConfig {
  titleTemplate: string;
  contentTemplate: string;
  enabled: boolean;
}

export interface ClippedItem {
  id: string;
  url: string;
  contentType: ContentType;
  title: string;
  content: string;
  createdAt: string;
  notePath: string | null;
  status: 'pending' | 'saved' | 'error';
  error?: string;
}

export interface ParsedContent {
  contentType: ContentType;
  title: string;
  variables: Record<string, string>;
}

export type TemplateContext = Record<string, string | number | null | undefined>;

/** Default templates per content type */
export const DEFAULT_TEMPLATES: Record<ContentType, { title: string; content: string }> = {
  youtube: {
    title: '{{ videoTitle }}',
    content: [
      '---',
      'source: "{{ videoURL }}"',
      'type: video',
      'date: {{ date }}',
      '---',
      '',
      '# {{ videoTitle }}',
      '',
      '{{ videoPlayer }}',
      '',
      '**Channel:** [{{ channelName }}]({{ channelURL }})',
      '**Published:** {{ videoPublishDate }}',
      '',
      '{{ videoDescription }}',
    ].join('\n'),
  },
  'youtube-channel': {
    title: '{{ channelTitle }}',
    content: [
      '---',
      'source: "{{ channelURL }}"',
      'type: channel',
      'date: {{ date }}',
      '---',
      '',
      '# {{ channelTitle }}',
      '',
      '![avatar]({{ channelAvatar }})',
      '',
      '{{ channelDescription }}',
      '',
      '**Subscribers:** {{ channelSubscribersCount }}',
      '**Videos:** {{ channelVideosCount }}',
    ].join('\n'),
  },
  twitter: {
    title: '{{ tweetAuthorName }} - Tweet',
    content: [
      '---',
      'source: "{{ tweetURL }}"',
      'type: tweet',
      'date: {{ date }}',
      '---',
      '',
      '# {{ tweetAuthorName }}',
      '',
      '{{ tweetContent }}',
      '',
      '**Published:** {{ tweetPublishDate }}',
      '**Source:** [Link]({{ tweetURL }})',
    ].join('\n'),
  },
  bluesky: {
    title: '{{ authorName }} - Post',
    content: [
      '---',
      'source: "{{ postURL }}"',
      'type: post',
      'date: {{ date }}',
      '---',
      '',
      '# {{ authorName }} (@{{ authorHandle }})',
      '',
      '{{ content }}',
      '',
      '**Likes:** {{ likeCount }} | **Replies:** {{ replyCount }} | **Reposts:** {{ repostCount }}',
    ].join('\n'),
  },
  stackexchange: {
    title: '{{ questionTitle }}',
    content: [
      '---',
      'source: "{{ questionURL }}"',
      'type: question',
      'date: {{ date }}',
      '---',
      '',
      '# {{ questionTitle }}',
      '',
      '{{ questionContent }}',
      '',
      '---',
      '',
      '## Top Answer',
      '',
      '{{ topAnswer }}',
    ].join('\n'),
  },
  pinterest: {
    title: '{{ title }} - Pinterest',
    content: [
      '---',
      'source: "{{ pinURL }}"',
      'type: pin',
      'date: {{ date }}',
      '---',
      '',
      '# {{ title }}',
      '',
      '![pin]({{ image }})',
      '',
      '{{ description }}',
      '',
      '**By:** {{ authorName }}',
      '**Likes:** {{ likeCount }}',
    ].join('\n'),
  },
  mastodon: {
    title: '{{ tootAuthorName }} - Toot',
    content: [
      '---',
      'source: "{{ tootURL }}"',
      'type: toot',
      'date: {{ date }}',
      '---',
      '',
      '# {{ tootAuthorName }}',
      '',
      '{{ tootContent }}',
    ].join('\n'),
  },
  vimeo: {
    title: '{{ videoTitle }}',
    content: [
      '---',
      'source: "{{ videoURL }}"',
      'type: video',
      'date: {{ date }}',
      '---',
      '',
      '# {{ videoTitle }}',
      '',
      '{{ videoPlayer }}',
      '',
      '**Channel:** [{{ channelName }}]({{ channelURL }})',
    ].join('\n'),
  },
  bilibili: {
    title: '{{ videoTitle }}',
    content: [
      '---',
      'source: "{{ videoURL }}"',
      'type: video',
      'date: {{ date }}',
      '---',
      '',
      '# {{ videoTitle }}',
      '',
      '{{ videoPlayer }}',
    ].join('\n'),
  },
  tiktok: {
    title: '{{ authorName }} - TikTok',
    content: [
      '---',
      'source: "{{ videoURL }}"',
      'type: video',
      'date: {{ date }}',
      '---',
      '',
      '# {{ authorName }}',
      '',
      '{{ videoPlayer }}',
      '',
      '{{ videoDescription }}',
    ].join('\n'),
  },
  website: {
    title: '{{ title }}',
    content: [
      '---',
      'source: "{{ articleURL }}"',
      'type: article',
      'date: {{ date }}',
      '---',
      '',
      '# {{ articleTitle }}',
      '',
      '{{ articleContent }}',
      '',
      '---',
      '**Source:** [{{ articleTitle }}]({{ articleURL }})',
      '**Reading time:** {{ articleReadingTime }} min',
    ].join('\n'),
  },
  'text-snippet': {
    title: 'Clip {{ date }}',
    content: ['---', 'type: snippet', 'date: {{ date }}', '---', '', '{{ content }}'].join('\n'),
  },
};
