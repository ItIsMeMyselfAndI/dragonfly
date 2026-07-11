import { NextResponse } from 'next/server';
import { updateComponent, deleteComponent } from '@/lib/apis/project/mongo/server';

type Params = Promise<{ id: string; componentId: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { componentId } = await params;
    const body = await request.json();
    const component = await updateComponent(componentId, body);
    if (!component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
    return NextResponse.json(component);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { componentId } = await params;
    const success = await deleteComponent(componentId);
    if (!success) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
