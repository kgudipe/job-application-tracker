'use client';

import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type SortingState,
    type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import { JobFormModal } from './job-form-modal';
import { DeleteJobDialog } from './delete-job-dialog';
import { jobStatuses } from '@/lib/validations';
import type { Job } from '@/lib/types';

export function JobsTable({ jobs }: { jobs: Job[] }) {
    const [sorting, setSorting] = useState<SortingState>([
        { id: 'company_name', desc: false },
    ]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = useMemo(() => {
        let rows = jobs;
        if (statusFilter !== 'all') rows = rows.filter((j) => j.status === statusFilter);
        if (globalFilter.trim()) {
            const q = globalFilter.toLowerCase();
            rows = rows.filter(
                (j) =>
                    j.company_name.toLowerCase().includes(q) ||
                    j.job_title.toLowerCase().includes(q),
            );
        }
        return rows;
    }, [jobs, statusFilter, globalFilter]);

    const columns = useMemo<ColumnDef<Job>[]>(
        () => [
            {
                accessorKey: 'company_name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Company
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.company_name}</span>
                ),
            },
            {
                accessorKey: 'job_title',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Title
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                ),
                cell: ({ row }) => row.original.job_title,
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
            {
                accessorKey: 'date_applied',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Applied
                        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                ),
                cell: ({ row }) =>
                    row.original.date_applied
                        ? format(new Date(row.original.date_applied + 'T00:00:00'), 'MMM d, yyyy')
                        : '—',
                sortingFn: (a, b) => {
                    const da = a.original.date_applied ?? '';
                    const db = b.original.date_applied ?? '';
                    return da < db ? -1 : da > db ? 1 : 0;
                },
            },
            {
                id: 'resume',
                header: 'Resume',
                cell: ({ row }) =>
                    row.original.resume_path ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓</span>
                    ) : (
                        <span className="text-muted-foreground select-none text-xs">—</span>
                    ),
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <JobFormModal mode="edit" job={row.original} />
                        <DeleteJobDialog
                            id={row.original.id}
                            label={`${row.original.company_name} — ${row.original.job_title}`}
                        />
                    </div>
                ),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    placeholder="Search company or title…"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
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
                    {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'}
                </span>
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                    {jobs.length === 0
                        ? 'No jobs yet — add your first one!'
                        : 'No jobs match your filters.'}
                </div>
            ) : (
                <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-left font-medium text-muted-foreground"
                                        >
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
            )}
        </div>
    );
}