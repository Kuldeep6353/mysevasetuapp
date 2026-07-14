import { useEffect, useRef, useState } from 'react';
import { supabase, type Worker, type Job, type Match, type Ticket, type SosEvent, type Activity, type EmergencyAlert } from './supabase';

// Simple polling hook — no Supabase Realtime WebSockets, just plain REST polling every 4s
export function useRealtime<T>(
  table: string,
  select: string,
  orderBy?: string,
  ascending: boolean = false,
): { data: T[] | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    const fetchData = async () => {
      try {
        let q = supabase.from(table).select(select);
        if (orderBy) q = q.order(orderBy, { ascending });
        const { data: rows, error: e } = await q;
        if (!activeRef.current) return;
        if (e) {
          console.error(`[${table}] fetch error:`, e.message);
          setError(e.message);
          setData([]);
        } else {
          setData((rows ?? []) as T[]);
          setError(null);
        }
      } catch (err) {
        if (!activeRef.current) return;
        console.error(`[${table}] unexpected error:`, err);
        setData([]);
        setError(String(err));
      }
      setLoading(false);
    };

    fetchData();
    const timer = setInterval(fetchData, 4000);

    return () => {
      activeRef.current = false;
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, orderBy, ascending]);

  return { data, loading, error };
}

// Exclude photo_url from bulk fetches — some rows have multi-MB base64 strings
// stored in photo_url (not URLs), which causes json_agg to timeout in PostgREST.
// Avatar component handles null photo_url by showing initials.
const WORKER_COLS = 'id,name,phone,skills,work_radius_km,women_safety,bharosa_score,jobs_completed,jobs_accepted,feedback_sum,feedback_count,status,lat,lng,schemes_registered,is_seed,created_at';

export function useWorkers() {
  return useRealtime<Worker>('workers', WORKER_COLS, 'created_at', false);
}
export function useJobs() {
  return useRealtime<Job>('jobs', '*', 'created_at', false);
}
export function useMatches() {
  return useRealtime<Match>('matches', '*', 'created_at', false);
}
export function useTickets() {
  return useRealtime<Ticket>('tickets', '*', 'created_at', false);
}
export function useSosEvents() {
  return useRealtime<SosEvent>('sos_events', '*', 'created_at', false);
}
export function useEmergencyAlerts() {
  return useRealtime<EmergencyAlert>('emergency_alerts', '*', 'created_at', false);
}
export function useActivity() {
  return useRealtime<Activity>('activity', 'id,event_type,actor_name,detail,created_at', 'created_at', false);
}

export function computeBharosa(w: Pick<Worker, 'jobs_completed' | 'jobs_accepted' | 'feedback_sum' | 'feedback_count'>): number {
  const ratio = w.jobs_accepted > 0 ? w.jobs_completed / w.jobs_accepted : 0.5;
  const completionScore = Math.min(ratio, 1) * 60;
  const feedbackAvg = w.feedback_count > 0 ? w.feedback_sum / w.feedback_count : 4;
  const feedbackScore = (feedbackAvg / 5) * 40;
  return Math.round(Math.min(completionScore + feedbackScore, 100));
}

export function matchScore(
  w: Worker,
  _jobSkill: string,
  jobLat: number | null,
  jobLng: number | null,
): number {
  const bharosa = w.bharosa_score;
  let proximity = 50;
  if (jobLat != null && jobLng != null && w.lat != null && w.lng != null) {
    const d = haversine(w.lat, w.lng, jobLat, jobLng);
    proximity = Math.max(0, 100 - (d / Math.max(w.work_radius_km, 1)) * 50);
  }
  const ageMin = (Date.now() - new Date(w.created_at).getTime()) / 60000;
  const freshness = Math.max(0, 100 - ageMin * 0.5);
  return Math.round(bharosa * 0.5 + proximity * 0.3 + freshness * 0.2);
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'abhi';
  if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
  if (s < 86400) return `${Math.floor(s / 3600)} ghante pehle`;
  return `${Math.floor(s / 86400)} din pehle`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#1D9E75';
  if (score >= 60) return '#BA7517';
  return '#D85A30';
}
