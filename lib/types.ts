export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'ghosted';

export interface Job {
  id: string;
  company_name: string;
  job_title: string;
  status: JobStatus;
  date_applied: string | null;
  job_url: string | null;
  notes: string | null;

  // Resume
  resume_path: string | null;
  resume_filename: string | null;
  resume_email: string | null;
  resume_phone: string | null;
  resume_location: string | null;
  resume_notes: string | null;
  resume_uploaded_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface ParsedResumeResult {
  email: string | null;
  phone: string | null;
  location: string | null;
  provider: 'gemini' | 'ollama' | 'manual';
  warnings: string[];
  needsManualEntry?: boolean;
}