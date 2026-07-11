import { NextResponse } from 'next/server';
import {
  getSubstitutesByProjectId,
  createSubstitute,
} from '@/lib/apis/project/mongo/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const substitutes = await getSubstitutesByProjectId(id);
    return NextResponse.json(substitutes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const substitute = await createSubstitute({ ...body, projectId: id });
    return NextResponse.json(substitute, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
