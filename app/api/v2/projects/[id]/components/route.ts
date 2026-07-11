import { NextResponse } from 'next/server';
import { getComponentsByProjectId, createComponent } from '@/lib/apis/project/mongo/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const components = await getComponentsByProjectId(id);
    return NextResponse.json(components);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const component = await createComponent({
      ...body,
      projectId,
    });
    return NextResponse.json(component, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
