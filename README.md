# 🦎 Chameleon.ai

> **AI-orchestrated modular business automation platform for non-developers**

Chameleon.ai automatically provisions modules, integrations, and workflows based on natural language descriptions. Simply describe your problem, and the system sets everything up for you.

## 🌟 Features

### Core Concept
- **Modular Architecture**: Each feature (Email, CRM, Workflows) is an independent module
- **AI-Driven Setup**: Planner agent provisions the right modules based on user input
- **Workflow Automation**: Integrates with n8n for visual workflow creation
- **Multi-Tenant**: Supports multiple workspaces with full data isolation

### Implemented Modules
- 📧 **Email Module**: Postmark integration with thread management and draft approval
- 👥 **CRM Module**: Contact management with deduplication and activity tracking  
- ⚡ **Workflow Module**: n8n adapter for creating and managing automations
- 🤖 **AI Module**: Planner and router for intelligent task delegation

## 🏗️ Architecture

```
├── apps/
│   ├── web/              # Next.js frontend + API routes
│   └── worker/           # BullMQ background workers
├── packages/
│   ├── db/               # Prisma schema + client
│   ├── core/             # Shared types and utilities
│   ├── tool-registry/    # Dynamic tool discovery system
│   ├── modules/          # Pluggable business modules
│   ├── ai/               # AI planner and router
│   └── workflow-adapter/ # Abstracted workflow engine interface
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Redis (local or cloud)
- PostgreSQL (via Supabase)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/chameleon-ai.git
cd chameleon-ai

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
pnpm db:generate
pnpm db:push

# Start development servers
pnpm dev
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Email (Postmark)
POSTMARK_SERVER_TOKEN=xxx
POSTMARK_INBOUND_SECRET=xxx

# Queue (Redis)
REDIS_URL=redis://localhost:6379

# Workflow Engine (n8n - optional)
N8N_API_BASE_URL=http://localhost:5678
N8N_API_TOKEN=xxx
```

## 🧩 Adding New Modules

Follow our modular pattern to extend functionality:

```typescript
// packages/modules/my-module/src/manifest.ts
export const manifest: ModuleManifest = {
  name: 'my-module',
  description: 'What this module does',
  entities: ['Entity1', 'Entity2'],
  actions: [{
    name: 'my-module.action',
    input: { param: 'string' },
    output: { result: 'string' }
  }],
  triggers: ['entity.created']
};
```

## 📦 Deployment

### Vercel (Frontend + API)
- **Deploy Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm build --filter=@chameleon/web`
- **Framework**: Next.js

### Railway (Workers)
- **Deploy Directory**: `apps/worker`  
- **Build Command**: `pnpm build --filter=@chameleon/worker`
- **Start Command**: `pnpm --filter=@chameleon/worker start`

### Required Services
- **Supabase**: PostgreSQL + Auth + Storage
- **Upstash/Railway**: Redis for job queues
- **Postmark**: Email sending + webhooks
- **n8n**: Workflow automation (optional)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM, tRPC
- **Database**: PostgreSQL (Supabase)
- **Queue**: BullMQ + Redis
- **Email**: Postmark
- **Workflows**: n8n (swappable)
- **AI**: OpenAI/Anthropic (configurable)

## 📋 Roadmap

- [ ] Real AI model integration (GPT-4/Claude)
- [ ] OAuth for Gmail/Outlook
- [ ] Embedded n8n workflow editor
- [ ] Vector search with pgvector
- [ ] More business modules (Calendar, Documents, etc.)
- [ ] Command palette interface
- [ ] Multi-user workspaces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the module pattern for new functionality
4. Ensure type safety and add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with modern tools and patterns:
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit  
- [BullMQ](https://bullmq.io/) - Queue system
- [n8n](https://n8n.io/) - Workflow automation
- [Supabase](https://supabase.io/) - Backend as a Service

---

**✨ Automate your business with AI-powered workflows**