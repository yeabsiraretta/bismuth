import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Writing',
    description: 'Track your long-form writing projects and goals.',
  };
};
