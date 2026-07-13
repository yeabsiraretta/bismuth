import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const notePath = params.path;
  if (!notePath) {
    redirect(302, '/editor');
  }

  return {
    title: 'Editor',
    description: 'Write and edit your notes with a powerful markdown editor.',
    note: decodeURIComponent(notePath),
  };
};
