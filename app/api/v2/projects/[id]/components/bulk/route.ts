import { NextResponse } from "next/server";
import { createComponentsBatch } from "@/lib/apis/project/mongo/server";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const components = await createComponentsBatch(
      body.map((comp: any) => ({ ...comp, projectId }))
    );
    return NextResponse.json(components, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
