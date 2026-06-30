-- Supabase Database Schema for Project Specs Reports
CREATE TABLE IF NOT EXISTS public.project_specs_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    CONSTRAINT project_specs_reports_project_id_unique UNIQUE (project_id)
);

-- Enable Row Level Security
ALTER TABLE public.project_specs_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to reports" 
ON public.project_specs_reports FOR SELECT 
USING (true);

CREATE POLICY "Allow service role full access to reports" 
ON public.project_specs_reports FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Index for faster lookups by project
CREATE INDEX idx_project_specs_reports_project_id ON public.project_specs_reports(project_id);
