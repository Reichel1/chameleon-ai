import { Context } from '@chameleon/core';

export type Task = {
  kind: 'plan' | 'execute';
  input: any;
};

export type ModelSize = 'small' | 'large';

export class AIRouter {
  async routeTask(task: Task, ctx: Context): Promise<any> {
    console.log('Routing AI task:', task.kind, ctx);
    
    const modelSize = this.selectModel(task);
    
    switch (task.kind) {
      case 'plan':
        return this.generatePlan(task.input, modelSize, ctx);
      case 'execute':
        return this.executeAction(task.input, modelSize, ctx);
      default:
        throw new Error(`Unknown task kind: ${task.kind}`);
    }
  }
  
  private selectModel(task: Task): ModelSize {
    if (task.kind === 'plan') {
      return 'large';
    }
    return 'small';
  }
  
  private async generatePlan(input: any, modelSize: ModelSize, ctx: Context): Promise<any> {
    console.log(`Generating plan with ${modelSize} model`);
    
    return {
      tools: [
        { name: 'email.send', params: {} },
        { name: 'crm.createContact', params: {} },
      ],
      sequence: ['crm.createContact', 'email.send'],
    };
  }
  
  private async executeAction(input: any, modelSize: ModelSize, ctx: Context): Promise<any> {
    console.log(`Executing action with ${modelSize} model`);
    
    return {
      action: input.action,
      result: 'success',
    };
  }
}

export const router = new AIRouter();