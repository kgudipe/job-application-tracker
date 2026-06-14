import { cn } from '@/lib/utils';
import type { JobStatus } from '@/lib/types';

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  applied:   { label: 'Applied',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  interview: { label: 'Interview', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  offer:     { label: 'Offer',     className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  ghosted:   { label: 'Ghosted',   className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}