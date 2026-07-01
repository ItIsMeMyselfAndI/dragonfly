-- PDF Specs Calculation Reports Schema
-- Links reports to specific projects

CREATE TABLE IF NOT EXISTS project_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    report_data JSONB NOT NULL, -- Storing the structured data used for generating the PDF
    pdf_url TEXT, -- URL to the generated PDF (e.g., in storage)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by project
CREATE INDEX IF NOT EXISTS idx_project_reports_project_id ON project_reports(project_id);
