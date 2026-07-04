import { NextResponse } from "next/server";
import { createItemDetails } from "@/lib/apis/inventory/supabase/detailsServer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const details = await createItemDetails(body);
    return NextResponse.json(details, { status: 201 });
  } catch (error: any) {
    console.error("Error in createItemDetails API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
