import { NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/project/server';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const project = await updateProject(id, body);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const success = await deleteProject(id);
  if (!success) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
