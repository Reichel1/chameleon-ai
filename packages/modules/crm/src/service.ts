import { PrismaClient } from '@prisma/client';

export class CrmService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createContact(params: {
    workspaceId: string;
    email?: string;
    name?: string;
    phone?: string;
    meta?: any;
  }) {
    const { workspaceId, email, name, phone, meta } = params;

    if (email) {
      const existing = await this.prisma.contact.findFirst({
        where: {
          workspaceId,
          email,
          deletedAt: null,
        },
      });

      if (existing) {
        const updated = await this.prisma.contact.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            phone: phone || existing.phone,
            meta: meta ? { ...existing.meta, ...meta } : existing.meta,
          },
        });
        return updated;
      }
    }

    const contact = await this.prisma.contact.create({
      data: {
        workspaceId,
        email,
        name,
        phone,
        meta: meta || {},
      },
    });

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'crm.contact.created',
        dataJson: {
          contactId: contact.id,
          email,
          name,
        },
      },
    });

    return contact;
  }

  async upsertCompany(params: {
    workspaceId: string;
    name: string;
    domain?: string;
    meta?: any;
  }) {
    const { workspaceId, name, domain, meta } = params;

    const companyId = `company_${name.toLowerCase().replace(/\s+/g, '_')}`;

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'crm.company.upserted',
        dataJson: {
          companyId,
          name,
          domain,
          meta,
        },
      },
    });

    return { companyId };
  }

  async addActivity(params: {
    workspaceId: string;
    contactId: string;
    type: string;
    description: string;
    meta?: any;
  }) {
    const { workspaceId, contactId, type, description, meta } = params;

    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    const activityId = `activity_${Date.now()}`;

    await this.prisma.event.create({
      data: {
        workspaceId,
        type: 'crm.activity.created',
        dataJson: {
          activityId,
          contactId,
          activityType: type,
          description,
          meta,
        },
      },
    });

    return { activityId };
  }

  async dedupeContacts(workspaceId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        email: { not: null },
      },
      orderBy: { createdAt: 'asc' },
    });

    const emailMap = new Map<string, string>();
    const toDelete: string[] = [];

    for (const contact of contacts) {
      if (contact.email) {
        const existing = emailMap.get(contact.email);
        if (existing) {
          toDelete.push(contact.id);
        } else {
          emailMap.set(contact.email, contact.id);
        }
      }
    }

    if (toDelete.length > 0) {
      await this.prisma.contact.updateMany({
        where: {
          id: { in: toDelete },
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    return {
      deduped: toDelete.length,
      remaining: emailMap.size,
    };
  }
}