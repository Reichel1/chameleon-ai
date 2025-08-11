import { ModuleManifest } from '@chameleon/core';

export const manifest: ModuleManifest = {
  name: 'workflow',
  description: 'Workflow automation and orchestration',
  entities: ['Automation', 'Execution', 'Trigger'],
  actions: [
    {
      name: 'workflow.create',
      input: {
        name: 'string',
        spec: 'object',
      },
      output: {
        workflowId: 'string',
      },
    },
    {
      name: 'workflow.run',
      input: {
        workflowId: 'string',
        payload: 'object?',
      },
      output: {
        runId: 'string',
      },
    },
    {
      name: 'workflow.enable',
      input: {
        workflowId: 'string',
      },
      output: {
        success: 'boolean',
      },
    },
    {
      name: 'workflow.disable',
      input: {
        workflowId: 'string',
      },
      output: {
        success: 'boolean',
      },
    },
  ],
  triggers: ['workflow.completed', 'workflow.failed'],
};