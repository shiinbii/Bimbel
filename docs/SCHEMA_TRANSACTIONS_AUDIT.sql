-- ============================================================
-- EduDoc — Schema untuk tabel transactions + audit_logs
-- Paste ke Supabase SQL Editor lalu run sekali.
-- Setelah ini, halaman /admin/transactions dan /admin/audit akan
-- baca dari Supabase (chip "Data dummy" hilang begitu ada row).
-- ============================================================

-- 1) TRANSACTIONS
create table if not exists public.transactions (
  id            text primary key,
  user_id       uuid references public.profiles(id) on delete set null,
  user_name     text not null,
  user_email    text,
  package_name  text not null,
  amount        numeric(12, 0) not null default 0,
  points        integer not null default 0,
  method        text not null,
  status        text not null check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_transactions_created_at on public.transactions (created_at desc);
create index if not exists idx_transactions_status     on public.transactions (status);
create index if not exists idx_transactions_user_id    on public.transactions (user_id);

-- RLS: super admin & admin dapat lihat semua; user biasa cuma lihat milik sendiri
alter table public.transactions enable row level security;

drop policy if exists tx_admin_read on public.transactions;
create policy tx_admin_read on public.transactions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

drop policy if exists tx_user_read on public.transactions;
create policy tx_user_read on public.transactions
  for select using (user_id = auth.uid());

drop policy if exists tx_admin_write on public.transactions;
create policy tx_admin_write on public.transactions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- User yang login boleh insert transaksi untuk dirinya sendiri (flow beli paket poin)
drop policy if exists tx_self_insert on public.transactions;
create policy tx_self_insert on public.transactions
  for insert with check (user_id = auth.uid());


-- 2) AUDIT LOGS
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  actor       text not null,
  actor_id    uuid references public.profiles(id) on delete set null,
  role        text not null check (role in ('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN')),
  target      text not null,
  ip          text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_role       on public.audit_logs (role);

alter table public.audit_logs enable row level security;

-- Audit log hanya super admin yang boleh lihat
drop policy if exists audit_super_admin_read on public.audit_logs;
create policy audit_super_admin_read on public.audit_logs
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'SUPER_ADMIN'
    )
  );

-- READ: tetap super admin only (di-define di atas sebagai audit_super_admin_read).
-- INSERT: siapa saja yang authed boleh insert selama actor-nya email miliknya sendiri.
-- Artinya:
--   - Student/teacher/admin/super-admin bisa ter-log saat login/logout
--   - Tapi user tidak bisa memalsukan actor jadi orang lain
--   - Hanya super admin yang bisa BACA log (SELECT policy tidak diubah)
drop policy if exists audit_admin_write on public.audit_logs;
drop policy if exists audit_authed_insert on public.audit_logs;
create policy audit_authed_insert on public.audit_logs
  for insert with check (
    actor = coalesce(auth.jwt() ->> 'email', '')
    and auth.uid() is not null
  );


-- 3) Optional: realtime publication supaya UI auto-refresh
-- Wrap di DO block supaya idempotent (no-op kalau table sudah terdaftar).
do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.audit_logs;
exception when duplicate_object then null;
end $$;


-- ============================================================
-- Contoh insert (opsional — untuk testing)
-- ============================================================
-- insert into public.transactions
--   (id, user_name, user_email, package_name, amount, points, method, status, created_at)
-- values
--   ('TX0001', 'Rafa Pratama',   'rafa@edudoc.id',  'Pro',     200000, 600, 'GoPay',   'SUCCESS', now() - interval '2 hour'),
--   ('TX0002', 'Sinta Maulida',  'sinta@edudoc.id', 'Basic',   100000, 250, 'BCA VA',  'SUCCESS', now() - interval '4 hour'),
--   ('TX0003', 'Bima Satria',    'bima@edudoc.id',  'Starter',  50000, 100, 'QRIS',    'PENDING', now() - interval '1 day');
--
-- insert into public.audit_logs (action, actor, role, target, ip) values
--   ('USER_DEACTIVATE', 'admin@edudoc.id', 'SUPER_ADMIN', 'user:u_123', '10.0.0.1'),
--   ('PACKAGE_CREATE',  'admin@edudoc.id', 'ADMIN',       'pkg_500',    '10.0.0.1');
