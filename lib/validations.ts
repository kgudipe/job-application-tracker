import { z } from 'zod';

export const jobStatuses = ['applied', 'interview', 'offer', 'rejected', 'ghosted'] as const;

export const jobSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string().min(1, 'Company name is required'),
  job_title: z.string().min(1, 'Job title is required'),
  status: z.enum(jobStatuses),
  date_applied: z.string().nullable().optional(),
  job_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  notes: z.string().nullable().optional(),

  // Resume fields
  resume_notes: z.string().nullable().optional(),
  resume_email: z.string().nullable().optional(),
  resume_phone: z.string().nullable().optional(),
  resume_location: z.string().nullable().optional(),
});

export const parsedResumeSchema = z.object({
  email: z.string().email().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  location: z.string().nullable().catch(null),
});

export type JobFormValues = z.infer<typeof jobSchema>;