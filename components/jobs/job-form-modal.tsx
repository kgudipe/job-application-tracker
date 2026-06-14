'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ResumeUpload } from '@/components/resume/resume-upload';
import { ResumeActions } from '@/components/resume/resume-actions';
import { jobSchema, jobStatuses, type JobFormValues } from '@/lib/validations';
import { createJob, updateJob } from '@/app/actions/jobs';
import type { Job } from '@/lib/types';

interface AddProps  { mode: 'add'; job?: never }
interface EditProps { mode: 'edit'; job: Job }

export function JobFormModal({ mode, job }: AddProps | EditProps) {
  const [open, setOpen]           = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);

  const hasResume = mode === 'edit' && !!job.resume_path && !replacing;

  function buildDefaults(): Partial<JobFormValues> {
    if (mode === 'edit' && job) {
      return {
        id:             job.id,
        company_name:   job.company_name,
        job_title:      job.job_title,
        status:         job.status,
        date_applied:   job.date_applied ?? '',
        job_url:        job.job_url ?? '',
        notes:          job.notes ?? '',
        resume_email:   job.resume_email ?? '',
        resume_phone:   job.resume_phone ?? '',
        resume_location:job.resume_location ?? '',
        resume_notes:   job.resume_notes ?? '',
      };
    }
    return {
      id: uuidv4(), status: 'applied',
      company_name: '', job_title: '',
      date_applied: '', job_url: '', notes: '',
      resume_email: '', resume_phone: '', resume_location: '', resume_notes: '',
    };
  }

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: buildDefaults() as JobFormValues,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setFile(null);
      setReplacing(false);
      form.reset(
        mode === 'add'
          ? { ...buildDefaults(), id: uuidv4() } as JobFormValues
          : buildDefaults() as JobFormValues,
      );
    }
  }

  async function onSubmit(values: JobFormValues) {
    const result =
      mode === 'add'
        ? await createJob(values, file ?? undefined)
        : await updateJob(values, file ?? undefined);

    if (result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Validation failed');
      return;
    }
    toast.success(mode === 'add' ? 'Job added!' : 'Job updated!');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Job
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Job' : 'Edit Job'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

          {/* ── Job Details ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Job Details
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company *</Label>
              <Input id="company_name" {...form.register('company_name')} />
              {form.formState.errors.company_name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.company_name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job_title">Title *</Label>
              <Input id="job_title" {...form.register('job_title')} />
              {form.formState.errors.job_title && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.job_title.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue={form.getValues('status')}
                onValueChange={(v) => form.setValue('status', v as JobFormValues['status'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {jobStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_applied">Date Applied</Label>
              <Input id="date_applied" type="date" {...form.register('date_applied')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job_url">Job URL</Label>
            <Input id="job_url" placeholder="https://…" {...form.register('job_url')} />
            {form.formState.errors.job_url && (
              <p className="text-xs text-destructive">
                {form.formState.errors.job_url.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...form.register('notes')} />
          </div>

          {/* ── Resume & AI Extraction ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resume
            </p>

            {hasResume ? (
              <ResumeActions
                jobId={job.id}
                resumePath={job.resume_path!}
                resumeFilename={job.resume_filename!}
                onReplace={() => { setReplacing(true); setFile(null); }}
              />
            ) : (
              <ResumeUpload file={file} onChange={setFile} />
            )}

            {/* Extracted / manual fields — always visible when a file is staged or resume exists */}
            {(file || (mode === 'edit' && job.resume_path)) && (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Contact info from resume — edit as needed
                </p>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="resume_email" className="text-xs">Email</Label>
                    <Input id="resume_email" className="h-8 text-sm" {...form.register('resume_email')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="resume_phone" className="text-xs">Phone</Label>
                    <Input id="resume_phone" className="h-8 text-sm" {...form.register('resume_phone')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="resume_location" className="text-xs">Location</Label>
                    <Input id="resume_location" className="h-8 text-sm" {...form.register('resume_location')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="resume_notes" className="text-xs">Resume notes</Label>
                    <Textarea id="resume_notes" rows={2} className="text-sm" {...form.register('resume_notes')} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}