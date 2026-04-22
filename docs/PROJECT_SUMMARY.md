# EduDoc — Project Summary

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · React Hook Form + Zod · Supabase (Auth + Postgres + Realtime + Storage)

**Repo:** https://github.com/shiinbii/Bimbel (branch: `shiinbii` staging, `production` final)

**Supabase project:** `bwbpoqzmlowmtfsbxlkf.supabase.co`

**Deploy:** Vercel (auto-deploy on push ke production)

---

## 1. Scope Produk

EduDoc adalah platform bimbel online Indonesia untuk siswa SMA/sederajat menghadapi UTBK, UN, dan mandiri. Menyediakan:

- **Sistem poin** sebagai mata uang internal (top-up, expire 1 tahun, auto-upgrade tier)
- **Tier dinamis** — admin bisa rename/reatur threshold (Starter/Basic/Popular/Premium)
- **Quiz bank soal** dengan timer + anti-cheat (tab switch detection)
- **Zoom live grup** (dari tier Popular+)
- **Zoom privat 1-on-1** dengan guru (tier Premium eksklusif)
- **Helpdesk realtime** (student ↔ admin CS, tanpa bot)
- **4 peran**: STUDENT, TEACHER, ADMIN, SUPER_ADMIN
- **Payment flow**: VA Bank, GoPay, QRIS, Credit Card, Transfer Bank (manual konfirmasi)

---

## 2. Arsitektur Database (Supabase)

10 migration SQL sudah dijalankan (urut 001-010). Tabel utama:

### Auth & Users
- **auth.users** (built-in Supabase)
- **profiles** — 1:1 dengan auth.users, berisi role, tier, phone, avatar, deactivation state
  - Trigger `handle_new_user()` auto-insert saat signUp

### Helpdesk
- **helpdesk_sessions** — 1 baris per sesi chat student↔admin
- **helpdesk_messages** — isi pesan tiap sesi
- **helpdesk_presence** — heartbeat admin online
- Trigger `helpdesk_touch_session` update summary

### Points & Transactions
- **point_grants** — top-up events dengan expiry 1 tahun (FIFO consume)
- **point_history** — ledger GRANT/SPEND/EXPIRE
- **transactions** — event pembayaran (PENDING/SUCCESS/FAILED)
- **tier_configs** — definisi tier dinamis (admin editable)
- Functions: `compute_balance`, `apply_point_grant`, `spend_points`, `expire_point_grants`

### Quiz
- **quiz_tests** — bank soal (questions jsonb)
- **quiz_attempts** — riwayat pengerjaan + anti-cheat stats

### Zoom
- **zoom_sessions** — sesi grup terjadwal
- **zoom_enrollments** — siswa yang daftar ke sesi
- **private_zoom_requests** — 1-on-1 requests dengan status
- **private_chats** — chat per private request (dengan off-platform flag)

### Notifications
- **notifications** — user-scoped, kind enum (PRIVATE_ZOOM_*, CHAT_MESSAGE, ACCOUNT_WARNING, SYSTEM)
- Function `push_notification` dipanggil dari FE/trigger

### Payments
- **credit_packages** — paket poin yang dijual
- **payment_settings** — singleton row (metode aktif, VA banks, QRIS, GoPay, rekening transfer)

### Content
- **testimonials**, **brochures**, **teacher_profiles** — admin-managed
- **landing_content** — singleton dengan seluruh copy landing page (jsonb)
- **demo_video** — singleton YouTube URL

### Audit
- **audit_log** — actor + action + target + metadata
- Function `log_audit` untuk trace perubahan sensitif

### Security
- RLS enabled di semua tabel (permissive demo; akan diperketat pre-production)
- Helper `is_admin()` untuk policy admin-only
- Realtime publication aktif di 20+ tabel untuk live sync

---

## 3. Frontend Architecture

### Routing (App Router)
```
src/app/
├── (auth)/
│   ├── login, register, forgot-password
├── (student)/student/
│   ├── dashboard, quiz, zoom, private-zoom, history, quiz-history
├── (teacher)/teacher/
│   ├── dashboard, tests, sessions, students, private-zoom
├── (admin)/admin/
│   ├── dashboard, users, transactions, packages, payments, tiers,
│   ├── points, tests, zoom-sessions, teachers, testimonials,
│   ├── brochures, landing-content, demo-video, helpdesk
├── (super-admin)/super-admin/
│   ├── [sama + management, audit, settings]
├── auth/callback/     ← OAuth callback
├── account-deactivated/
└── api/               ← (empty — BE via Supabase)
```

