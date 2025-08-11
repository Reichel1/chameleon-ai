import { ProvisionPlan, WorkflowSpec, Context } from '@chameleon/core';
import { registry } from '@chameleon/tool-registry';

export class Planner {
  async createProvisionPlan(userInput: string, ctx: Context): Promise<ProvisionPlan> {
    console.log('Creating provision plan for:', userInput);
    
    if (userInput.toLowerCase().includes('realtor') || userInput.toLowerCase().includes('inquiry')) {
      return this.getRealtorPlan();
    }
    
    return this.getDefaultPlan();
  }
  
  private getRealtorPlan(): ProvisionPlan {
    const inboundToClassifyWorkflow: WorkflowSpec = {
      name: 'Process Property Inquiries',
      nodes: [
        {
          id: 'webhook',
          type: 'webhook',
          name: 'Inbound Email Trigger',
          parameters: {
            path: '/email-received',
            method: 'POST',
          },
        },
        {
          id: 'classify',
          type: 'code',
          name: 'Classify Inquiry',
          parameters: {
            code: `
              const subject = $input.subject;
              const body = $input.body;
              
              if (subject.includes('property') || body.includes('listing')) {
                return { type: 'property_inquiry', priority: 'high' };
              }
              return { type: 'general', priority: 'normal' };
            `,
          },
        },
        {
          id: 'createContact',
          type: 'code',
          name: 'Create/Update Contact',
          parameters: {
            code: `
              return {
                action: 'crm.createContact',
                params: {
                  email: $input.from,
                  name: $input.fromName,
                }
              };
            `,
          },
        },
        {
          id: 'draftReply',
          type: 'code',
          name: 'Generate Reply Draft',
          parameters: {
            code: `
              const template = $input.type === 'property_inquiry' 
                ? 'Thank you for your interest in our property listings. A member of our team will contact you within 24 hours.'
                : 'Thank you for contacting us. We will respond to your inquiry shortly.';
                
              return {
                action: 'email.draft',
                params: {
                  threadId: $input.threadId,
                  body: template,
                }
              };
            `,
          },
        },
      ],
      edges: [
        { source: 'webhook', target: 'classify' },
        { source: 'classify', target: 'createContact' },
        { source: 'createContact', target: 'draftReply' },
      ],
      triggers: ['email.inbound'],
    };
    
    return {
      modules: ['email', 'crm', 'workflow'],
      actions: [
        'email.send',
        'email.createSequence',
        'crm.createContact',
        'crm.addActivity',
        'workflow.create',
        'workflow.enable',
      ],
      workflows: [inboundToClassifyWorkflow],
    };
  }
  
  private getDefaultPlan(): ProvisionPlan {
    return {
      modules: ['email', 'crm'],
      actions: ['email.send', 'crm.createContact'],
      workflows: [],
    };
  }
  
  async applyPlan(plan: ProvisionPlan, ctx: Context): Promise<void> {
    console.log('Applying provision plan:', plan);
    
    for (const moduleName of plan.modules) {
      console.log(`Enabling module: ${moduleName}`);
    }
    
    for (const workflow of plan.workflows) {
      console.log(`Creating workflow: ${workflow.name}`);
      
      if (registry.has('workflow.create')) {
        await registry.call('workflow.create', { name: workflow.name, spec: workflow }, ctx);
      }
    }
  }
}

export const planner = new Planner();