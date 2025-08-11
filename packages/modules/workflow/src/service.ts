import { PrismaClient } from '@prisma/client';
import { WorkflowAdapter, N8nAdapter } from '@chameleon/workflow-adapter';
import { WorkflowSpec } from '@chameleon/core';

export class WorkflowService {
  private prisma: PrismaClient;
  private adapter: WorkflowAdapter;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.adapter = new N8nAdapter();
  }

  async createWorkflow(params: {
    workspaceId: string;
    name: string;
    spec: WorkflowSpec;
  }) {
    const { workspaceId, name, spec } = params;

    const { workflowId } = await this.adapter.create(spec, { workspaceId });

    const automation = await this.prisma.automation.create({
      data: {
        workspaceId,
        name,
        specJson: spec as any,
        backend: 'n8n',
        enabled: false,
      },
    });

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'workflow.created',
        dataJson: {
          automationId: automation.id,
          workflowId,
          name,
        },
      },
    });

    return {
      automationId: automation.id,
      workflowId,
    };
  }

  async runWorkflow(params: {
    workspaceId: string;
    workflowId: string;
    payload?: any;
  }) {
    const { workspaceId, workflowId, payload } = params;

    const automation = await this.prisma.automation.findFirst({
      where: {
        workspaceId,
        id: workflowId,
        deletedAt: null,
      },
    });

    if (!automation) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!automation.enabled) {
      throw new Error(`Workflow ${workflowId} is not enabled`);
    }

    const { runId } = await this.adapter.run(workflowId, payload);

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'workflow.run.started',
        dataJson: {
          workflowId,
          runId,
          payload,
        },
      },
    });

    return { runId };
  }

  async enableWorkflow(params: {
    workspaceId: string;
    workflowId: string;
  }) {
    const { workspaceId, workflowId } = params;

    const automation = await this.prisma.automation.findFirst({
      where: {
        workspaceId,
        id: workflowId,
        deletedAt: null,
      },
    });

    if (!automation) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    await this.adapter.enable(workflowId);

    await this.prisma.automation.update({
      where: { id: workflowId },
      data: { enabled: true },
    });

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'workflow.enabled',
        dataJson: { workflowId },
      },
    });

    return { success: true };
  }

  async disableWorkflow(params: {
    workspaceId: string;
    workflowId: string;
  }) {
    const { workspaceId, workflowId } = params;

    const automation = await this.prisma.automation.findFirst({
      where: {
        workspaceId,
        id: workflowId,
        deletedAt: null,
      },
    });

    if (!automation) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    await this.adapter.disable(workflowId);

    await this.prisma.automation.update({
      where: { id: workflowId },
      data: { enabled: false },
    });

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'workflow.disabled',
        dataJson: { workflowId },
      },
    });

    return { success: true };
  }
}