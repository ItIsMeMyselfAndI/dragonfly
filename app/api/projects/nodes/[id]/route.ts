import { NextResponse } from 'next/server';
import { updateNode } from '@/lib/project/server';

type Params = Promise<{ id: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const node = await updateNode(id, body);
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }
    return NextResponse.json(node);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}
