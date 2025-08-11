import { z } from 'zod';
import { Tool, registry } from '@chameleon/tool-registry';
import { WorkflowCreateSchema, WorkflowRunSchema } from '@chameleon/core';
import { WorkflowService } from './service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const workflowService = new WorkflowService(prisma);

const createWorkflowTool: Tool = {
  name: 'workflow.create',
  description: 'Create a new workflow automation',
  schema: {
    input: WorkflowCreateSchema,
    output: z.object({
      workflowId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    const result = await workflowService.createWorkflow({
      workspaceId: ctx.workspaceId,
      ...input,
    });
    return { workflowId: result.automationId };
  },
};

const runWorkflowTool: Tool = {
  name: 'workflow.run',
  description: 'Run a workflow automation',
  schema: {
    input: WorkflowRunSchema,
    output: z.object({
      runId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    return await workflowService.runWorkflow({
      workspaceId: ctx.workspaceId,
      ...input,
    });
  },
};

const enableWorkflowTool: Tool = {
  name: 'workflow.enable',
  description: 'Enable a workflow automation',
  schema: {
    input: z.object({
      workflowId: z.string(),
    }),
    output: z.object({
      success: z.boolean(),
    }),
  },
  handler: async (input, ctx) => {
    return await workflowService.enableWorkflow({
      workspaceId: ctx.workspaceId,
      workflowId: input.workflowId,
    });
  },
};

const disableWorkflowTool: Tool = {
  name: 'workflow.disable',
  description: 'Disable a workflow automation',
  schema: {
    input: z.object({
      workflowId: z.string(),
    }),
    output: z.object({
      success: z.boolean(),
    }),
  },
  handler: async (input, ctx) => {
    return await workflowService.disableWorkflow({
      workspaceId: ctx.workspaceId,
      workflowId: input.workflowId,
    });
  },
};

export function registerWorkflowTools() {
  registry.register(createWorkflowTool);
  registry.register(runWorkflowTool);
  registry.register(enableWorkflowTool);
  registry.register(disableWorkflowTool);
}