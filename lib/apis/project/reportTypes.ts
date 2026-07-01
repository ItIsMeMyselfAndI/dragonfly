export interface ReportModel {
  id: string;
  project_id: string;
  report_name: string;
  report_data: any; // JSONB
  pdf_url?: string;
  created_at?: string;
  updated_at?: string;
}
