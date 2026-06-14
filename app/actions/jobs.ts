'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/server';
import { uploadResume, deleteResume } from '@/lib/supabase/storage';
import { jobSchema, type JobFormValues } from '@/lib/validations';

export async function createJob(values: JobFormValues, file?: File) {
  const parsed = jobSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  let resumeFields = {};
  if (file) {
    const path = await uploadResume(parsed.data.id, file);
    resumeFields = {
      resume_path: path,
      resume_filename: file.name,
      resume_uploaded_at: new Date().toISOString(),
      resume_email: parsed.data.resume_email || null,
      resume_phone: parsed.data.resume_phone || null,
      resume_location: parsed.data.resume_location || null,
      resume_notes: parsed.data.resume_notes || null,
    };
  }

  const { error } = await supabase.from('jobs').insert({
    id: parsed.data.id,
    company_name: parsed.data.company_name,
    job_title: parsed.data.job_title,
    status: parsed.data.status,
    date_applied: parsed.data.date_applied || null,
    job_url: parsed.data.job_url || null,
    notes: parsed.data.notes || null,
    ...resumeFields,
  });

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateJob(values: JobFormValues, file?: File) {
  const parsed = jobSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  let resumeFields = {};
  if (file) {
    const path = await uploadResume(parsed.data.id, file);
    resumeFields = {
      resume_path: path,
      resume_filename: file.name,
      resume_uploaded_at: new Date().toISOString(),
      resume_email: parsed.data.resume_email || null,
      resume_phone: parsed.data.resume_phone || null,
      resume_location: parsed.data.resume_location || null,
      resume_notes: parsed.data.resume_notes || null,
    };
  } else {
    // Preserve existing AI-extracted fields on edit without a new file
    resumeFields = {
      resume_email: parsed.data.resume_email || null,
      resume_phone: parsed.data.resume_phone || null,
      resume_location: parsed.data.resume_location || null,
      resume_notes: parsed.data.resume_notes || null,
    };
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      company_name: parsed.data.company_name,
      job_title: parsed.data.job_title,
      status: parsed.data.status,
      date_applied: parsed.data.date_applied || null,
      job_url: parsed.data.job_url || null,
      notes: parsed.data.notes || null,
      ...resumeFields,
    })
    .eq('id', parsed.data.id);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function deleteJob(id: string) {
  // Remove storage object first if one exists
  const { data } = await supabase
    .from('jobs')
    .select('resume_path')
    .eq('id', id)
    .single();

  if (data?.resume_path) {
    await deleteResume(data.resume_path).catch(() => null);
  }

  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}