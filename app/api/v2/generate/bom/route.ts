import { generateBomLogic } from "@/lib/apis/generate/bomServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const specsContext = formData.get("specsContext") as string;
    const image = formData.get("image") as File | null;
    const projectId = formData.get("projectId") as string;

    if (!specsContext) {
      return NextResponse.json(
        { error: "Missing specsContext" },
        { status: 400 },
      );
    }

    const result = await generateBomLogic(specsContext, image, projectId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("BOM Gen Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate BOM" },
      { status: 500 },
    );
  }
}
