import { NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/project/server';

export async function GET() {
  const projects = await getAllProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = await createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
