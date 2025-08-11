import { WorkflowSpec } from '@chameleon/core';

export interface WorkflowAdapter {
  create(spec: WorkflowSpec, opts: { workspaceId: string }): Promise<{ workflowId: string }>;
  run(workflowId: string, payload?: any): Promise<{ runId: string }>;
  status(runId: string): Promise<'running' | 'success' | 'error'>;
  enable(workflowId: string): Promise<void>;
  disable(workflowId: string): Promise<void>;
  delete(workflowId: string): Promise<void>;
}

export * from './n8n';