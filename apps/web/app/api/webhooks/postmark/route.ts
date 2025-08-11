import { NextRequest, NextResponse } from 'next/server';
import { PostmarkWebhookSchema } from '@chameleon/core';
import { EmailService } from '@chameleon/email';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import crypto from 'crypto';

const prisma = new PrismaClient();
const emailService = new EmailService(prisma);

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const emailInboundQueue = new Queue('email-inbound', { connection });

function verifyPostmarkSignature(body: string, signature: string): boolean {
  const secret = process.env.POSTMARK_INBOUND_SECRET;
  if (!secret) {
    console.warn('POSTMARK_INBOUND_SECRET not configured');
    return true;
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-PM-Signature') || '';
    
    if (!verifyPostmarkSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const webhook = PostmarkWebhookSchema.parse(JSON.parse(body));
    
    await emailInboundQueue.add('process-inbound', webhook);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Postmark webhook error:', error);
    return NextResponse.json(
      { error: 'Invalid webhook payload' },
      { status: 400 }
    );
  }
}