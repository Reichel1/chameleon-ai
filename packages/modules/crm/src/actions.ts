import { z } from 'zod';
import { Tool, registry } from '@chameleon/tool-registry';
import { CrmCreateContactSchema, CrmAddActivitySchema } from '@chameleon/core';
import { CrmService } from './service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const crmService = new CrmService(prisma);

const createContactTool: Tool = {
  name: 'crm.createContact',
  description: 'Create or update a contact',
  schema: {
    input: CrmCreateContactSchema,
    output: z.object({
      contactId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    const contact = await crmService.createContact({
      workspaceId: ctx.workspaceId,
      ...input,
    });
    return { contactId: contact.id };
  },
};

const upsertCompanyTool: Tool = {
  name: 'crm.upsertCompany',
  description: 'Create or update a company',
  schema: {
    input: z.object({
      name: z.string(),
      domain: z.string().optional(),
      meta: z.record(z.any()).optional(),
    }),
    output: z.object({
      companyId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    const result = await crmService.upsertCompany({
      workspaceId: ctx.workspaceId,
      ...input,
    });
    return result;
  },
};

const addActivityTool: Tool = {
  name: 'crm.addActivity',
  description: 'Add an activity to a contact',
  schema: {
    input: CrmAddActivitySchema,
    output: z.object({
      activityId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    const result = await crmService.addActivity({
      workspaceId: ctx.workspaceId,
      ...input,
    });
    return result;
  },
};

export function registerCrmTools() {
  registry.register(createContactTool);
  registry.register(upsertCompanyTool);
  registry.register(addActivityTool);
}