import { z } from 'zod';
import { Context } from '@chameleon/core';

export interface Tool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: {
    input: z.ZodSchema<TInput>;
    output: z.ZodSchema<TOutput>;
  };
  handler: (args: TInput, ctx: Context) => Promise<TOutput>;
}

export class ToolRegistry {
  private tools = new Map<string, Tool<any, any>>();

  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    this.tools.set(tool.name, tool);
  }

  list(): Array<{
    name: string;
    description: string;
    schema: {
      input: any;
      output: any;
    };
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      schema: {
        input: tool.schema.input.shape,
        output: tool.schema.output.shape,
      },
    }));
  }

  async call(name: string, input: any, ctx: Context): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const validatedInput = tool.schema.input.parse(input);
    const result = await tool.handler(validatedInput, ctx);
    return tool.schema.output.parse(result);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}

export const registry = new ToolRegistry();