### State Management
Tiap domain punya hook store di `src/lib/*-store.ts`:
- Semua pakai Supabase client + Realtime subscription
- Hook signature konsisten: `{ list, upsert, remove, loaded }`
- localStorage cuma untuk UI prefs (theme, OTP mask)

### Auth Flow
1. **Email+Password**: `signInWithPassword` → kirim OTP 8-digit via `signInWithOtp` → `verifyOtp` → route by profile.role
2. **Google OAuth**: `signInWithOAuth({ provider: 'google' })` → callback → cek profile, kalau baru redirect ke `/register?fromGoogle=1&email=...`
3. **Logout**: `signOut` via ProfileMenu

### Realtime
- Helpdesk: session + message + presence → sync <1 detik antar browser
- Notifications: bell badge update realtime
- Points: balance auto-update saat admin kasih hadiah
- Tier configs: admin edit langsung kelihatan di landing

---

## 4. Demo Data

- **4 tier default** di `tier_configs`: Starter (0 pt), Basic (250), Popular (600), Premium (1200)
- **4 credit packages** di `credit_packages`: 100/250/600/1200 poin
- **Payment settings singleton** dengan VA BCA/Mandiri + metode default
- **Landing content** — dari `defaultLandingContent` kalau DB kosong
- **Akun demo** auto-created on first login attempt via `ensureDemoAccount`:
  - `student.a-d@mail.com`, `teacher@mail.com`, `anjani@edudoc.id`, `admin.chat@edudoc.id`, `superadmin@mail.com`, dll
  - Password semua: `123456`

---

## 5. Items Scope (20-point list)

| # | Item | Status |
|---|------|--------|
| 1 | TierGate close + Kembali | ✅ |
| 2 | Zoom tier redirect | ✅ |
| 3 | Permintaan popup | ✅ |
| 4 | setState error fix | ✅ |
| 5 | Demo test accounts | ✅ |
| 6 | Live zoom block | ✅ |
| 7 | Beli Credit modal | ✅ |
| 8 | Credit admin config | ✅ |
| 9 | Payment methods toggle | ✅ |
| 10 | Toggle → Pengaturan Fitur | ✅ |
| 11 | Virtual Account config | ✅ |
| 12 | Konfirmasi Pembayaran | ✅ |
| 13 | Auto nominal picker | ✅ |
| 14 | Transfer Bank flow | ✅ |
| 15 | Remove Lihat Landing | ✅ |
| 16 | OTP mask + password toggle | ✅ |
| 17 | Rename Toggle Fitur | ✅ |
| 18 | Acorn template migration | ⏸ Deferred |
| 19 | Google OAuth (replaced from BE docs) | ✅ Code done; butuh config GCP + Supabase |
| 20 | BE as Supabase | ✅ Implicit |

---

## 6. CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): typecheck + lint tiap push
- **Vercel**: auto-deploy
  - `shiinbii` → preview URL per commit
  - `production` → live domain

---

## 7. Pending User Actions

### 7.1 Google OAuth Setup
1. Google Cloud Console → OAuth 2.0 Client ID (Web)
   - Redirect URI: `https://bwbpoqzmlowmtfsbxlkf.supabase.co/auth/v1/callback`
2. Supabase Dashboard → Auth → Providers → Google → enable + paste Client ID + Secret

### 7.2 Vercel Env Vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 7.3 Supabase Site URL (setelah deploy)
- Auth → URL Configuration → Site URL = domain Vercel
- Redirect URLs: wildcard `https://<domain>/**`

### 7.4 Email Template (opsional)
Sudah custom dengan `{{ .Token }}` — OTP 8 digit ke email Gmail.

---

## 8. Kredensial Development

- **Supabase URL:** `https://bwbpoqzmlowmtfsbxlkf.supabase.co`
- **Anon key:** di `.env.local` (gitignored)
- **Service role key:** tidak di-expose ke FE — untuk migration manual via dashboard
