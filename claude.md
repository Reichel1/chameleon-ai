You are building Chameleon.ai, an AI-driven, modular business automation platform designed for non-developers. Users type what they need (“What’s your issue?”), and the system provisions the right modules, integrations, and workflows automatically.

Core Concept:

Modular: Each feature (CRM, Email, Scheduling, Docs, etc.) is a “module” with its own DB schema, settings, API actions, and triggers.

Adaptable: An AI “Planner” agent decides which modules to enable based on the user’s problem and configures them automatically.

AI Agents: Specialized agents with access to a Tool Registry (list of typed module actions) perform tasks. A Supervisor Agent routes requests to the right model for cost/quality balance.

Workflow Engine: Initially uses n8n via Public API (one project per workspace), with an adapter pattern so we can swap in our own engine later.

Tech Stack:

Frontend: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn + TanStack Query + Zustand.

Backend: Node.js + TypeScript + Prisma ORM.

Database/Auth/Storage: Supabase (Postgres, RLS, pgvector, Storage, Auth).

Search: Meilisearch.

Email: Postmark for outbound + inbound webhooks.

Jobs: BullMQ on Upstash/Redis.

Hosting: Vercel (frontend/API) + Fly.io (workers, long-running jobs).

AI: Multi-model support (e.g., GPT-4, Claude, local models) with function calling to Tool Registry.

Rules:

Always design modules so they can be enabled/disabled per workspace without breaking others.

Every module must:

Define its DB schema in Prisma.

Expose typed actions for AI via Tool Registry.

Define possible triggers for workflows.

Keep database multi-tenant with workspace_id on every table and enforce RLS.

Planner agent must be able to read all module manifests to know capabilities.

All workflows must be created via the Workflow Adapter (starting with n8n).

User onboarding = AI detects needs → provisions modules → sets up integrations → deploys starter workflows.

Initial Goal:

Set up the project structure in a monorepo or turborepo.

Create Supabase DB with Prisma migration.

Scaffold the first modules: Email + CRM + Workflow Automation.

Implement Tool Registry and Planner Agent stubs.

Connect to n8n API (Public API) to create/manage workflows per workspace.

Implement Postmark inbound webhook handler → create Thread/Message in DB → AI draft reply → approval → send.

When coding:

Propose file/folder structure before writing code.

Use modular, typed APIs.

Write code that can be extended with more modules easily.

Always explain your reasoning when making architectural choices.

After changes have been made to relevant information in this .md file, document it accordingly in this file.

## Module Creation Pattern

### How to Create a New Module

1. **Create Module Directory Structure**
```bash
packages/modules/[module-name]/
├── package.json
├── src/
│   ├── index.ts       # Exports all module parts
│   ├── manifest.ts    # Module definition
│   ├── service.ts     # Business logic
│   ├── actions.ts     # Tool definitions
│   └── types.ts       # Module-specific types
```

2. **Define Module Manifest** (`manifest.ts`)
```typescript
import { ModuleManifest } from '@chameleon/core';

export const manifest: ModuleManifest = {
  name: 'module-name',
  description: 'What this module does',
  entities: ['Entity1', 'Entity2'],  // DB entities it manages
  actions: [
    {
      name: 'module.action1',
      input: { param1: 'string', param2: 'number?' },
      output: { result: 'string' }
    }
  ],
  triggers: ['entity.created', 'entity.updated']
};
```

3. **Add Database Schema** (in `packages/db/prisma/schema.prisma`)
```prisma
model ModuleEntity {
  id          String    @id @default(cuid())
  workspaceId String
  // ... your fields
  createdAt   DateTime  @default(now())
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@index([workspaceId])
}
```

4. **Implement Service Layer** (`service.ts`)
```typescript
export class ModuleService {
  constructor(private prisma: PrismaClient) {}
  
  async performAction(params: ActionParams) {
    // Business logic here
  }
}
```

5. **Register Tools** (`actions.ts`)
```typescript
import { Tool, registry } from '@chameleon/tool-registry';

const actionTool: Tool = {
  name: 'module.action1',
  description: 'What this action does',
  schema: {
    input: ActionInputSchema,
    output: ActionOutputSchema
  },
  handler: async (input, ctx) => {
    // Implementation
  }
};

export function registerModuleTools() {
  registry.register(actionTool);
}
```

6. **Update Core Schemas** (if needed)
Add validation schemas to `packages/core/src/schemas.ts`

7. **Register in Main App**
Import and call `registerModuleTools()` in relevant API routes

## Project Status

### ✅ Completed MVP Features

#### Infrastructure
- **Monorepo** with pnpm workspaces and Turborepo
- **Database** schema with Prisma (multi-tenant, RLS-ready)
- **Type-safe** architecture with TypeScript and Zod

#### Modules Implemented
1. **Email Module** - Postmark integration, thread management, draft generation
2. **CRM Module** - Contact management, activity tracking, deduplication
3. **Workflow Module** - n8n adapter, create/run/enable/disable workflows

#### Core Systems
- **Tool Registry** - Dynamic tool discovery and execution
- **Worker System** - BullMQ queues for email processing and workflows
- **AI Layer** - Planner and router stubs, realtor scenario ready
- **Workflow Adapter** - Abstracted n8n integration

#### UI Shell
- Onboarding flow at `/onboarding/issue`
- Email thread viewer with draft approval
- Workflow management interface
- Webhook endpoint for Postmark

## Deployment Guide

### Repository Setup
**GitHub Repository**: `chameleon-ai`

### Deployment Architecture

#### Vercel Deployment (Frontend + API)
**Deploy Directory**: `apps/web`

**Build Settings**:
- Framework Preset: Next.js
- Build Command: `cd ../.. && pnpm build --filter=@chameleon/web`
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install --frozen-lockfile`

**Environment Variables** (Add in Vercel Dashboard):
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
POSTMARK_SERVER_TOKEN=xxx
POSTMARK_INBOUND_SECRET=xxx
REDIS_URL=xxx
N8N_API_BASE_URL=xxx
N8N_API_TOKEN=xxx
DATABASE_URL=xxx
```

#### Railway Deployment (Workers)
**Deploy Directory**: `apps/worker`

**Service Configuration**:
1. Create new Railway project
2. Add Redis service
3. Deploy worker service from GitHub

**Build Settings**:
- Root Directory: `/`
- Build Command: `pnpm build --filter=@chameleon/worker`
- Start Command: `pnpm --filter=@chameleon/worker start`

**Environment Variables** (Same as Vercel)

#### Supabase Setup
1. Create new Supabase project
2. Enable pgvector extension: `CREATE EXTENSION vector;`
3. Run Prisma migrations: `pnpm db:push`
4. Set up RLS policies for multi-tenancy

#### Postmark Configuration
1. Create server in Postmark
2. Set up inbound webhook: `https://your-app.vercel.app/api/webhooks/postmark`
3. Configure domain for sending

#### n8n Setup (Optional)
1. Deploy n8n instance (self-hosted or cloud)
2. Create API key
3. Update environment variables

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry/LogRocket)
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Enable Supabase RLS
- [ ] Configure CORS policies
- [ ] Set up CI/CD with GitHub Actions

### Testing Commands
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push

# Run development servers
pnpm dev

# Type checking
pnpm typecheck

# Database studio
pnpm --filter @chameleon/db db:studio
```