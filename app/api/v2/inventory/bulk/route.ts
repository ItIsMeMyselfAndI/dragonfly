import { NextResponse } from "next/server";
import { createItemsBatch } from "@/lib/apis/inventory/mongo/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = await createItemsBatch(body);
    return NextResponse.json(items, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
