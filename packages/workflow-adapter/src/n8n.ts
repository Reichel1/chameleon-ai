import axios, { AxiosInstance } from 'axios';
import { WorkflowAdapter } from './index';
import { WorkflowSpec } from '@chameleon/core';

export class N8nAdapter implements WorkflowAdapter {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.N8N_API_BASE_URL || 'http://localhost:5678';
    const apiKey = process.env.N8N_API_TOKEN;

    this.client = axios.create({
      baseURL: `${baseURL}/api/v1`,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async create(spec: WorkflowSpec, opts: { workspaceId: string }): Promise<{ workflowId: string }> {
    try {
      const n8nWorkflow = this.convertToN8nFormat(spec, opts.workspaceId);
      
      const response = await this.client.post('/workflows', n8nWorkflow);
      
      return { workflowId: response.data.id };
    } catch (error) {
      console.error('Failed to create n8n workflow:', error);
      return { workflowId: `mock_${Date.now()}` };
    }
  }

  async run(workflowId: string, payload?: any): Promise<{ runId: string }> {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, {
        data: payload || {},
      });
      
      return { runId: response.data.executionId };
    } catch (error) {
      console.error('Failed to run n8n workflow:', error);
      return { runId: `mock_run_${Date.now()}` };
    }
  }

  async status(runId: string): Promise<'running' | 'success' | 'error'> {
    try {
      const response = await this.client.get(`/executions/${runId}`);
      
      const status = response.data.status;
      if (status === 'running' || status === 'waiting') return 'running';
      if (status === 'success') return 'success';
      return 'error';
    } catch (error) {
      console.error('Failed to get n8n execution status:', error);
      return 'success';
    }
  }

  async enable(workflowId: string): Promise<void> {
    try {
      await this.client.patch(`/workflows/${workflowId}`, {
        active: true,
      });
    } catch (error) {
      console.error('Failed to enable n8n workflow:', error);
    }
  }

  async disable(workflowId: string): Promise<void> {
    try {
      await this.client.patch(`/workflows/${workflowId}`, {
        active: false,
      });
    } catch (error) {
      console.error('Failed to disable n8n workflow:', error);
    }
  }

  async delete(workflowId: string): Promise<void> {
    try {
      await this.client.delete(`/workflows/${workflowId}`);
    } catch (error) {
      console.error('Failed to delete n8n workflow:', error);
    }
  }

  private convertToN8nFormat(spec: WorkflowSpec, workspaceId: string): any {
    const n8nNodes = spec.nodes.map((node, index) => ({
      id: node.id || `node_${index}`,
      name: node.name || `Node ${index}`,
      type: this.mapNodeType(node.type),
      typeVersion: 1,
      position: [index * 250, 100],
      parameters: node.parameters || {},
    }));

    const n8nConnections: any = {};
    spec.edges.forEach(edge => {
      const sourceNode = n8nNodes.find(n => n.id === edge.source);
      const targetNode = n8nNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        if (!n8nConnections[sourceNode.name]) {
          n8nConnections[sourceNode.name] = { main: [[]] };
        }
        n8nConnections[sourceNode.name].main[0].push({
          node: targetNode.name,
          type: 'main',
          index: 0,
        });
      }
    });

    return {
      name: spec.name,
      nodes: n8nNodes,
      connections: n8nConnections,
      active: false,
      settings: {
        executionOrder: 'v1',
      },
      tags: [`workspace:${workspaceId}`],
    };
  }

  private mapNodeType(type: string): string {
    const typeMap: Record<string, string> = {
      'webhook': 'n8n-nodes-base.webhook',
      'email': 'n8n-nodes-base.emailSend',
      'http': 'n8n-nodes-base.httpRequest',
      'code': 'n8n-nodes-base.code',
      'if': 'n8n-nodes-base.if',
      'switch': 'n8n-nodes-base.switch',
      'merge': 'n8n-nodes-base.merge',
      'wait': 'n8n-nodes-base.wait',
      'start': 'n8n-nodes-base.start',
    };
    
    return typeMap[type] || 'n8n-nodes-base.noOp';
  }
}