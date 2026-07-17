# Online Multiplayer Setup

This project uses Supabase Auth anonymous sessions and Realtime to synchronize a two-player match.

## 1. Enable anonymous sign-ins

In the Supabase dashboard, open `Authentication` > `Providers` > `Anonymous` and enable anonymous sign-ins.

## 2. Create the match table

Open `SQL Editor`, create a new query, paste the following SQL, and run it once.

```sql
create table if not exists public.online_matches (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (char_length(room_code) = 6),
  host_id uuid not null,
  guest_id uuid,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  game_state jsonb not null,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.online_matches enable row level security;

create policy "Players can create matches"
on public.online_matches for insert to authenticated
with check (auth.uid() = host_id);

create policy "Players can find waiting matches or their own match"
on public.online_matches for select to authenticated
using (status = 'waiting' or auth.uid() = host_id or auth.uid() = guest_id);

create policy "Players can claim a waiting match"
on public.online_matches for update to authenticated
using (status = 'waiting' and guest_id is null)
with check (guest_id = auth.uid());

create policy "Players can update their active match"
on public.online_matches for update to authenticated
using (auth.uid() = host_id or auth.uid() = guest_id)
with check (auth.uid() = host_id or auth.uid() = guest_id);

alter publication supabase_realtime add table public.online_matches;
```

The initial version uses the room code as the invitation secret and validates game actions in the browser. A server-authoritative Edge Function is the next security upgrade before public matchmaking.

## 3. Configure GitHub Pages

Add these repository action secrets in GitHub under `Settings` > `Secrets and variables` > `Actions`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only the publishable key belongs in the browser. Never expose a Supabase secret key, a service-role key, or the database password.
