import { NextRequest, NextResponse } from 'next/server';
import { planner } from '@chameleon/ai';
import { registerEmailTools } from '@chameleon/email';
import { registerCrmTools } from '@chameleon/crm';
import { registerWorkflowTools } from '@chameleon/workflow';

registerEmailTools();
registerCrmTools();
registerWorkflowTools();

export async function POST(request: NextRequest) {
  try {
    const { issue } = await request.json();
    
    const ctx = {
      workspaceId: 'default_workspace',
      userId: 'default_user',
    };
    
    const plan = await planner.createProvisionPlan(issue, ctx);
    await planner.applyPlan(plan, ctx);
    
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Planning error:', error);
    return NextResponse.json(
      { error: 'Failed to create provision plan' },
      { status: 500 }
    );
  }
}