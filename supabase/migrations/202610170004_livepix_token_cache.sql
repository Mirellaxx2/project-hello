-- Persistent OAuth token cache for LivePix (survives Edge Function restarts/instances).
create table if not exists public.livepix_tokens (
  id boolean primary key default true check (id),
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.livepix_tokens enable row level security;

-- No policies: anon/authenticated cannot read or write. Only the service role
-- (used inside Edge Functions) bypasses RLS and accesses this table.
revoke all on public.livepix_tokens from anon, authenticated;
grant select, insert, update on public.livepix_tokens to service_role;
