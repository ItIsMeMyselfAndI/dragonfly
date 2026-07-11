import { NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/apis/project/mongo/server';

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Ownership (userId) and visibility (isPublic) are always assigned
    // server-side from the authenticated/guest requester. Never trust a
    // client-supplied value.
    if (body && typeof body === "object") {
      delete (body as Record<string, unknown>).userId;
      delete (body as Record<string, unknown>).isPublic;
    }
    const project = await createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
