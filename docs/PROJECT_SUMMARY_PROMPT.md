# Prompt Project Summary — untuk dilempar ke AI (Claude / ChatGPT / Gemini)

Kalau mau minta AI men-generate:
- Dokumentasi teknis
- Pitch deck copy
- README lengkap
- Proposal ke klien/investor
- User manual
- Test plan
- Roadmap fitur

…tinggal **copy prompt di bawah**, lalu tambahkan arahan spesifik di akhir
(misal: "buatkan README.md", atau "buatkan pitch 3-slide").

---

## PROMPT (copy semua yang di dalam code-block ini)

````
Saya sedang mengembangkan platform bimbel online bernama **EduDoc**. Berikut
konteks lengkapnya — gunakan untuk menjawab task di akhir prompt.

## 1. PRODUK

**Nama:** EduDoc
**Tagline:** Bimbel online yang terasa privat, belajar yang terukur.
**Target market:** Siswa SMA/sederajat Indonesia yang persiapan UTBK, UN,
seleksi mandiri, atau belajar terarah.
**Lokasi server & audiens:** Indonesia (Asia/Jakarta timezone, UI bahasa
Indonesia, pembayaran Rupiah)

## 2. VALUE PROPOSITION

1. **Quiz adaptif** — ribuan soal terkurasi dengan pembahasan detail per
   opsi, support import PDF/Word/Excel (bukan JSON saja).
2. **Sesi zoom live grup** dengan guru top — akses waiting room + chat
   room interaktif.
3. **Sesi privat 1-on-1** — student Premium bisa request sesi privat ke
   guru pilihan, dengan chat terpisah (off-platform contact ter-flag
   otomatis).
4. **Sistem poin fleksibel** — bayar sekali, poin bisa dipakai untuk quiz,
   sesi, atau bundle; expire 1 tahun per top-up, auto-extend saat top-up
   ulang.
5. **Tier auto-upgrade** — naik tier otomatis saat saldo poin cross
   threshold (Starter → Basic → Popular → Premium), admin bisa rename
   atau adjust threshold kapan saja.
6. **Helpdesk realtime** — chat admin CS langsung (tanpa bot), dengan
   bubble chat mengambang di semua halaman, online-status indicator.
7. **Anti-cheat bawaan** — tab-switch detection, timer pause, flagging
   otomatis > 5 kali pindah tab.

## 3. PERAN USER

| Role | Hak |
|------|-----|
| STUDENT | Quiz, sesi zoom grup (tier Popular+), private zoom (Premium), helpdesk chat, top-up |
| TEACHER | Kelola jadwal sesi, atur private zoom, buat soal import |
| ADMIN | Manage user, transaksi, paket harga, payment settings, tests, sesi, konten landing, helpdesk console, grant poin manual |
| SUPER_ADMIN | Semua admin + manajemen staff, audit log, system settings, enable/disable fitur global |

## 4. FLOW KUNCI

### Registrasi & Login
- Signup: Email+password (auto-signUp) atau Google OAuth
- Login: Password + email OTP 8-digit (2FA ringan, gratis via Supabase)
- Email konfirmasi aktif di production
- Akun deactivated otomatis kalau tidak login > 3 bulan ATAU saldo = 0
  (untuk STUDENT)

### Pembelian Poin
1. Student pilih paket (100/250/600/1200 poin — admin editable)
2. Pilih metode: VA Bank (BCA/Mandiri/BNI/BRI/Permata) / GoPay / QRIS /
   Credit Card / Transfer Bank manual
3. Stage konfirmasi → review
4. Stage bayar → instruksi metode
5. Auto-confirm untuk CC; manual untuk Transfer (upload bukti, admin
   review 1x24 jam)
6. Poin masuk via RPC `apply_point_grant` yang juga refresh expiry
   existing active grants jadi 1 tahun dari top-up baru

### Quiz
1. Pre-test → test dengan timer
2. Tab switch > 5x = flagged (tidak dapat pembahasan)
3. Tier Starter tidak dapat pembahasan (harus upgrade)
4. Anti-cheat lewat `document.visibilityState`, pause timer otomatis

### Private Zoom
1. Student Premium request (subject + topic + preferred times)
2. Teacher lihat di dashboard, set jadwal + URL zoom
3. Student confirm/reschedule/cancel dengan notifikasi dua arah
4. Live session punya chat terpisah, pesan dengan pattern email/WA/
   Telegram otomatis ter-flag (off-platform prevention)

## 5. TECH STACK

**Frontend:**
- Next.js 16 (App Router) + Turbopack
- TypeScript strict
- Tailwind CSS v4 (CSS-first config dengan @theme)
- Framer Motion untuk animasi (layoutId, AnimatePresence)
- React Hook Form + Zod validation
- react-hot-toast notifications
- lucide-react icons, Avatar component custom

