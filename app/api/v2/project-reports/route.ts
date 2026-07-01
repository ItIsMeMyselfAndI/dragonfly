import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { project_id, report_name, report_data, pdf_url } = await req.json();

    const { data, error } = await supabase
      .from("project_reports")
      .insert([
        {
          id: `rep-gen-${Date.now()}`,
          project_id,
          report_name,
          report_data,
          pdf_url,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Report Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");

    if (!project_id) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("project_reports")
      .select("*")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Report Retrieval Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
