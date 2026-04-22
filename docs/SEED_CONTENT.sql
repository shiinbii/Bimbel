-- ============================================================
-- EduDoc — Seed data untuk Content Tables
-- Paste ke Supabase SQL Editor, run sekali saja.
-- Setelah ini, halaman landing akan punya konten contoh, dan admin
-- bisa edit via /admin/testimonials, /admin/brochures, /admin/teachers
-- ============================================================

-- 1) Testimonials
insert into public.testimonials (id, name, role, avatar, message, rating, "order") values
  ('ts_1', 'Naomi Ardelia', 'Alumni · Kedokteran UI', null,
   'EduDoc membuat belajar jadi terstruktur dan menyenangkan. Mock-up UTBK yang adaptif bener-bener ngebantu mapping kemampuan.', 5, 1),
  ('ts_2', 'Arkan Yudhistira', 'Alumni · Teknik Kimia ITB', null,
   'Fitur video quiz game changer — saya bisa pahami materi dulu sebelum langsung ngerjain soal. Nilai UTBK naik drastis.', 5, 2),
  ('ts_3', 'Zahra Aqila', 'Penerima Beasiswa NTU', null,
   'Sesi zoom EduDoc seru banget, seperti belajar bersama teman. Guru-gurunya sabar dan to the point.', 5, 3),
  ('ts_4', 'Daffa Rasyid', 'Siswa · SMAN 1 Bandung', null,
   'Sistem poinnya fleksibel, jadi gak berasa langganan. Bayar sekali bisa dipake kapan aja dalam setahun.', 5, 4)
on conflict (id) do nothing;

-- 2) Brochures (banner alumni) — gambar placeholder SVG pastel
insert into public.brochures (id, image, title, subtitle, "order") values
  ('br1',
   'https://placehold.co/1200x600/6366f1/ffffff?text=Naomi+Ardelia+%7C+Kedokteran+UI',
   'Naomi Ardelia',
   'Lolos Kedokteran UI 2025',
   1),
  ('br2',
   'https://placehold.co/1200x600/f59e0b/ffffff?text=Arkan+Yudhistira+%7C+Teknik+Kimia+ITB',
   'Arkan Yudhistira',
   'Teknik Kimia ITB · SNBT 2026',
   2),
  ('br3',
   'https://placehold.co/1200x600/10b981/ffffff?text=Zahra+Aqila+%7C+Beasiswa+NTU',
   'Zahra Aqila',
   'Beasiswa NTU Singapore',
   3)
on conflict (id) do nothing;

-- 3) Teacher profiles
insert into public.teacher_profiles (id, name, email, subject, rating, students, sessions, status, photo, description, stats) values
  ('t1', 'Ibu Anjani', 'anjani@edudoc.id', 'Matematika', 4.9, 312, 48, 'ACTIVE', null,
   'Alumni ITB Matematika, 8 tahun pengalaman mengajar UTBK. Spesialisasi aljabar, geometri analitik, dan trigonometri tingkat lanjut.',
   '{"penjelasan":9.2,"interaktif":8.5,"penguasaan":9.5,"ketepatan":9.0,"motivasi":8.8,"kesabaran":9.0}'::jsonb),

  ('t2', 'Pak Rizal', 'rizal@edudoc.id', 'Kimia', 4.8, 250, 39, 'ACTIVE', null,
   'Alumni UI Kimia, peraih medali OSN. Mengajar kimia organik dan anorganik dengan pendekatan soal-centric dan studi kasus real.',
   '{"penjelasan":9.0,"interaktif":8.8,"penguasaan":9.5,"ketepatan":9.2,"motivasi":8.5,"kesabaran":8.8}'::jsonb),

  ('t3', 'Ms. Clara', 'clara@edudoc.id', 'Bahasa Inggris', 5.0, 401, 60, 'ACTIVE', null,
   'Native-level fluency, sertifikasi IELTS 8.5. Fokus pada speaking confidence, writing structure, dan advanced vocabulary.',
   '{"penjelasan":9.5,"interaktif":9.5,"penguasaan":9.2,"ketepatan":9.0,"motivasi":9.6,"kesabaran":9.4}'::jsonb),

  ('t4', 'Pak Fajar', 'fajar@edudoc.id', 'Fisika', 4.7, 187, 33, 'ACTIVE', null,
   'Master Teacher Fisika dengan 10+ tahun pengalaman. Kuat di listrik-magnet, mekanika, dan pembahasan soal Olimpiade.',
   '{"penjelasan":8.8,"interaktif":8.0,"penguasaan":9.5,"ketepatan":9.0,"motivasi":8.2,"kesabaran":8.6}'::jsonb),

  ('t5', 'Bu Sarah', 'sarah@edudoc.id', 'Biologi', 4.8, 226, 42, 'ACTIVE', null,
   'Dokter umum alumni Unpad, 6 tahun ngajar biologi SMA. Ahli dalam sistem tubuh manusia, genetika, dan ekologi.',
   '{"penjelasan":9.0,"interaktif":9.0,"penguasaan":9.3,"ketepatan":8.8,"motivasi":9.2,"kesabaran":9.5}'::jsonb)
on conflict (id) do nothing;
