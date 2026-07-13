import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  return {
    title: 'Pokémon',
    description:
      'Competitive Pokémon damage calculator, team builder, type chart, and coverage analysis.',
  };
};
