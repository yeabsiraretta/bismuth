import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const focus = url.searchParams.get('focus') ?? undefined;
  const view = url.searchParams.get('view') ?? undefined;

  return {
    title: 'Graph',
    description: 'Explore connections between your notes in an interactive graph.',
    focus,
    view,
  };
};
