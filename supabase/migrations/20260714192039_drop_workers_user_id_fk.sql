-- The user_id column on workers references auth.users via FK
-- PostgREST tries to resolve this FK relationship when doing select('*')
-- which causes json_agg to be extremely slow / timeout
-- Drop the FK constraint but keep the column (data is preserved)

ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_user_id_fkey;
