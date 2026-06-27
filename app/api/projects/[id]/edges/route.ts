import { NextResponse } from 'next/server';
import { getEdgesByProjectId } from '@/lib/project/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const edges = await getEdgesByProjectId(id);
  return NextResponse.json(edges);
}
