import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/lib/apis/storage/server";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    
    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }
    
    await deleteFile(path);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
