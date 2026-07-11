import { NextResponse } from "next/server";
import { createEdgesBatch } from "@/lib/apis/project/mongo/server";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const edges = await createEdgesBatch(
      body.map((edge: any) => ({ ...edge, projectId }))
    );
    return NextResponse.json(edges, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
