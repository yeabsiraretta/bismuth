import type { CanvasDocument } from '@/features/canvas/types/document';
import type { FeatureCardData } from '@/features/canvas/types/elements';
import type { FlowLink } from '@/features/canvas/types/components';
import { generateId } from '@/features/canvas/utils';
import { log } from '@/utils/logger';

export { default as FeatureCard } from './FeatureCard.svelte';
export { default as RoadmapKanban } from './RoadmapKanban.svelte';
export { default as RoadmapExport } from './RoadmapExport.svelte';

/**
 * Projects featureCardData.dependsOn IDs into CanvasDocument.flowLinks entries.
 * For each feature_card element, creates a flow link from the card to each dependency.
 * Existing non-roadmap flow links are preserved.
 * Safe to call multiple times — roadmap links are replaced, not duplicated.
 */
export function syncRoadmapFlowLinks(doc: CanvasDocument): CanvasDocument {
  const existingLinks = doc.flowLinks ?? [];

  // Collect IDs of all feature_card elements so we can look them up
  const featureCardIds = new Set(
    doc.elements
      .filter((el) => el.element_type === 'feature_card')
      .map((el) => el.id)
  );

  // Preserve non-roadmap flow links (those not between two feature cards)
  const nonRoadmapLinks = existingLinks.filter(
    (link) => !(featureCardIds.has(link.fromFrameId) && featureCardIds.has(link.toFrameId))
  );

  // Build fresh roadmap dependency links
  const roadmapLinks: FlowLink[] = [];
  for (const el of doc.elements) {
    if (el.element_type !== 'feature_card') continue;
    const data = el.properties.featureCardData as FeatureCardData | undefined;
    if (!data?.dependsOn?.length) continue;

    for (const depId of data.dependsOn) {
      if (!featureCardIds.has(depId)) {
        log.debug('syncRoadmapFlowLinks: unknown dep id, skipping', { from: el.id, dep: depId });
        continue;
      }
      roadmapLinks.push({
        id: generateId(),
        fromFrameId: el.id,
        toFrameId: depId,
        transition: { type: 'instant', duration: 0 },
      });
    }
  }

  log.debug('syncRoadmapFlowLinks', {
    preserved: nonRoadmapLinks.length,
    roadmap: roadmapLinks.length,
  });

  return { ...doc, flowLinks: [...nonRoadmapLinks, ...roadmapLinks] };
}
