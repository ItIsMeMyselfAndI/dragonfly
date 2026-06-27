import { NextResponse } from 'next/server';
import { getSubstitutesByProjectId } from '@/lib/project/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const substitutes = await getSubstitutesByProjectId(id);
  return NextResponse.json(substitutes);
}
