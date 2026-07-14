-- Add indexes on created_at to fix statement timeout on ORDER BY queries
-- The admin panel queries workers and activity with ORDER BY created_at DESC
-- Without an index, PostgREST's statement timeout kills the query

CREATE INDEX IF NOT EXISTS workers_created_at_idx ON workers (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_created_at_idx ON activity (created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_created_at_idx ON tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS sos_events_created_at_idx ON sos_events (created_at DESC);
CREATE INDEX IF NOT EXISTS emergency_alerts_created_at_idx ON emergency_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS matches_created_at_idx ON matches (created_at DESC);
