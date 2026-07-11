import { NextResponse } from "next/server";
import {
  getNodesByProjectId,
  createNode,
} from "@/lib/apis/project/mongo/server";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const nodes = await getNodesByProjectId(id);
    return NextResponse.json(nodes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const node = await createNode(body, projectId);
    return NextResponse.json(node);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
