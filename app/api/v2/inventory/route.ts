import { NextResponse } from "next/server";
import { getAllItems, createItem } from "@/lib/apis/inventory/mongo/server";

export async function GET() {
  try {
    const components = await getAllItems();
    return NextResponse.json(components);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const component = await createItem(body);
    return NextResponse.json(component, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
