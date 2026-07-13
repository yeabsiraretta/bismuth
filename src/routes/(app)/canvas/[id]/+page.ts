import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const canvasId = decodeURIComponent(params.id);
  const canvasPath = canvasId.endsWith('.canvas') ? canvasId : `${canvasId}.canvas`;

  return {
    title: 'Canvas',
    description: 'Arrange notes and ideas on a freeform visual workspace.',
    canvasPath,
  };
};
