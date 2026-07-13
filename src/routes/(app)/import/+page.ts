import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Import',
    description: 'Bring in notes from other apps and formats.',
  };
};
