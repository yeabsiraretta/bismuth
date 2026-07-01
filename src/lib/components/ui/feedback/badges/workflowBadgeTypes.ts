export type WorkflowCategory =
  | 'draft'
  | 'active'
  | 'complete'
  | 'blocked'
  | 'archived'
  | 'review'
  | 'published'
  | 'pending';

export const WORKFLOW_TOKENS: Record<WorkflowCategory, string> = {
  draft:     '--status-warning',
  active:    '--status-info',
  complete:  '--status-added',
  blocked:   '--status-deleted',
  archived:  '--text-muted',
  review:    '--status-modified',
  published: '--interactive-accent',
  pending:   '--text-muted',
};
