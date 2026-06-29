import { NextResponse } from 'next/server';
import { getComponentsByProjectId, createComponent } from '@/lib/project/json/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const components = await getComponentsByProjectId(id);
  return NextResponse.json(components);
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { id: projectId } = await params;
  const body = await request.json();
  const component = await createComponent({
    ...body,
    projectId,
  });
  return NextResponse.json(component, { status: 201 });
}
