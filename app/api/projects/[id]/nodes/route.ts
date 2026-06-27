import { NextResponse } from 'next/server';
import { getNodesByProjectId } from '@/lib/project/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const nodes = await getNodesByProjectId(id);
  return NextResponse.json(nodes);
}
