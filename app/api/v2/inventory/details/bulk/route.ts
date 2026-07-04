import { NextResponse } from "next/server";
import { createItemDetailsBatch } from "@/lib/apis/inventory/supabase/detailsServer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = await createItemDetailsBatch(body);
    return NextResponse.json(items, { status: 201 });
  } catch (error: any) {
    console.error("Error in createItemDetailsBatch API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
