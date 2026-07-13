import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Flashcards',
    description: 'Study and review with spaced-repetition flashcards.',
  };
};
