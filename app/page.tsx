import { supabase } from '@/lib/supabase/server';
import { JobsTable } from '@/components/jobs/jobs-table';
import { JobFormModal } from '@/components/jobs/job-form-modal';
import type { Job } from '@/lib/types';

export default async function DashboardPage() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Failed to load jobs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Job Tracker</h1>
          <JobFormModal mode="add" />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <JobsTable jobs={(jobs as Job[]) ?? []} />
      </main>
    </div>
  );
}