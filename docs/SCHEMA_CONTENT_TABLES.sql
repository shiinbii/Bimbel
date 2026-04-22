-- ============================================================
-- EduDoc — Schema untuk tabel konten yang diedit dari admin
-- Jalankan di Supabase SQL Editor.
-- Setelah ini, data yang ditambah dari /admin/* akan persist dan
-- langsung tampil di landing page.
-- ============================================================

-- Helper: deteksi role admin/super admin dari profiles
-- (pakai ini di RLS policy)
create or replace function public.is_admin_role() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- ============================================================
-- 1) TESTIMONIALS
-- ============================================================
create table if not exists public.testimonials (
  id        text primary key,
  name      text not null,
  role      text not null,
  avatar    text,
  message   text not null,
  rating    integer not null default 5 check (rating between 1 and 5),
  "order"   integer not null default 0
);

alter table public.testimonials enable row level security;

drop policy if exists ts_public_read on public.testimonials;
create policy ts_public_read on public.testimonials
  for select using (true);

drop policy if exists ts_admin_write on public.testimonials;
create policy ts_admin_write on public.testimonials
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 2) BROCHURES (Slider Alumni)
-- ============================================================
create table if not exists public.brochures (
  id        text primary key,
  image     text not null,
  title     text not null,
  subtitle  text,
  "order"   integer not null default 0
);

alter table public.brochures enable row level security;

drop policy if exists br_public_read on public.brochures;
create policy br_public_read on public.brochures
  for select using (true);

drop policy if exists br_admin_write on public.brochures;
create policy br_admin_write on public.brochures
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 3) TEACHER PROFILES
-- ============================================================
create table if not exists public.teacher_profiles (
  id           text primary key,
  name         text not null,
  email        text not null,
  subject      text not null,
  rating       numeric(3, 1) not null default 5,
  students     integer not null default 0,
  sessions     integer not null default 0,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  photo        text,
  description  text not null default '',
  stats        jsonb not null default '{}'::jsonb
);

alter table public.teacher_profiles enable row level security;

drop policy if exists tp_public_read on public.teacher_profiles;
create policy tp_public_read on public.teacher_profiles
  for select using (true);

drop policy if exists tp_admin_write on public.teacher_profiles;
create policy tp_admin_write on public.teacher_profiles
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 4) CREDIT PACKAGES (Paket Harga)
-- ============================================================
create table if not exists public.credit_packages (
  id        text primary key,
  points    integer not null,
  price     numeric(12, 0) not null,
  bonus     integer not null default 0,
  popular   boolean not null default false,
  "order"   integer not null default 0,
  active    boolean not null default true
);

alter table public.credit_packages enable row level security;

drop policy if exists cp_public_read on public.credit_packages;
create policy cp_public_read on public.credit_packages
  for select using (true);

drop policy if exists cp_admin_write on public.credit_packages;
create policy cp_admin_write on public.credit_packages
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 5) COIN PRICING (Point Pricing)
-- ============================================================
create table if not exists public.coin_pricing (
  id          text primary key,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.coin_pricing enable row level security;

drop policy if exists cop_public_read on public.coin_pricing;
create policy cop_public_read on public.coin_pricing
  for select using (true);

drop policy if exists cop_admin_write on public.coin_pricing;
create policy cop_admin_write on public.coin_pricing
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 6) LANDING CONTENT
-- ============================================================
create table if not exists public.landing_content (
  id          text primary key,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.landing_content enable row level security;

drop policy if exists lc_public_read on public.landing_content;
create policy lc_public_read on public.landing_content
  for select using (true);

drop policy if exists lc_admin_write on public.landing_content;
create policy lc_admin_write on public.landing_content
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 7) DEMO VIDEO
-- ============================================================
create table if not exists public.demo_video (
  id          text primary key,
  url         text not null,
  updated_at  timestamptz not null default now()
);

alter table public.demo_video enable row level security;

drop policy if exists dv_public_read on public.demo_video;
create policy dv_public_read on public.demo_video
  for select using (true);

drop policy if exists dv_admin_write on public.demo_video;
create policy dv_admin_write on public.demo_video
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 8) QUIZ TESTS (Kelola Soal)
-- ============================================================
create table if not exists public.quiz_tests (
  id                    text primary key,
  title                 text not null,
  subject               text not null,
  type                  text not null check (type in ('PRE_TEST', 'EXAM', 'VIDEO_QUIZ')),
  duration              integer not null default 30,
  cost                  integer not null default 0,
  total_questions       integer not null default 0,
  require_video         boolean not null default false,
  video_url             text,
  passing_score         integer not null default 70,
  description           text not null default '',
  questions             jsonb not null default '[]'::jsonb,
  active                boolean not null default true,
  questions_per_attempt integer not null default 10,
  shuffle_questions     boolean not null default true,
  shuffle_options       boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table public.quiz_tests enable row level security;

drop policy if exists qt_public_read on public.quiz_tests;
create policy qt_public_read on public.quiz_tests
  for select using (true);

drop policy if exists qt_admin_write on public.quiz_tests;
create policy qt_admin_write on public.quiz_tests
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- ============================================================
-- 9) Realtime publication (idempotent)
-- ============================================================
do $$
declare
  t record;
  tables text[] := array[
    'testimonials', 'brochures', 'teacher_profiles',
    'credit_packages', 'coin_pricing', 'landing_content',
    'demo_video', 'quiz_tests'
  ];
begin
  foreach t.table_name in array tables loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t.table_name);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
