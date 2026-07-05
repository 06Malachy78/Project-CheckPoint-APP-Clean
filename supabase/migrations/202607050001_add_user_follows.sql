create table public.user_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follows_no_self_follow check (follower_id <> following_id),
  constraint user_follows_pkey primary key (follower_id, following_id)
);

create index user_follows_following_id_idx on public.user_follows (following_id);
create index user_follows_follower_id_idx on public.user_follows (follower_id);

alter table public.user_follows enable row level security;

create policy "Anyone can view follows"
on public.user_follows
for select
using (true);

create policy "Users can follow others as themselves"
on public.user_follows
for insert
with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
on public.user_follows
for delete
using (auth.uid() = follower_id);