**Backend (Supabase, 100% no-localStorage untuk data):**
- Postgres 15 dengan Row-Level Security
- Realtime channel subscription (menggantikan polling)
- Supabase Auth (email+password + email OTP + Google OAuth)
- Storage untuk avatar/brosur (TBD)
- Edge Functions TBD untuk: cron point expire, presence GC

**Database schema:** 23 tabel — profiles, tier_configs, point_grants,
point_history, transactions, credit_packages, payment_settings,
quiz_tests, quiz_attempts, zoom_sessions, zoom_enrollments,
private_zoom_requests, private_chats, notifications, helpdesk_sessions,
helpdesk_messages, helpdesk_presence, testimonials, brochures,
teacher_profiles, landing_content, demo_video, audit_log.

**Functions di DB:** compute_balance, apply_point_grant, spend_points,
expire_point_grants, push_notification, log_audit, is_admin,
handle_new_user, helpdesk_touch_session.

**Deployment:**
- Vercel (Hobby tier saat ini)
- Domain: (akan di-assign setelah Vercel setup)
- Supabase project: bwbpoqzmlowmtfsbxlkf (Free tier)

**CI/CD:**
- GitHub Actions: typecheck + lint pada push ke kedua branch
- Vercel auto-deploy: production branch → live, shiinbii branch →
  preview URL per commit

**Repo:** https://github.com/shiinbii/Bimbel
- Branch `shiinbii` = staging (dev aktif)
- Branch `production` = final release (merge manual)

## 6. STATUS SAAT INI

- Frontend + Backend full Supabase (no localStorage untuk data domain)
- 4 peran dengan RLS permissive-demo (akan diperketat pre-prod)
- Semua fitur dasar jalan: signup/login, quiz flow, tier gating, zoom,
  private zoom, helpdesk realtime, notifikasi, admin CRUD
- Pending config user: Google OAuth credentials (Google Cloud + Supabase
  Dashboard), Vercel env vars, Site URL Supabase

## 7. DESIGN LANGUAGE

- **Theme:** dual (light default + dark mode), CSS token-based via
  `--color-*` variables, swap dengan `[data-theme="dark"]`
- **Typography:** Instrument Serif untuk headline, Sora untuk body
- **Palette:** Indigo 500 (primary), Amber 500 (gold accent),
  bg-elevated surface style
- **Component aesthetic:** "terasa privat" — card gradient subtle,
  glow effect untuk highlight, shine hover pada CTA
- **Motion:** Framer Motion spring-based, snappy (stiffness 400+)

## 8. BUSINESS MODEL

- Free signup + pre-test gratis untuk user baru
- Paket poin mulai Rp 50.000 (100 poin) — Rp 350.000 (1200 poin + 200
  bonus)
- Revenue via top-up (pay once, pakai kapan saja dalam 1 tahun)
- Tidak ada langganan, tidak ada auto-renewal

---

## TASK YANG SAYA MAU KAMU KERJAKAN

[Isi di sini — contoh:]
- Buatkan README.md profesional untuk repo GitHub ini
- Buatkan pitch deck 8 slide dalam Markdown
- Draft proposal kerjasama ke sekolah/bimbel offline
- User manual untuk student (cara pakai platform)
- Test plan QA sebelum production release
- Roadmap fitur 6 bulan ke depan
- Copy landing page versi baru yang lebih punchy
- FAQ section untuk halaman bantuan
- Announcement post untuk Instagram/LinkedIn saat launch
- Analisis kompetitor (Ruangguru, Zenius, Pahamify) vs EduDoc

Pilih salah satu / lebih, atau ganti dengan permintaan spesifik kamu.

````

---

## Cara Pakai

1. **Copy** seluruh isi prompt di dalam triple-backtick atas
2. **Paste** ke Claude, ChatGPT, Gemini, atau AI lain
3. **Di baris terakhir**, ganti bagian `[Isi di sini]` dengan permintaan
   spesifik kamu
4. AI akan generate hasilnya menggunakan konteks lengkap EduDoc

## Tips

- **Bahasa output**: AI akan default pakai bahasa Indonesia karena prompt
  ini dalam Indonesia. Kalau mau English, tambahkan "output in English"
  di akhir.
- **Format output**: minta spesifik (Markdown, table, bullet list,
  JSON, HTML email body, dst)
- **Panjang**: batasi dengan "dalam 300 kata" atau "3 paragraf" supaya
  tidak bertele-tele
- **Tone**: "formal" / "casual" / "playful" / "technical" / "marketing"
