-- Match the date range accepted by the app. PostgreSQL's "infinity" and
-- five-digit years cannot be rendered as ordinary event dates in the feed.
begin;
alter table public.events add constraint events_starts_at_renderable
  check (isfinite(starts_at) and starts_at < '10000-01-01 00:00:00+00'::timestamptz);
commit;
