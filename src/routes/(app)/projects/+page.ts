import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Projects',
    description: 'Organize your work into project folders.',
  };
};
