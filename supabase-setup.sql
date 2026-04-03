-- ========================================
-- QuestDay Database Setup
-- ========================================

-- 1. Users 테이블
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  total_xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  max_streak integer default 0,
  created_at timestamptz default now()
);

-- 2. Quests 테이블 (메인 퀘스트 = D-Day)
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  target_date date not null,
  category text default '기타',
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- 3. Missions 테이블 (데일리 미션 = 투두)
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references public.quests(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  xp_reward integer default 10,
  is_completed boolean default false,
  completed_at timestamptz,
  date date default current_date,
  created_at timestamptz default now()
);

-- 4. Activity Log 테이블 (잔디 캘린더용)
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date,
  missions_completed integer default 0,
  xp_earned integer default 0,
  unique(user_id, date)
);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

alter table public.users enable row level security;
alter table public.quests enable row level security;
alter table public.missions enable row level security;
alter table public.activity_log enable row level security;

-- Users: 본인만 조회/수정
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Quests: 본인만 CRUD
create policy "Users can view own quests"
  on public.quests for select
  using (auth.uid() = user_id);

create policy "Users can create own quests"
  on public.quests for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quests"
  on public.quests for update
  using (auth.uid() = user_id);

create policy "Users can delete own quests"
  on public.quests for delete
  using (auth.uid() = user_id);

-- Missions: 본인만 CRUD
create policy "Users can view own missions"
  on public.missions for select
  using (auth.uid() = user_id);

create policy "Users can create own missions"
  on public.missions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own missions"
  on public.missions for update
  using (auth.uid() = user_id);

create policy "Users can delete own missions"
  on public.missions for delete
  using (auth.uid() = user_id);

-- Activity Log: 본인만 관리, 리더보드용 전체 조회 허용
create policy "Users can view all activity (leaderboard)"
  on public.activity_log for select
  using (true);

create policy "Users can insert own activity"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activity"
  on public.activity_log for update
  using (auth.uid() = user_id);

-- ========================================
-- 리더보드 VIEW (주간 XP 탑 10)
-- ========================================

create or replace view public.weekly_leaderboard as
select
  a.user_id,
  u.nickname,
  sum(a.xp_earned) as weekly_xp
from public.activity_log a
join public.users u on u.id = a.user_id
where a.date >= current_date - interval '7 days'
group by a.user_id, u.nickname
order by weekly_xp desc
limit 10;

-- ========================================
-- 자동 프로필 생성 (회원가입 시)
-- ========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
