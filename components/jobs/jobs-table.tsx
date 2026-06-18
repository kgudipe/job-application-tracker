'use client';

import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  useReactTable, getCoreRowModel, flexRender, type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown, Download, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import { JobFormModal } from './job-form-modal';
import { DeleteJobDialog } from './delete-job-dialog';
import { jobStatuses } from '@/lib/validations';
import { updateJobStatus } from '@/app/actions/jobs';
import type { Job, JobStatus } from '@/lib/types';

type SortColumn = 'company_name' | 'job_title' | 'date_applied' | 'created_at';

interface JobsTableProps {
  jobs: Job[];
  totalCount: number;
  page: number;
  pageCount: number;
  search: string;
  status: string;
  sort: SortColumn;
  direction: 'asc' | 'desc';
}

function formatStatus(status: JobStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function InlineStatusSelect({ job }: { job: Job }) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(job.status);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(value: string) {
    const nextStatus = value as JobStatus;
    setEditing(false);
    if (nextStatus === optimisticStatus) return;

    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      const result = await updateJobStatus(job.id, nextStatus);
      if (result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Could not update status');
        return;
      }

      toast.success('Status updated');
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setEditing(true)}
        disabled={isPending}
        title="Change status"
        aria-label={`Change status for ${job.company_name} ${job.job_title}`}
      >
        <StatusBadge status={optimisticStatus} />
      </button>
    );
  }

  return (
    <Select
      value={optimisticStatus}
      onValueChange={handleStatusChange}
      open={editing}
      onOpenChange={(open) => setEditing(open)}
      disabled={isPending}
    >
      <SelectTrigger
        size="sm"
        aria-label={`Change status for ${job.company_name} ${job.job_title}`}
        className="w-32 capitalize"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {jobStatuses.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {formatStatus(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function JobActions({ job }: { job: Job }) {
  const [loading, setLoading] = useState<'view' | 'download' | null>(null);
  const hasResume = !!job.resume_path;
  const resumeLabel = job.resume_filename || 'resume';

  async function getResumeUrl() {
    if (!job.resume_path) throw new Error('Missing resume');

    const res = await fetch(`/api/resume/signed-url?path=${encodeURIComponent(job.resume_path)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to get resume URL');
    return data.url as string;
  }

  async function handleView() {
    setLoading('view');
    try {
      const url = await getResumeUrl();
      window.open(url, '_blank');
    } catch {
      toast.error('Could not open resume.');
    } finally {
      setLoading(null);
    }
  }

  async function handleDownload() {
    setLoading('download');
    try {
      const url = await getResumeUrl();
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeLabel;
      a.click();
    } catch {
      toast.error('Could not download resume.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleView}
        disabled={!hasResume || !!loading}
        title={hasResume ? `View ${resumeLabel}` : 'No resume to view'}
        aria-label={hasResume ? `View ${resumeLabel}` : 'No resume to view'}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleDownload}
        disabled={!hasResume || !!loading}
        title={hasResume ? `Download ${resumeLabel}` : 'No resume to download'}
        aria-label={hasResume ? `Download ${resumeLabel}` : 'No resume to download'}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <JobFormModal mode="edit" job={job} />
      <DeleteJobDialog
        id={job.id}
        label={`${job.company_name} - ${job.job_title}`}
      />
    </div>
  );
}

export function JobsTable({
  jobs, totalCount, page, pageCount, search, status, sort, direction,
}: JobsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = useState(search);
  const [pageInput, setPageInput] = useState('');

  const navigate = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams();
    const current = {
      page: String(page), search, status, sort, direction,
      ...updates,
    };

    if (current.page !== '1') params.set('page', current.page);
    if (current.search) params.set('search', current.search);
    if (current.status !== 'all') params.set('status', current.status);
    if (current.sort !== 'created_at') params.set('sort', current.sort);
    if (current.direction !== 'desc') params.set('direction', current.direction);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [direction, page, pathname, router, search, sort, status]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timeout = window.setTimeout(() => {
      navigate({ page: '1', search: searchInput.trim() });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [navigate, search, searchInput]);

  const changeSort = useCallback((column: SortColumn) => {
    const nextDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';
    navigate({ page: '1', sort: column, direction: nextDirection });
  }, [direction, navigate, sort]);

  function goToPage() {
    const requestedPage = Number(pageInput);
    if (Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= pageCount) {
      navigate({ page: String(requestedPage) });
      setPageInput('');
    }
  }

  const columns = useMemo<ColumnDef<Job>[]>(() => [
    {
      accessorKey: 'company_name',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8"
          onClick={() => changeSort(column.id as SortColumn)}>
          Company <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.company_name}</span>,
    },
    {
      accessorKey: 'job_title',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8"
          onClick={() => changeSort(column.id as SortColumn)}>
          Title <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => row.original.job_title,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <InlineStatusSelect job={row.original} />,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8"
          onClick={() => changeSort(column.id as SortColumn)}>
          Applied <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = new Date(row.original.created_at);
        return (
          <span className="block whitespace-nowrap">
            <span className="block">{format(createdAt, 'MMM d, yyyy')}</span>
            <span className="block text-xs text-muted-foreground">
              {format(createdAt, 'h:mm a')}
            </span>
          </span>
        );
      },
    },
    {
      id: 'resume',
      header: 'Resume',
      cell: ({ row }) =>
        row.original.resume_path
          ? <span className="text-xs font-medium text-green-600 dark:text-green-400">✓</span>
          : <span className="text-muted-foreground text-xs select-none">—</span>,
    },
    {
      id: 'url',
      header: '',
      cell: ({ row }) =>
        row.original.job_url ? (
          <a href={row.original.job_url} target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground" title="Open job posting">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : <span className="text-muted-foreground select-none">—</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <JobActions job={row.original} />,
    },
  ], [changeSort]);

  const table = useReactTable({
    data: jobs, columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search company or title…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-sm"
      />
      <Select value={status} onValueChange={(value) => navigate({ page: '1', status: value })}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {jobStatuses.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="ml-auto text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? 'job' : 'jobs'}
      </span>
    </div>
  );

  if (jobs.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          {totalCount === 0 && !search && status === 'all'
            ? 'No jobs yet — add your first one!'
            : 'No jobs match your filters.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filterBar}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const job = row.original;
          return (
            <div key={job.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-tight">{job.company_name}</p>
                  <p className="text-sm text-muted-foreground">{job.job_title}</p>
                </div>
                <div className="shrink-0">
                  <JobActions job={job} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <InlineStatusSelect job={job} />
                {job.date_applied && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(job.date_applied + 'T00:00:00'), 'MMM d, yyyy')}
                  </span>
                )}
                {job.resume_path && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Resume
                  </span>
                )}
                {job.job_url && (
                  <a href={job.job_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Link
                  </a>
                )}
              </div>
              {job.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2">{job.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate({ page: String(page - 1) })}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Input
            type="number"
            min={1}
            max={pageCount}
            placeholder="Page"
            aria-label="Go to page"
            className="h-8 w-20"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={goToPage}
            onKeyDown={(event) => {
              if (event.key === 'Enter') goToPage();
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate({ page: String(page + 1) })}
            disabled={page >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
