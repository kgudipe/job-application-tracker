'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/server';
import { uploadResume, deleteResume } from '@/lib/supabase/storage';

export async function attachResume(jobId: string, file: File) {
  const path = await uploadResume(jobId, file);

  const { error } = await supabase
    .from('jobs')
    .update({
      resume_path: path,
      resume_filename: file.name,
      resume_uploaded_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true, path };
}

export async function removeResume(jobId: string, path: string) {
  await deleteResume(path);

  const { error } = await supabase
    .from('jobs')
    .update({
      resume_path: null,
      resume_filename: null,
      resume_uploaded_at: null,
      resume_email: null,
      resume_phone: null,
      resume_location: null,
      resume_notes: null,
    })
    .eq('id', jobId);

  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}