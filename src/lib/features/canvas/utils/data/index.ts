export {
  resolveInstance,
  isDetached,
  detachInstance,
  applyOverride,
  resetOverride,
  getEffectiveProps,
} from './componentResolver';

export {
  buildFlowGraph,
  resolveFlowTarget,
  getReachableFrames,
  findEntryFrame,
  createFlowLink,
} from './flowGraph';
export type { FlowNode, FlowGraph } from './flowGraph';
