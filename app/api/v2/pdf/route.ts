import { NextRequest, NextResponse } from "next/server";
import { generatePdf } from "@/lib/apis/pdf/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pdfBytes = await generatePdf(body);
  const fileName = `${body.projectName || "report"}.pdf`;
  
  return new NextResponse(pdfBytes as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
