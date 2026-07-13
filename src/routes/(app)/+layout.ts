import type { LayoutLoad } from './$types';

// Page options inherited from root +layout.ts:
// prerender=false, ssr=false, csr=true, trailingSlash='never'

const ROUTE_META: Record<string, { title: string; description: string }> = {
  '/editor': {
    title: 'Editor',
    description: 'Write and edit your notes with a powerful markdown editor.',
  },
  '/graph': {
    title: 'Graph',
    description: 'Explore connections between your notes in an interactive graph.',
  },
  '/canvas': {
    title: 'Canvas',
    description: 'Arrange notes and ideas on a freeform visual workspace.',
  },
  '/calendar': { title: 'Calendar', description: 'Plan your day with daily notes and events.' },
  '/settings': { title: 'Settings', description: 'Configure your Bismuth experience.' },
  '/import': { title: 'Import', description: 'Bring in notes from other apps and formats.' },
  '/projects': { title: 'Projects', description: 'Organize your work into project folders.' },
  '/writing': { title: 'Writing', description: 'Track your long-form writing projects and goals.' },
  '/flashcards': {
    title: 'Flashcards',
    description: 'Study and review with spaced-repetition flashcards.',
  },
  '/creative': { title: 'Creative', description: 'Brainstorm and explore creative ideas.' },
  '/media': { title: 'Media', description: 'Manage images, audio, and other media attachments.' },
  '/pokemon': { title: 'Pokémon', description: 'Competitive Pokémon tools and analysis.' },
  '/gamification': {
    title: 'Gamification',
    description: 'Track XP, levels, achievements, and daily challenges.',
  },
};

export const load: LayoutLoad = ({ url, route }) => {
  const routeId = route.id ?? url.pathname;
  const meta = ROUTE_META[url.pathname] ?? {
    title: 'Home',
    description: 'Your personal knowledge management workspace.',
  };

  return {
    routeId,
    title: meta.title,
    description: meta.description,
  };
};
