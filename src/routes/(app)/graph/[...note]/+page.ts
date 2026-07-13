import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const notePath = params.note;
  if (!notePath) {
    redirect(302, '/graph');
  }

  return {
    title: 'Graph',
    description: 'Explore connections between your notes in an interactive graph.',
    focus: decodeURIComponent(notePath),
  };
};
