# Prompt untuk Generate ERD (Entity Relationship Diagram)

Gunakan prompt berikut di ChatGPT, Claude, atau tool ERD generator
(mermaid.js, dbdiagram.io, Lucidchart AI, eraser.io, dll) untuk membuat ERD.

---

## PROMPT (copy-paste ke AI tool)

```
Buatkan ERD (Entity Relationship Diagram) dalam format Mermaid ER diagram
untuk database platform bimbel online bernama EduDoc. Berikut detail schema
lengkapnya:

## Tabel Utama

### 1. profiles (1:1 dengan auth.users Supabase)
- id: uuid PRIMARY KEY references auth.users(id) ON DELETE CASCADE
- email: text UNIQUE NOT NULL
- name: text NOT NULL
- phone: text NULLABLE
- avatar_url: text NULLABLE
- role: text NOT NULL CHECK IN (STUDENT, TEACHER, ADMIN, SUPER_ADMIN)
- tier: text NULLABLE (hanya untuk STUDENT, mis. STARTER/BASIC/POPULAR/PREMIUM)
- created_at: timestamptz
- last_login_at: timestamptz
- deactivated: boolean
- deactivation_reason: text NULLABLE
- deactivated_at: timestamptz NULLABLE

### 2. tier_configs
- id: text PRIMARY KEY (mis. tier_a, tier_b)
- name: text (Starter, Basic, Popular, Premium)
- min_points: integer
- max_quizzes: integer (-1 = tanpa batas)
- can_access_zoom: boolean
- can_request_private_zoom: boolean
- description: text
- highlights: jsonb (array of strings)
- badge_tone: text

### 3. point_grants
- id: uuid PK
- user_id: uuid FK → profiles.id ON DELETE CASCADE
- points: integer (original grant)
- remaining: integer (FIFO consumed)
- source: text CHECK IN (INITIAL, PURCHASE, ADMIN_GRANT, BONUS, REFUND)
- note: text
- granted_at: timestamptz
- expires_at: timestamptz (1 tahun dari granted_at)

### 4. point_history
- id: uuid PK
- user_id: uuid FK → profiles.id
- kind: text CHECK IN (GRANT, SPEND, EXPIRE)
- points: integer
- balance_after: integer
- note: text
- at: timestamptz

### 5. transactions
- id: text PK
- user_id: uuid FK → profiles.id ON DELETE SET NULL
- package_id: text FK → credit_packages.id
- package_name: text
- amount_rp: integer
- points: integer
- method: text (VA, GOPAY, QRIS, CC, TRANSFER)
- status: text CHECK IN (PENDING, SUCCESS, FAILED)
- va_number: text
- created_at: timestamptz
- paid_at: timestamptz
- related_grant_id: uuid FK → point_grants.id ON DELETE SET NULL

### 6. credit_packages
- id: text PK
- points: integer
- price: integer (Rupiah)
- bonus: integer NULLABLE
- popular: boolean
- order: integer
- active: boolean

### 7. payment_settings (singleton, id='default')
- id: text PK
- methods: jsonb (map of PaymentMethodId -> config)
- virtual_accounts: jsonb (array of bank + VA number)
- qris_merchant: text
- gopay_phone: text
- transfer_accounts: jsonb (array of bank + rekening)
- updated_at: timestamptz

### 8. quiz_tests
- id: text PK
- title: text
- subject: text
- type: text CHECK IN (PRE_TEST, EXAM, VIDEO_QUIZ)
- duration: integer (menit)
- cost: integer (poin)
- total_questions: integer
- require_video: boolean
- video_url: text
- passing_score: integer
- description: text
- questions: jsonb (array of {id, text, options, correct, explanation})
- active: boolean
- questions_per_attempt: integer
- shuffle_questions: boolean
- shuffle_options: boolean
- created_at, updated_at: timestamptz

### 9. quiz_attempts
- id: uuid PK
- user_id: uuid FK → profiles.id ON DELETE SET NULL
- student_email: text (denorm)
- test_id: text FK → quiz_tests.id ON DELETE SET NULL
- test_title, subject: text (denorm)
- answered, correct, wrong, unanswered, total_questions, score: integer
- passed: boolean
- duration_used_sec: integer
- tab_switches: integer
- flagged: boolean (anti-cheat)
- cancelled: boolean
- completed_at: timestamptz

### 10. zoom_sessions (group zoom)
- id: text PK
- title: text
- teacher: text
- teacher_avatar: text
- subject: text
- scheduled_at: timestamptz
- duration: integer (menit)
- cost: integer (poin)
- max_participants: integer
- current_participants: integer
- status: text CHECK IN (SCHEDULED, LIVE, ENDED)
- description: text
- meeting_url: text

### 11. zoom_enrollments
- id: uuid PK
- session_id: text FK → zoom_sessions.id ON DELETE CASCADE
- user_id: uuid FK → profiles.id ON DELETE CASCADE
- joined_at, left_at: timestamptz
- UNIQUE (session_id, user_id)

### 12. private_zoom_requests (1-on-1)
- id: text PK
- student_email: text
- student_name: text
- student_user_id: uuid FK → profiles.id
- teacher_id: text
- teacher_name: text
- teacher_user_id: uuid FK → profiles.id
- subject, topic: text
- notes: text
- status: text CHECK IN (PENDING, SCHEDULED, CONFIRMED, REJECTED, CANCELLED, DONE)
- scheduled_at: timestamptz
- duration_minutes: integer
- meeting_url: text
- student_note: text
- created_at: timestamptz

### 13. private_chats
- id: text PK
- request_id: text FK → private_zoom_requests.id ON DELETE CASCADE
- author: text CHECK IN (student, teacher)
- name: text
- text: text
- flagged: boolean (off-platform contact attempt)
- at: timestamptz

### 14. notifications
- id: uuid PK
- kind: text CHECK IN (PRIVATE_ZOOM_REQUEST, PRIVATE_ZOOM_SCHEDULED, PRIVATE_ZOOM_CONFIRMED, PRIVATE_ZOOM_REJECTED, CHAT_MESSAGE, ACCOUNT_WARNING, SYSTEM)
- target_email: text
- target_user_id: uuid FK → profiles.id ON DELETE CASCADE
- title: text
- body: text
- link: text
- read: boolean
- at: timestamptz

### 15. helpdesk_sessions
- id: text PK
- student_email: text
- student_name: text
- admin_email: text NULLABLE
- admin_name: text NULLABLE
- status: text CHECK IN (OPEN, CLAIMED, CLOSED)
- created_at: timestamptz
- last_message_at: timestamptz
- last_message_preview: text

### 16. helpdesk_messages
- id: text PK
- session_id: text FK → helpdesk_sessions.id ON DELETE CASCADE
- author: text CHECK IN (student, admin)
- author_email: text
- author_name: text
- text: text
- at: timestamptz

### 17. helpdesk_presence (admin heartbeat)
- email: text PK
- name: text
- role: text CHECK IN (ADMIN, SUPER_ADMIN)
- available: boolean
- last_seen_at: timestamptz

### 18. testimonials
- id: text PK
- name: text
- role: text (e.g. "Siswa SMA 3 Bandung")
- avatar: text
- message: text
- rating: integer 1-5
- order: integer
- created_at: timestamptz

### 19. brochures (banner carousel)
- id: text PK
- image: text (base64 data URL atau https)
- title: text
- subtitle: text
- order: integer
- created_at: timestamptz

### 20. teacher_profiles
- id: text PK
- name: text
- email: text
- subject: text
- rating: numeric(3,2)
- students, sessions: integer
- status: text CHECK IN (ACTIVE, INACTIVE)
- photo: text
- description: text
- stats: jsonb (6-stat competency)
- created_at: timestamptz

### 21. landing_content (singleton, id='default')
- id: text PK
- payload: jsonb (seluruh copy landing: hero, features, pricing, testimonials, CTA)
- updated_at: timestamptz

### 22. demo_video (singleton)
- id: text PK
- url: text (YouTube URL)
- title: text
- updated_at: timestamptz

### 23. audit_log
- id: uuid PK
- actor_id: uuid FK → profiles.id ON DELETE SET NULL
- actor_email, actor_role: text (denorm)
- action: text
- target: text
- ip: text
- metadata: jsonb
- at: timestamptz

## Relasi Kunci

- profiles (1) —< (N) point_grants
- profiles (1) —< (N) point_history
- profiles (1) —< (N) transactions
- profiles (1) —< (N) quiz_attempts
- profiles (1) —< (N) zoom_enrollments
- profiles (1) —< (N) notifications (via target_user_id)
- profiles (1) —< (N) private_zoom_requests (via student_user_id / teacher_user_id)
- zoom_sessions (1) —< (N) zoom_enrollments
- quiz_tests (1) —< (N) quiz_attempts
- credit_packages (1) —< (N) transactions
- point_grants (1) —< (N) transactions (via related_grant_id)
- helpdesk_sessions (1) —< (N) helpdesk_messages
- private_zoom_requests (1) —< (N) private_chats

## Hasil yang diinginkan

1. Format output: **Mermaid erDiagram syntax** — supaya bisa di-render di GitHub
   README, Notion, atau mermaid.live
2. Include semua field penting (skip timestamps kalau terlalu panjang)
3. Gambarkan relasi dengan notasi: `||--o{` untuk 1:N, `||--||` untuk 1:1
4. Kelompokkan visual: Auth/Users, Points, Content, Quiz, Zoom, Helpdesk, Audit

Lalu setelah Mermaid, buatkan juga versi DBML (untuk dbdiagram.io) supaya
saya bisa render visual yang lebih polished.
```

---

## Cara Pakai

1. Copy seluruh prompt di atas (dalam code block)
2. Paste ke Claude/ChatGPT/Gemini → akan output Mermaid diagram
3. Untuk render:
   - **Mermaid**: paste ke https://mermaid.live → langsung visual
   - **DBML**: paste ke https://dbdiagram.io/d → visual lebih rapi
4. Export sebagai PNG/SVG untuk dokumentasi

## Alternatif Tool (tanpa AI)

Kalau mau auto-generate dari Supabase langsung:
- Install Supabase CLI: `npm install -g supabase`
- Login: `supabase login`
- Link project: `supabase link --project-ref bwbpoqzmlowmtfsbxlkf`
- Dump schema: `supabase db dump --schema public > schema.sql`
- Import ke https://dbdiagram.io atau https://drawsql.app untuk visual
