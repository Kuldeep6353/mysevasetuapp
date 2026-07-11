/*
# Reset RLS policies to restore admin panel access

1. Remove all authenticated-only policies that were added on top of the original anon_crud policies
2. Keep only the original anon_crud_* policies for all tables (workers, jobs, matches, invites, tickets, sos_events, activity, emergency_alerts)
3. Keep user_profiles policies (authenticated-only, for auth flow)
4. This restores the admin panel to its working state where anon key can access all data
*/

-- Drop authenticated-only policies on workers
DROP POLICY IF EXISTS "select_workers_authenticated" ON workers;
DROP POLICY IF EXISTS "insert_own_worker" ON workers;
DROP POLICY IF EXISTS "update_own_worker" ON workers;
DROP POLICY IF EXISTS "delete_own_worker" ON workers;

-- Drop authenticated-only policies on jobs
DROP POLICY IF EXISTS "select_jobs_authenticated" ON jobs;
DROP POLICY IF EXISTS "insert_jobs_authenticated" ON jobs;
DROP POLICY IF EXISTS "update_jobs_authenticated" ON jobs;

-- Drop authenticated-only policies on matches
DROP POLICY IF EXISTS "select_matches_authenticated" ON matches;
DROP POLICY IF EXISTS "insert_matches_authenticated" ON matches;
DROP POLICY IF EXISTS "update_matches_authenticated" ON matches;

-- Drop authenticated-only policies on tickets
DROP POLICY IF EXISTS "select_tickets_authenticated" ON tickets;
DROP POLICY IF EXISTS "insert_tickets_authenticated" ON tickets;

-- Drop authenticated-only policies on activity
DROP POLICY IF EXISTS "select_activity_authenticated" ON activity;
DROP POLICY IF EXISTS "insert_activity_authenticated" ON activity;

-- Drop authenticated-only policies on sos_events
DROP POLICY IF EXISTS "select_sos_authenticated" ON sos_events;
DROP POLICY IF EXISTS "insert_sos_authenticated" ON sos_events;
DROP POLICY IF EXISTS "update_sos_authenticated" ON sos_events;

-- Drop authenticated-only policies on emergency_alerts
DROP POLICY IF EXISTS "select_emergency_authenticated" ON emergency_alerts;
DROP POLICY IF EXISTS "insert_emergency_authenticated" ON emergency_alerts;
DROP POLICY IF EXISTS "update_emergency_authenticated" ON emergency_alerts;

-- Drop authenticated-only policies on invites
DROP POLICY IF EXISTS "select_invites_authenticated" ON invites;
DROP POLICY IF EXISTS "insert_invites_authenticated" ON invites;
