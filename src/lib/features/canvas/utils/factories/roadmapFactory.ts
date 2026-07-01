import type { CanvasElement, FeatureCardData } from '@/features/canvas/types';
import { generateId } from './elementFactory';

/**
 * Creates a feature_card element for use in roadmap canvas documents.
 * @param x - Absolute X position on the canvas.
 * @param y - Absolute Y position on the canvas.
 * @param title - Feature name displayed on the card.
 * @param status - Initial workflow status.
 * @param layerId - The layer to place this element on.
 */
export function createFeatureCard(
  x: number,
  y: number,
  title: string,
  status: FeatureCardData['status'],
  layerId: string
): CanvasElement {
  const data: FeatureCardData = {
    title,
    status,
    priority: 3,
    dependsOn: [],
  };
  return {
    id: generateId(),
    element_type: 'feature_card',
    x,
    y,
    width: 200,
    height: 80,
    rotation: 0,
    properties: {
      opacity: 1,
      featureCardData: data,
    },
    layer_id: layerId,
    z_index: 0,
    locked: false,
    visible: true,
    name: title,
  };
}
