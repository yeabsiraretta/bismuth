import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  return {
    title: `Settings — ${params.tab.charAt(0).toUpperCase() + params.tab.slice(1)}`,
    description: `Configure ${params.tab} settings.`,
    tab: params.tab,
  };
};
