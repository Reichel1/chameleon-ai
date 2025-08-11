import { ServerClient } from 'postmark';
import { PrismaClient } from '@prisma/client';

export class EmailService {
  private postmark: ServerClient;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.postmark = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');
  }

  async sendEmail(params: {
    workspaceId: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyToThreadId?: string;
  }) {
    const { workspaceId, to, subject, html, text, from, replyToThreadId } = params;

    const mailbox = await this.prisma.mailbox.findFirst({
      where: {
        workspaceId,
        deletedAt: null,
      },
    });

    if (!mailbox) {
      throw new Error('No mailbox configured for workspace');
    }

    let thread;
    if (replyToThreadId) {
      thread = await this.prisma.thread.findUnique({
        where: { id: replyToThreadId },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
    }

    if (!thread) {
      thread = await this.prisma.thread.create({
        data: {
          workspaceId,
          mailboxId: mailbox.id,
          subject,
          status: 'open',
        },
      });
    }

    const inReplyTo = thread.messages?.[0]?.messageId;

    const result = await this.postmark.sendEmail({
      From: from || mailbox.fromEmail,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text || this.stripHtml(html),
      Headers: inReplyTo
        ? [{ Name: 'In-Reply-To', Value: inReplyTo }]
        : undefined,
      MessageStream: 'outbound',
    });

    const message = await this.prisma.message.create({
      data: {
        workspaceId,
        threadId: thread.id,
        direction: 'outbound',
        messageId: result.MessageID,
        inReplyTo,
        subject,
        html,
        text: text || this.stripHtml(html),
        status: 'sent',
      },
    });

    await this.prisma.thread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });

    return {
      messageId: message.id,
      threadId: thread.id,
      postmarkMessageId: result.MessageID,
    };
  }

  async processInboundEmail(webhook: any) {
    const { From, To, Subject, TextBody, HtmlBody, MessageID, Headers, Attachments } = webhook;

    const toEmail = this.extractEmail(To);
    const fromEmail = this.extractEmail(From);

    const mailbox = await this.prisma.mailbox.findFirst({
      where: {
        fromEmail: toEmail,
        deletedAt: null,
      },
    });

    if (!mailbox) {
      console.warn(`No mailbox found for ${toEmail}`);
      return null;
    }

    let contact = await this.prisma.contact.findFirst({
      where: {
        workspaceId: mailbox.workspaceId,
        email: fromEmail,
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          workspaceId: mailbox.workspaceId,
          email: fromEmail,
          name: this.extractName(From),
        },
      });
    }

    const inReplyTo = this.extractInReplyTo(Headers);
    let thread;

    if (inReplyTo) {
      const previousMessage = await this.prisma.message.findUnique({
        where: { messageId: inReplyTo },
        include: { thread: true },
      });
      if (previousMessage) {
        thread = previousMessage.thread;
      }
    }

    if (!thread) {
      thread = await this.prisma.thread.create({
        data: {
          workspaceId: mailbox.workspaceId,
          mailboxId: mailbox.id,
          subject: Subject,
          status: 'open',
        },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        workspaceId: mailbox.workspaceId,
        threadId: thread.id,
        direction: 'inbound',
        messageId: MessageID,
        inReplyTo,
        headersJson: Headers || {},
        text: TextBody,
        html: HtmlBody,
        attachmentsJson: Attachments || [],
        status: 'received',
      },
    });

    await this.prisma.thread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });

    await this.prisma.event.create({
      data: {
        workspaceId: mailbox.workspaceId,
        type: 'email.inbound',
        dataJson: {
          messageId: message.id,
          threadId: thread.id,
          contactId: contact.id,
          from: fromEmail,
          subject: Subject,
        },
      },
    });

    return {
      messageId: message.id,
      threadId: thread.id,
      contactId: contact.id,
    };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private extractEmail(address: string): string {
    const match = address.match(/<(.+?)>/) || address.match(/([^\s]+@[^\s]+)/);
    return match ? match[1] : address;
  }

  private extractName(address: string): string | null {
    const match = address.match(/^([^<]+)</);
    return match ? match[1].trim() : null;
  }

  private extractInReplyTo(headers: any[]): string | null {
    if (!headers) return null;
    const header = headers.find(h => h.Name === 'In-Reply-To');
    return header ? header.Value : null;
  }
}