import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const view = url.searchParams.get('view') ?? undefined;
  const date = url.searchParams.get('date') ?? undefined;

  return {
    title: 'Calendar',
    description: 'Plan your day with daily notes and events.',
    view,
    focus: date,
  };
};
