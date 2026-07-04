-- Emergency alerts: when any user taps an emergency button
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL DEFAULT 'worker',
  user_name text NOT NULL,
  user_phone text NOT NULL,
  emergency_type text NOT NULL,
  phone_number text NOT NULL,
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_created ON emergency_alerts(created_at desc);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_emergency_alerts" ON emergency_alerts;
CREATE POLICY "anon_crud_emergency_alerts" ON emergency_alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;

-- Add arrival_confirmed_by column to matches for two-way verification
ALTER TABLE matches ADD COLUMN IF NOT EXISTS arrival_confirmed_by text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS arrival_confirmed_at timestamptz;
