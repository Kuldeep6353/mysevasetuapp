-- Prevent a worker from accepting the same job twice
CREATE UNIQUE INDEX IF NOT EXISTS uniq_match_worker_job ON matches (worker_id, job_id);
