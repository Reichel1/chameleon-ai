import { ModuleManifest } from '@chameleon/core';

export const manifest: ModuleManifest = {
  name: 'crm',
  description: 'Customer relationship management',
  entities: ['Contact', 'Company', 'Activity', 'Deal'],
  actions: [
    {
      name: 'crm.createContact',
      input: {
        email: 'string?',
        name: 'string?',
        phone: 'string?',
        meta: 'object?',
      },
      output: {
        contactId: 'string',
      },
    },
    {
      name: 'crm.upsertCompany',
      input: {
        name: 'string',
        domain: 'string?',
        meta: 'object?',
      },
      output: {
        companyId: 'string',
      },
    },
    {
      name: 'crm.addActivity',
      input: {
        contactId: 'string',
        type: 'string',
        description: 'string',
        meta: 'object?',
      },
      output: {
        activityId: 'string',
      },
    },
  ],
  triggers: ['contact.created', 'deal.updated'],
};