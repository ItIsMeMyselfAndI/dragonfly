import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { ProjectReportModel } from "@/lib/mongodb/models/projectReport";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { project_id, report_name, report_data, pdf_url } = await req.json();

    const doc = await ProjectReportModel.create({
      _id: `rep-gen-${Date.now()}`,
      project_id,
      report_name,
      report_data,
      pdf_url,
    });

    return NextResponse.json(doc);
  } catch (error: unknown) {
    console.error("Report Creation Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");

    if (!project_id) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
    }

    const docs = await ProjectReportModel.find({ project_id })
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json(docs);
  } catch (error: unknown) {
    console.error("Report Retrieval Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
