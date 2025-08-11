import { z } from 'zod';
import { Tool, registry } from '@chameleon/tool-registry';
import { EmailSendSchema, EmailCreateSequenceSchema } from '@chameleon/core';
import { EmailService } from './service';
import { PrismaClient } from '@prisma/client';
import { generateId } from '@chameleon/core';

const prisma = new PrismaClient();
const emailService = new EmailService(prisma);

const sendEmailTool: Tool = {
  name: 'email.send',
  description: 'Send an email message',
  schema: {
    input: EmailSendSchema,
    output: z.object({
      messageId: z.string(),
      threadId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    const result = await emailService.sendEmail({
      workspaceId: ctx.workspaceId,
      ...input,
    });
    return {
      messageId: result.messageId,
      threadId: result.threadId,
    };
  },
};

const createSequenceTool: Tool = {
  name: 'email.createSequence',
  description: 'Create an email sequence',
  schema: {
    input: EmailCreateSequenceSchema,
    output: z.object({
      sequenceId: z.string(),
    }),
  },
  handler: async (input, ctx) => {
    const sequenceId = generateId();
    
    await prisma.event.create({
      data: {
        workspaceId: ctx.workspaceId,
        type: 'email.sequence.created',
        dataJson: {
          sequenceId,
          name: input.name,
          steps: input.steps,
        },
      },
    });

    return { sequenceId };
  },
};

export function registerEmailTools() {
  registry.register(sendEmailTool);
  registry.register(createSequenceTool);
}