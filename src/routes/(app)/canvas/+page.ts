import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Canvas',
    description: 'Arrange notes and ideas on a freeform visual workspace.',
  };
};
