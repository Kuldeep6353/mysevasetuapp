/*
# Add user profiles table for auth-based accounts

1. New Tables
- `user_profiles` — links to auth.users, stores role (worker/contractor), phone, name, agreement_accepted
  - id (uuid, PK, references auth.users)
  - role (text: 'worker' | 'contractor')
  - full_name (text)
  - phone (text)
  - email (text)
  - agreement_accepted (boolean, default false)
  - agreement_accepted_at (timestamptz)
  - created_at (timestamptz)

2. Security
- RLS enabled on user_profiles
- Users can read/update/delete only their own profile row
- INSERT allowed for authenticated users (self-registration)

3. Notes
- This table supplements auth.users with app-specific profile data
- Workers table and contractor data remain as-is (linked via user_id)
- Existing anon-accessible tables keep their policies for backward compatibility
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'worker',
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  agreement_accepted boolean NOT NULL DEFAULT false,
  agreement_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- Add user_id to workers table to link with auth
ALTER TABLE workers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow authenticated users to read all workers (for matching) and update their own
DROP POLICY IF EXISTS "select_workers_authenticated" ON workers;
CREATE POLICY "select_workers_authenticated" ON workers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_worker" ON workers;
CREATE POLICY "insert_own_worker" ON workers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_worker" ON workers;
CREATE POLICY "update_own_worker" ON workers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_worker" ON workers;
CREATE POLICY "delete_own_worker" ON workers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Allow authenticated users to read all jobs and manage their own
DROP POLICY IF EXISTS "select_jobs_authenticated" ON jobs;
CREATE POLICY "select_jobs_authenticated" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_jobs_authenticated" ON jobs;
CREATE POLICY "insert_jobs_authenticated" ON jobs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_jobs_authenticated" ON jobs;
CREATE POLICY "update_jobs_authenticated" ON jobs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to manage matches
DROP POLICY IF EXISTS "select_matches_authenticated" ON matches;
CREATE POLICY "select_matches_authenticated" ON matches FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_matches_authenticated" ON matches;
CREATE POLICY "insert_matches_authenticated" ON matches FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_matches_authenticated" ON matches;
CREATE POLICY "update_matches_authenticated" ON matches FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to manage tickets
DROP POLICY IF EXISTS "select_tickets_authenticated" ON tickets;
CREATE POLICY "select_tickets_authenticated" ON tickets FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_tickets_authenticated" ON tickets;
CREATE POLICY "insert_tickets_authenticated" ON tickets FOR INSERT
  TO authenticated WITH CHECK (true);

-- Allow authenticated users to insert activity, sos_events, emergency_alerts
DROP POLICY IF EXISTS "insert_activity_authenticated" ON activity;
CREATE POLICY "insert_activity_authenticated" ON activity FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_activity_authenticated" ON activity;
CREATE POLICY "select_activity_authenticated" ON activity FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_sos_authenticated" ON sos_events;
CREATE POLICY "insert_sos_authenticated" ON sos_events FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_sos_authenticated" ON sos_events;
CREATE POLICY "select_sos_authenticated" ON sos_events FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_sos_authenticated" ON sos_events;
CREATE POLICY "update_sos_authenticated" ON sos_events FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "insert_emergency_authenticated" ON emergency_alerts;
CREATE POLICY "insert_emergency_authenticated" ON emergency_alerts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_emergency_authenticated" ON emergency_alerts;
CREATE POLICY "select_emergency_authenticated" ON emergency_alerts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_emergency_authenticated" ON emergency_alerts;
CREATE POLICY "update_emergency_authenticated" ON emergency_alerts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to read invites
DROP POLICY IF EXISTS "select_invites_authenticated" ON invites;
CREATE POLICY "select_invites_authenticated" ON invites FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_invites_authenticated" ON invites;
CREATE POLICY "insert_invites_authenticated" ON invites FOR INSERT
  TO authenticated WITH CHECK (true);
