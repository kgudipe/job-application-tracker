import { supabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JobsTable } from '@/components/jobs/jobs-table';
import { JobFormModal } from '@/components/jobs/job-form-modal';
import { jobStatuses } from '@/lib/validations';
import type { Job } from '@/lib/types';

const PAGE_SIZE = 10;
const sortColumns = ['company_name', 'job_title', 'date_applied', 'created_at'] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type SortColumn = (typeof sortColumns)[number];

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(getParam(params.page), 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = getParam(params.search).trim().slice(0, 100);
  const requestedStatus = getParam(params.status);
  const status = jobStatuses.includes(requestedStatus as (typeof jobStatuses)[number])
    ? requestedStatus
    : 'all';
  const requestedSort = getParam(params.sort);
  const sort: SortColumn = sortColumns.includes(requestedSort as SortColumn)
    ? requestedSort as SortColumn
    : 'created_at';
  const direction = getParam(params.direction) === 'asc' ? 'asc' : 'desc';
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' });

  if (status !== 'all') query = query.eq('status', status);

  const safeSearch = search.replace(/[^\p{L}\p{N}\s&'’-]/gu, ' ').trim();
  if (safeSearch) {
    query = query.or(
      `company_name.ilike.%${safeSearch}%,job_title.ilike.%${safeSearch}%`,
    );
  }

  const { data: jobs, count, error } = await query
    .order(sort, { ascending: direction === 'asc', nullsFirst: false })
    .order('id', { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Failed to load jobs: {error.message}</p>
      </div>
    );
  }

  const totalCount = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (page > pageCount) {
    const normalizedParams = new URLSearchParams();
    if (pageCount > 1) normalizedParams.set('page', String(pageCount));
    if (search) normalizedParams.set('search', search);
    if (status !== 'all') normalizedParams.set('status', status);
    if (sort !== 'created_at') normalizedParams.set('sort', sort);
    if (direction !== 'desc') normalizedParams.set('direction', direction);
    const queryString = normalizedParams.toString();
    redirect(queryString ? `/?${queryString}` : '/');
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
        <JobsTable
          jobs={(jobs as Job[]) ?? []}
          totalCount={totalCount}
          page={page}
          pageCount={pageCount}
          search={search}
          status={status}
          sort={sort}
          direction={direction}
        />
      </main>
    </div>
  );
}
