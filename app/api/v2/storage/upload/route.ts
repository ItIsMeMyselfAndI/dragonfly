import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/apis/storage/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    
    if (!file || !path) {
      return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await uploadFile(path, buffer, file.type);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
