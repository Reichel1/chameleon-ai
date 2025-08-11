import { ModuleManifest } from '@chameleon/core';

export const manifest: ModuleManifest = {
  name: 'email',
  description: 'Send/receive email; templates and sequences.',
  entities: ['Mailbox', 'Thread', 'Message', 'Template', 'Sequence'],
  actions: [
    {
      name: 'email.send',
      input: {
        to: 'string',
        subject: 'string',
        html: 'string',
        replyToThreadId: 'string?',
      },
      output: {
        messageId: 'string',
        threadId: 'string',
      },
    },
    {
      name: 'email.createSequence',
      input: {
        name: 'string',
        steps: 'array',
      },
      output: {
        sequenceId: 'string',
      },
    },
  ],
  triggers: ['inbound.message', 'sequence.stepDue'],
};