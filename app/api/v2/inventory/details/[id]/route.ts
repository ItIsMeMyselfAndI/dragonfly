import { NextResponse } from "next/server";
import {
  getItemDetailsByInventoryId,
  updateItemDetails,
} from "@/lib/apis/inventory/mongo/server";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const details = await getItemDetailsByInventoryId(id);
    if (!details) {
      return NextResponse.json({ error: "Details not found" }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error: any) {
    console.error("Error in getItemDetails API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const details = await updateItemDetails(id, body);
    return NextResponse.json(details);
  } catch (error: any) {
    console.error("Error in updateItemDetails API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
