import { useEffect, useState } from 'react';
import { supabase, type Worker, type Job, type Match, type Ticket, type SosEvent, type Activity, type EmergencyAlert } from './supabase';

export function useRealtime<T>(
  table: string,
  select: string,
  orderBy?: string,
  ascending: boolean = false,
): { data: T[] | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      let q = supabase.from(table).select(select);
      if (orderBy) q = q.order(orderBy, { ascending });
      const { data: rows, error: e } = await q;
      if (!active) return;
      if (e) {
        console.error(`useRealtime(${table}) error:`, e.message);
        setData([]);
      } else {
        setData(rows as T[]);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [table, select, orderBy, ascending]);

  return { data, loading, error };
}

export function useWorkers() {
  return useRealtime<Worker>('workers', '*', 'created_at', false);
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
  return useRealtime<Activity>('activity', '*', 'created_at', false);
}

// Bharosa Score: f(completed/accepted ratio, no-show penalty, feedback avg)
export function computeBharosa(w: Pick<Worker, 'jobs_completed' | 'jobs_accepted' | 'feedback_sum' | 'feedback_count'>): number {
  const ratio = w.jobs_accepted > 0 ? w.jobs_completed / w.jobs_accepted : 0.5;
  const completionScore = Math.min(ratio, 1) * 60;
  const feedbackAvg = w.feedback_count > 0 ? w.feedback_sum / w.feedback_count : 4;
  const feedbackScore = (feedbackAvg / 5) * 40;
  return Math.round(Math.min(completionScore + feedbackScore, 100));
}

// matchScore = bharosa*0.5 + proximityFit*0.3 + availabilityFreshness*0.2
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
