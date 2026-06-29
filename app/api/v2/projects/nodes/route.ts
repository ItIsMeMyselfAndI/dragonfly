import { NextResponse } from 'next/server';
import { createNode } from '@/lib/apis/project/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const node = await createNode(body);
    return NextResponse.json(node, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
