import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const note = url.searchParams.get('note') ?? undefined;

  return {
    title: 'Editor',
    description: 'Write and edit your notes with a powerful markdown editor.',
    note,
  };
};
