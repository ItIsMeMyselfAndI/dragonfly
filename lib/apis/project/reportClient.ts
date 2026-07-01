import { ReportModel } from "./reportTypes";

const API_BASE = "/api/v2/project-reports";

export async function createReport(report: Omit<ReportModel, 'id' | 'created_at' | 'updated_at'>): Promise<ReportModel> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error("Failed to create report record");
  return res.json();
}

export async function getReportsByProjectId(project_id: string): Promise<ReportModel[]> {
  const res = await fetch(`${API_BASE}?project_id=${project_id}`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}
