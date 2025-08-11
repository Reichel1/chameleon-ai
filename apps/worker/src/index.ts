import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '@chameleon/email';
import { generateId } from '@chameleon/core';

const prisma = new PrismaClient();
const emailService = new EmailService(prisma);

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const emailInboundQueue = new Queue('email-inbound', { connection });
const emailDraftQueue = new Queue('email-draft', { connection });
const sendEmailQueue = new Queue('send-email', { connection });
const workflowsQueue = new Queue('workflows', { connection });

const emailInboundWorker = new Worker(
  'email-inbound',
  async (job) => {
    console.log('Processing inbound email:', job.id);
    const result = await emailService.processInboundEmail(job.data);
    
    if (result) {
      await emailDraftQueue.add('generate-draft', {
        threadId: result.threadId,
        messageId: result.messageId,
        contactId: result.contactId,
      });
    }
    
    return result;
  },
  { connection }
);

const emailDraftWorker = new Worker(
  'email-draft',
  async (job) => {
    console.log('Generating draft reply:', job.id);
    const { threadId, messageId, contactId } = job.data;
    
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }
    
    const lastMessage = thread.messages[0];
    const draftText = `Thank you for your inquiry. We'll get back to you shortly.\n\nBest regards,\nThe Team`;
    const draftHtml = `<p>Thank you for your inquiry. We'll get back to you shortly.</p><p>Best regards,<br>The Team</p>`;
    
    const draft = await prisma.message.create({
      data: {
        workspaceId: thread.workspaceId,
        threadId: thread.id,
        direction: 'outbound',
        subject: thread.subject || 'Re: Your inquiry',
        text: draftText,
        html: draftHtml,
        status: 'draft',
        inReplyTo: lastMessage?.messageId,
      },
    });
    
    await prisma.event.create({
      data: {
        workspaceId: thread.workspaceId,
        type: 'email.draft.created',
        dataJson: {
          draftId: draft.id,
          threadId: thread.id,
          contactId,
        },
      },
    });
    
    return { draftId: draft.id };
  },
  { connection }
);

const sendEmailWorker = new Worker(
  'send-email',
  async (job) => {
    console.log('Sending email:', job.id);
    const { messageId } = job.data;
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { thread: { include: { mailbox: true } } },
    });
    
    if (!message || message.status !== 'approved') {
      throw new Error(`Message ${messageId} not found or not approved`);
    }
    
    const contact = await prisma.contact.findFirst({
      where: {
        workspaceId: message.workspaceId,
        inquiries: {
          some: {
            threads: {
              some: {
                id: message.threadId,
              },
            },
          },
        },
      },
    });
    
    if (!contact?.email) {
      throw new Error('No contact email found for thread');
    }
    
    const result = await emailService.sendEmail({
      workspaceId: message.workspaceId,
      to: contact.email,
      subject: message.subject || 'Re: Your inquiry',
      html: message.html || '',
      text: message.text || undefined,
      replyToThreadId: message.threadId,
    });
    
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'sent',
        messageId: result.postmarkMessageId,
      },
    });
    
    return result;
  },
  { connection }
);

const workflowsWorker = new Worker(
  'workflows',
  async (job) => {
    console.log('Processing workflow job:', job.id);
    const { type, payload } = job.data;
    
    switch (type) {
      case 'trigger':
        console.log('Triggering workflow:', payload);
        break;
      case 'execute':
        console.log('Executing workflow step:', payload);
        break;
      default:
        console.warn('Unknown workflow job type:', type);
    }
    
    return { processed: true };
  },
  { connection }
);

emailInboundWorker.on('completed', (job) => {
  console.log(`Email inbound job ${job.id} completed`);
});

emailInboundWorker.on('failed', (job, err) => {
  console.error(`Email inbound job ${job?.id} failed:`, err);
});

emailDraftWorker.on('completed', (job) => {
  console.log(`Email draft job ${job.id} completed`);
});

emailDraftWorker.on('failed', (job, err) => {
  console.error(`Email draft job ${job?.id} failed:`, err);
});

sendEmailWorker.on('completed', (job) => {
  console.log(`Send email job ${job.id} completed`);
});

sendEmailWorker.on('failed', (job, err) => {
  console.error(`Send email job ${job?.id} failed:`, err);
});

workflowsWorker.on('completed', (job) => {
  console.log(`Workflow job ${job.id} completed`);
});

workflowsWorker.on('failed', (job, err) => {
  console.error(`Workflow job ${job?.id} failed:`, err);
});

console.log('Worker started. Listening for jobs...');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await emailInboundWorker.close();
  await emailDraftWorker.close();
  await sendEmailWorker.close();
  await workflowsWorker.close();
  await connection.quit();
  process.exit(0);
});

export {
  emailInboundQueue,
  emailDraftQueue,
  sendEmailQueue,
  workflowsQueue,
};