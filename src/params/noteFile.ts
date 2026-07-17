import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  return param.endsWith('.md') || param.endsWith('.pen') || param.includes('/');
};
