export interface Context {
  workspaceId: string;
  userId: string;
  requestId?: string;
}

export interface ModuleManifest {
  name: string;
  description: string;
  entities: string[];
  actions: ActionDefinition[];
  triggers: string[];
}

export interface ActionDefinition {
  name: string;
  input: Record<string, string>;
  output: Record<string, string>;
}

export interface ProvisionPlan {
  modules: string[];
  actions: string[];
  workflows: WorkflowSpec[];
}

export interface WorkflowSpec {
  name: string;
  nodes: any[];
  edges: any[];
  triggers?: any[];
}