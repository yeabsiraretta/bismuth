import type { PortentType, LifecycleState } from '@/types/data/entity';

export interface CaptureStats {
  captured: number;
  organized: number;
  archived: number;
}

export interface BatchClassifyPayload {
  type: PortentType | null;
  lifecycle: LifecycleState | null;
}

export interface ClassificationData {
  title: string;
  content: string;
  type: PortentType;
  lifecycle: LifecycleState;
  tags: string[];
}
