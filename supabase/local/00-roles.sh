#!/bin/sh
# Local-only bootstrap for the official GoTrue and PostgREST containers.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password '$POSTGRES_PASSWORD';
create role supabase_auth_admin login noinherit createrole password '$POSTGRES_PASSWORD';
grant anon, authenticated, service_role to authenticator;
create schema auth authorization supabase_auth_admin;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;
create function auth.uid() returns uuid language sql stable as \$\$
 select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
   nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
\$\$;
alter function auth.uid() owner to supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
SQL
