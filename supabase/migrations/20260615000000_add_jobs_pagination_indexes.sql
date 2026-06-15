create index if not exists jobs_created_at_idx
  on public.jobs (created_at desc);

create index if not exists jobs_status_created_at_idx
  on public.jobs (status, created_at desc);
