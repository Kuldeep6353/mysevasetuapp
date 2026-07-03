/*
# Mera Karigar — core schema

1. New Tables
- `workers` — registered daily-wage workers. photo_url (text, base64 data URL or storage path), name, phone, skills (text[]), work_radius_km (int), women_safety (bool), bharosa_score (int 0-100), jobs_completed, jobs_accepted, status (available/on_job/inactive), lat/lng, schemes_registered (text[]), created_at.
- `jobs` — posted by contractors. contractor_name, contractor_phone, skill, workers_needed, workers_filled, per_day_wage, project_budget, location_text, lat/lng, status (open/closed/disputed), created_at.
- `matches` — a worker accepting a job. worker_id, job_id, status (accepted/arrived/completed/no_show/cancelled), created_at, arrived_at, completed_at.
- `invites` — contractor invited a worker. worker_id, job_id, contractor_name, created_at.
- `tickets` — support complaints. raised_by_type (worker/contractor), raised_by_name, against_name, category, description, status (open/in_progress/resolved), notes, created_at, updated_at.
- `sos_events` — women's safety SOS. worker_id, worker_name, lat/lng, status (active/resolved), created_at, resolved_at.
- `activity` — live feed events for admin overview. event_type, actor_name, detail, photo_url, created_at.

2. Security
- No sign-in screen (demo). All tables RLS-enabled with `TO anon, authenticated` full CRUD — data is intentionally public/shared across demo devices.
- `USING (true)` is documented as intentional public/shared demo data.

3. Realtime
- All tables added to supabase_realtime publication so onSnapshot-style listeners sync across devices.
*/

CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  photo_url text,
  skills text[] NOT NULL DEFAULT '{}',
  work_radius_km int NOT NULL DEFAULT 5,
  women_safety boolean NOT NULL DEFAULT false,
  bharosa_score int NOT NULL DEFAULT 50,
  jobs_completed int NOT NULL DEFAULT 0,
  jobs_accepted int NOT NULL DEFAULT 0,
  feedback_sum int NOT NULL DEFAULT 0,
  feedback_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  lat double precision,
  lng double precision,
  schemes_registered text[] NOT NULL DEFAULT '{}',
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_name text NOT NULL,
  contractor_phone text NOT NULL,
  skill text NOT NULL,
  workers_needed int NOT NULL DEFAULT 1,
  workers_filled int NOT NULL DEFAULT 0,
  per_day_wage int NOT NULL,
  project_budget int,
  location_text text NOT NULL,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'open',
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  arrived_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raised_by_type text NOT NULL,
  raised_by_name text NOT NULL,
  against_name text,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sos_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  worker_name text NOT NULL,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_name text NOT NULL,
  detail text NOT NULL,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for live queries
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_workers_skills ON workers USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_matches_worker ON matches(worker_id);
CREATE INDEX IF NOT EXISTS idx_matches_job ON matches(job_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at desc);
CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_events(status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- RLS: no-auth demo app, data intentionally public/shared across devices
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_workers" ON workers;
CREATE POLICY "anon_crud_workers" ON workers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_jobs" ON jobs;
CREATE POLICY "anon_crud_jobs" ON jobs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_matches" ON matches;
CREATE POLICY "anon_crud_matches" ON matches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_invites" ON invites;
CREATE POLICY "anon_crud_invites" ON invites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_tickets" ON tickets;
CREATE POLICY "anon_crud_tickets" ON tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_sos" ON sos_events;
CREATE POLICY "anon_crud_sos" ON sos_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_activity" ON activity;
CREATE POLICY "anon_crud_activity" ON activity FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime: add all tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE workers;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE invites;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE activity;
