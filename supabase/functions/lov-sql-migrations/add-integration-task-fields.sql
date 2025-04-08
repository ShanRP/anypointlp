
-- Add missing fields to apl_integration_tasks table
ALTER TABLE IF EXISTS public.apl_integration_tasks
ADD COLUMN IF NOT EXISTS flow_summary TEXT,
ADD COLUMN IF NOT EXISTS flow_implementation TEXT,
ADD COLUMN IF NOT EXISTS flow_constants TEXT,
ADD COLUMN IF NOT EXISTS pom_dependencies TEXT,
ADD COLUMN IF NOT EXISTS compilation_check TEXT;
