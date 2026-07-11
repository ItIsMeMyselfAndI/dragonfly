import { NextResponse } from "next/server";
import {
  getEdgesByProjectId,
  createEdge,
} from "@/lib/apis/project/mongo/server";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const edges = await getEdgesByProjectId(id);
    return NextResponse.json(edges);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const edge = await createEdge(body, projectId);
    return NextResponse.json(edge);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
