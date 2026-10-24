-- Agitta MVP. Apply once in Supabase SQL Editor or via supabase db push.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null constraint events_author_id_fkey references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 100),
  description text not null check (char_length(btrim(description)) between 10 and 2000),
  starts_at timestamptz not null,
  venue text not null check (char_length(btrim(venue)) between 2 and 100),
  address text not null check (char_length(btrim(address)) between 5 and 240),
  region text not null check (char_length(btrim(region)) between 2 and 60),
  category text not null check (category in ('music', 'culture', 'food', 'sport')),
  price numeric(8,2) not null default 0 check (price >= 0 and price <= 100000),
  age_rating text not null default 'Livre' check (age_rating in ('Livre', '16', '18')),
  created_at timestamptz not null default now()
);

create table public.saved_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index events_starts_at_idx on public.events(starts_at);
create index events_author_id_idx on public.events(author_id);
create index events_category_starts_at_idx on public.events(category, starts_at);
create index saved_events_event_id_idx on public.saved_events(event_id);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.saved_events enable row level security;

create policy "Display author names" on public.profiles
  for select to anon, authenticated using (true);
create policy "Read published events" on public.events
  for select to anon, authenticated using (true);
create policy "Publish own future events" on public.events
  for insert to authenticated with check (auth.uid() = author_id and starts_at > now());
create policy "Read own saved events" on public.saved_events
  for select to authenticated using (auth.uid() = user_id);
create policy "Save events for yourself" on public.saved_events
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Unsave your events" on public.saved_events
  for delete to authenticated using (auth.uid() = user_id);

-- Name is public; email addresses remain exclusively in auth.users.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare display_name text;
begin
  display_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), 60);
  if char_length(display_name) < 2 then display_name := 'Pessoa da comunidade'; end if;
  insert into public.profiles(id, name) values(new.id, display_name);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Support accounts created before this migration without exposing their email.
insert into public.profiles(id, name)
select id,
  case when char_length(btrim(coalesce(raw_user_meta_data ->> 'name', ''))) >= 2
    then left(btrim(raw_user_meta_data ->> 'name'), 60)
    else 'Pessoa da comunidade' end
from auth.users on conflict (id) do nothing;

-- Explicit grants plus RLS: clients cannot change author names or edit/delete posts.
revoke all on public.profiles, public.events, public.saved_events from anon, authenticated;
grant select on public.profiles, public.events to anon, authenticated;
grant insert on public.events to authenticated;
grant select, insert, delete on public.saved_events to authenticated;

commit;
