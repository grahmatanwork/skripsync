create table if not exists public.trackers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.set_tracker_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trackers_updated_at
before update on public.trackers
for each row execute function public.set_tracker_updated_at();

alter table public.trackers enable row level security;
revoke all on public.trackers from anon;
grant select, insert, update on public.trackers to authenticated;

create policy "Users read own tracker" on public.trackers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own tracker" on public.trackers
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own tracker" on public.trackers
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
