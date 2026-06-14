'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/server';
import { jobSchema } from '@/lib/validations';
import type { JobFormValues } from '@/lib/validations';

export async function createJob(values: JobFormValues) {
  const parsed = jobSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from('jobs').insert({
    id: parsed.data.id,
    company_name: parsed.data.company_name,
    job_title: parsed.data.job_title,
    status: parsed.data.status,
    date_applied: parsed.data.date_applied || null,
    job_url: parsed.data.job_url || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function updateJob(values: JobFormValues) {
  const parsed = jobSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
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
    })
    .eq('id', parsed.data.id);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}