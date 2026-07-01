/**
 * Flow Extractor — transforms FlowLink[] into FlowPayload documents.
 */

import type { CanvasElement } from '@/features/canvas/types';
import type { FlowLink } from '@/features/canvas/types/components';
import type { FlowPayload, FlowStep } from '@/types/design-documents/flow';

/** Convert a flow transition type to a step transition type. */
function mapTransition(type: string): FlowStep['transition'] {
  const map: Record<string, FlowStep['transition']> = {
    instant: 'navigate',
    dissolve: 'render',
    'slide-left': 'navigate',
    'slide-right': 'navigate',
    'slide-up': 'modal',
    'slide-down': 'dismiss',
  };
  return map[type] || 'navigate';
}

/** Extract a FlowPayload from flow links and their associated frame elements. */
export function extractFlow(
  flowLinks: FlowLink[],
  elements: CanvasElement[],
  flowName: string
): FlowPayload {
  const elementMap = new Map(elements.map((el) => [el.id, el]));
  const componentSet = new Set<string>();

  const steps: FlowStep[] = flowLinks.map((link, idx) => {
    const fromEl = elementMap.get(link.fromFrameId);
    const screenName = fromEl?.name || `Screen_${idx}`;
    componentSet.add(screenName);

    return {
      id: `step_${idx + 1}`,
      screen: screenName,
      action: link.label || 'navigate',
      transition: mapTransition(link.transition.type),
    };
  });

  // Add final destination as last step
  if (flowLinks.length > 0) {
    const lastLink = flowLinks[flowLinks.length - 1];
    const toEl = elementMap.get(lastLink.toFrameId);
    const destName = toEl?.name || 'Destination';
    componentSet.add(destName);
    steps.push({
      id: `step_${steps.length + 1}`,
      screen: destName,
      action: 'arrived',
      transition: 'render',
    });
  }

  return {
    flow_name: flowName,
    description: `Navigation flow: ${flowName}`,
    steps,
    error_paths: [],
    components_used: Array.from(componentSet),
  };
}
