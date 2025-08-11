import { z } from 'zod';

export const EmailSendSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  replyToThreadId: z.string().optional(),
});

export const EmailCreateSequenceSchema = z.object({
  name: z.string(),
  steps: z.array(z.any()),
});

export const CrmCreateContactSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export const CrmAddActivitySchema = z.object({
  contactId: z.string(),
  type: z.string(),
  description: z.string(),
  meta: z.record(z.any()).optional(),
});

export const WorkflowCreateSchema = z.object({
  name: z.string(),
  spec: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    triggers: z.array(z.any()).optional(),
  }),
});

export const WorkflowRunSchema = z.object({
  workflowId: z.string(),
  payload: z.any().optional(),
});

export const PostmarkWebhookSchema = z.object({
  MessageID: z.string(),
  From: z.string(),
  To: z.string(),
  Subject: z.string(),
  TextBody: z.string().optional(),
  HtmlBody: z.string().optional(),
  Headers: z.array(z.object({
    Name: z.string(),
    Value: z.string(),
  })).optional(),
  Attachments: z.array(z.any()).optional(),
});