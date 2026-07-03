import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type Worker = {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  skills: string[];
  work_radius_km: number;
  women_safety: boolean;
  bharosa_score: number;
  jobs_completed: number;
  jobs_accepted: number;
  feedback_sum: number;
  feedback_count: number;
  status: 'available' | 'on_job' | 'inactive';
  lat: number | null;
  lng: number | null;
  schemes_registered: string[];
  is_seed: boolean;
  created_at: string;
};

export type Job = {
  id: string;
  contractor_name: string;
  contractor_phone: string;
  skill: string;
  workers_needed: number;
  workers_filled: number;
  per_day_wage: number;
  project_budget: number | null;
  location_text: string;
  lat: number | null;
  lng: number | null;
  status: 'open' | 'closed' | 'disputed';
  is_seed: boolean;
  created_at: string;
};

export type Match = {
  id: string;
  worker_id: string;
  job_id: string;
  status: 'accepted' | 'arrived' | 'completed' | 'no_show' | 'cancelled';
  created_at: string;
  arrived_at: string | null;
  completed_at: string | null;
};

export type Ticket = {
  id: string;
  raised_by_type: 'worker' | 'contractor';
  raised_by_name: string;
  against_name: string | null;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  notes: string;
  created_at: string;
  updated_at: string;
};

export type SosEvent = {
  id: string;
  worker_id: string;
  worker_name: string;
  lat: number | null;
  lng: number | null;
  status: 'active' | 'resolved';
  created_at: string;
  resolved_at: string | null;
};

export type Activity = {
  id: string;
  event_type: string;
  actor_name: string;
  detail: string;
  photo_url: string | null;
  created_at: string;
};

export const SKILLS = [
  'Mason/Mistri',
  'Plumber',
  'Electrician',
  'Painter',
  'Carpenter',
  'Helper/Labour',
  'Welder',
  'Tile Worker',
  'other'
] as const;

// Hardcoded per-skill market-rate table (₹/day): [min, max]
export const MARKET_RATES: Record<string, [number, number]> = {
  'Mason/Mistri': [550, 750],
  Plumber: [600, 850],
  Electrician: [650, 950],
  Painter: [450, 650],
  Carpenter: [600, 900],
  'Helper/Labour': [350, 500],
  Welder: [700, 1000],
  'Tile Worker': [500, 700],
};

export const SCHEMES = [
  {
    id: 'eshram',
    name: 'e-Shram Card',
    desc: 'Mazdoor ka digital identity card. Accident cover ₹2 lakh.',
    benefit: '₹2 lakh accident cover · National worker ID',
    color: '#1D9E75',
    steps: [
      'Aadhaar card aur mobile number ready rakhein',
      'eshram.gov.in par jayein ya nearest CSC centre jayein',
      'Aadhaar se OTP verify karein',
      'Bank account details bharein',
      'Photo aur signature upload karein',
      'e-Shram card download/print karein',
    ],
    videoUrl: 'https://youtu.be/mnWbxDTIzXQ?si=5Lml9jsvpnHXNFIR',
    helpline: '14434',
  },
  {
    id: 'bocw',
    name: 'BOCW Welfare Board',
    desc: 'Pension, accident cover, bacchon ke liye scholarship.',
    benefit: 'Pension · Accident cover · Scholarship',
    color: '#0B1957',
    steps: [
      'Construction worker hone ka proof (site photo, employer letter)',
      'Aadhaar, bank passbook, aur 2 passport photo ready rakhein',
      'Nearest labour office / BOCW board jayein',
      'Form bharein aur documents submit karein',
      'Registration fee ₹25-50 pay karein',
      'Registration certificate collect karein',
    ],
    videoUrl: 'https://youtu.be/1BoUrS40J2o?si=0GkgaDryjM9Vyt_k',
    helpline: '1800-200-1225',
  },
  {
    id: 'pmsby',
    name: 'PM Suraksha Bima Yojana',
    desc: '₹2 lakh accident cover, ₹1 lakh partial disability.',
    benefit: '₹2 lakh accident · ₹1 lakh partial disability',
    color: '#BA7517',
    steps: [
      'Bank account aur Aadhaar ready rakhein',
      'Apne bank branch jayein ya bank mitra se baat karein',
      'PMSBY form bharein (₹20 saal ka premium)',
      'Aadhaar link karein aur auto-debit set karein',
      'Confirmation SMS aayega 24-48 ghante mein',
      'Policy document bank se collect karein',
    ],
    videoUrl: 'https://youtu.be/OsrzeTvNQqk?si=YkajLETXLz8q4D9i',
    helpline: '1800-180-1111',
  },
];
