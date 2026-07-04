import { useMemo, useState } from 'react';
import { Icon } from '../components/Icons';
import { Avatar, ScoreBadge, EmptyState, Header, Skeleton } from '../components/ui';
import { useToast } from '../components/Toast';
import { supabase, SKILLS, MARKET_RATES, type Job } from '../lib/supabase';
import { useWorkers, useJobs, useMatches, matchScore, timeAgo } from '../lib/hooks';
import type { Lang, T } from '../lib/i18n';
import { useT } from '../lib/i18n';

export function ContractorDashboard({ lang, contractorName, contractorPhone, onExit }: { lang: Lang; contractorName: string; contractorPhone: string; onExit: () => void }) {
  const t = useT(lang);
  const [tab, setTab] = useState<'post' | 'match'>('post');
  const { data: jobs } = useJobs();
  const { data: matches } = useMatches();
  const { data: workers } = useWorkers();
  const myJobs = useMemo(
    () => (jobs ?? []).filter((j) => j.contractor_phone === contractorPhone).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [jobs, contractorPhone],
  );

  // Map job_id -> list of workers who applied
  const applicantsByJob = useMemo(() => {
    const map: Record<string, { name: string; skill: string; phone: string; photo_url: string | null; status: string }[]> = {};
    for (const m of matches ?? []) {
      const w = (workers ?? []).find((w) => w.id === m.worker_id);
      if (!w) continue;
      if (!map[m.job_id]) map[m.job_id] = [];
      map[m.job_id].push({ name: w.name, skill: w.skills.join(', '), phone: w.phone, photo_url: w.photo_url, status: m.status });
    }
    return map;
  }, [matches, workers]);

  return (
    <div className="min-h-screen">
      <Header
        title={contractorName.split(' ')[0]}
        right={
          <button onClick={onExit} className="btn-ghost p-2 -mr-2">
            <Icon.LogOut size={20} />
          </button>
        }
      />

      <div className="px-5 py-4 max-w-md mx-auto">
        {/* Tab switch */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(11,25,87,0.06)' }}>
          <button
            onClick={() => setTab('post')}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === 'post' ? { background: '#fff', color: '#0B1957', boxShadow: '0 1px 3px rgba(11,25,87,0.1)' } : { color: 'rgba(11,25,87,0.5)' }}
          >
            <Icon.Plus size={16} className="inline mr-1.5" />
            {t.postJob}
          </button>
          <button
            onClick={() => setTab('match')}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={tab === 'match' ? { background: '#fff', color: '#0B1957', boxShadow: '0 1px 3px rgba(11,25,87,0.1)' } : { color: 'rgba(11,25,87,0.5)' }}
          >
            <Icon.Users size={16} className="inline mr-1.5" />
            {t.findWorkers}
          </button>
        </div>

        {/* My posted jobs */}
        {myJobs.length > 0 && (
          <div className="mb-5">
            <h2 className="font-display font-bold text-sm mb-2 px-1" style={{ color: '#0B1957' }}>{t.contractorPostedJobs}</h2>
            <div className="space-y-2">
              {myJobs.map((j) => {
                const applicants = applicantsByJob[j.id] ?? [];
                return <JobApplicantCard key={j.id} job={j} applicants={applicants} />;
              })}
            </div>
          </div>
        )}

        {tab === 'post' ? <PostJob contractorName={contractorName} contractorPhone={contractorPhone} t={t} /> : <FindWorkers t={t} />}
      </div>
    </div>
  );
}

function PostJob({ contractorName, contractorPhone, t }: { contractorName: string; contractorPhone: string; t: T }) {
  const [skill, setSkill] = useState('');
  const [needed, setNeeded] = useState('1');
  const [wage, setWage] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const range = skill ? MARKET_RATES[skill] : null;
  const lowWage = range && wage && parseInt(wage) < range[0];

  const useLocation = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 }),
      );
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setLocation('Current location (GPS)');
      toast(t.locationSet, 'success');
    } catch {
      toast(t.locationFail, 'error');
    }
  };

  const submit = async () => {
    if (!skill || !wage || !location) return;
    setSubmitting(true);
    const { error } = await supabase.from('jobs').insert({
      contractor_name: contractorName,
      contractor_phone: contractorPhone,
      skill,
      workers_needed: parseInt(needed) || 1,
      workers_filled: 0,
      per_day_wage: parseInt(wage),
      project_budget: budget ? parseInt(budget) : null,
      location_text: location,
      lat,
      lng,
      status: 'open',
      is_seed: false,
    });
    if (error) {
      toast(t.jobPostFail, 'error');
      setSubmitting(false);
      return;
    }
    await supabase.from('activity').insert({
      event_type: 'job_posted',
      actor_name: contractorName,
      detail: `posted: ${skill} x${needed}`,
      photo_url: null,
    });
    toast(t.jobPosted, 'success');
    setSkill(''); setWage(''); setBudget(''); setLocation(''); setLat(null); setLng(null);
    setSubmitting(false);
  };

  const canSubmit = skill && wage && location;

  return (
    <div className="space-y-4 fade-in">
      <div>
        <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.skill}</label>
        <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">{t.skillPrompt}</option>
          {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.workersNeededLabel}</label>
          <input className="input" type="number" min="1" value={needed} onChange={(e) => setNeeded(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.perDayWage}</label>
          <input className="input" type="number" inputMode="numeric" placeholder={t.wagePrompt} value={wage} onChange={(e) => setWage(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>

      {lowWage && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(186,117,23,0.1)', color: '#BA7517' }}>
          <Icon.AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {t.lowWageWarning.replace('{0}', String(range![0])).replace('{1}', String(range![1]))}
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.siteLocation}</label>
        <input className="input" placeholder={t.locationPrompt} value={location} onChange={(e) => { setLocation(e.target.value); setLat(null); setLng(null); }} />
        <button onClick={useLocation} className="btn-ghost text-xs mt-2 px-3 py-2">
          <Icon.Crosshair size={14} />
          {t.currentLocation}
        </button>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5" style={{ color: '#0B1957' }}>
          {t.projectBudget}
          <span className="group relative">
            <Icon.Info size={14} style={{ color: 'rgba(11,25,87,0.4)' }} />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: '#0B1957', color: '#fff' }}>
              {t.budgetTooltip}
            </span>
          </span>
        </label>
        <input className="input" type="number" inputMode="numeric" placeholder={t.budgetPrompt} value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
      </div>

      <button onClick={submit} disabled={!canSubmit || submitting} className="btn-primary w-full text-base disabled:opacity-40">
        {submitting ? <><Icon.RefreshCw size={20} className="animate-spin" /> {t.posting}</> : <><Icon.Send size={18} /> {t.postJob}</>}
      </button>
    </div>
  );
}

function FindWorkers({ t }: { t: T }) {
  const { data: workers, loading } = useWorkers();
  const [skill, setSkill] = useState('');
  const [inviting, setInviting] = useState<string | null>(null);
  const { toast } = useToast();

  const ranked = useMemo(() => {
    if (!workers) return [];
    const available = workers.filter((w) => w.status === 'available' && (!skill || w.skills.includes(skill)));
    return available
      .map((w) => ({ w, score: matchScore(w, skill || w.skills[0], null, null) }))
      .sort((a, b) => b.score - a.score);
  }, [workers, skill]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4 fade-in">
      <div>
        <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.skillFilter}</label>
        <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">{t.allSkills}</option>
          {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {ranked.length === 0 ? (
        <EmptyState icon={<Icon.Users size={28} />} title={t.noWorkersFound} subtitle={t.noWorkersSub} />
      ) : (
        <div className="space-y-3">
          {ranked.map(({ w, score }) => (
            <div key={w.id} className="card flex items-center gap-3 fade-in">
              <Avatar src={w.photo_url} name={w.name} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate" style={{ color: '#0B1957' }}>{w.name}</p>
                  {w.women_safety && (
                    <span title="Safety-enabled worker" className="flex-shrink-0">
                      <Icon.Shield size={14} style={{ color: '#D85A30' }} />
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>
                  {w.skills.join(', ')} · {w.work_radius_km === 999 ? 'Anywhere' : `${w.work_radius_km}km`}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <ScoreBadge score={w.bharosa_score} />
                  <span className="badge" style={{ background: 'rgba(158,204,250,0.25)', color: '#0B1957' }}>
                    {score}% match
                  </span>
                </div>
              </div>
              <button
                onClick={async () => {
                  setInviting(w.id);
                  await supabase.from('invites').insert({ worker_id: w.id, job_id: null, contractor_name: 'You' });
                  await supabase.from('activity').insert({ event_type: 'invite_sent', actor_name: w.name, detail: 'invite sent by contractor', photo_url: w.photo_url });
                  setTimeout(() => setInviting(null), 800);
                  toast(t.inviteSent, 'success');
                }}
                disabled={inviting === w.id}
                className="btn-primary text-sm px-4 py-2.5 flex-shrink-0 disabled:opacity-60"
              >
                {inviting === w.id ? <Icon.RefreshCw size={16} className="animate-spin" /> : <Icon.Send size={16} />}
                {t.invite}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(11,25,87,0.04)', color: 'rgba(11,25,87,0.55)' }}>
        <Icon.Lock size={14} className="flex-shrink-0 mt-0.5" />
        {t.privacyNote}
      </div>
    </div>
  );
}

function JobApplicantCard({ job, applicants }: { job: Job; applicants: { name: string; skill: string; phone: string; photo_url: string | null; status: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 py-3 w-full text-left">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(11,25,87,0.06)' }}>
          <Icon.Briefcase size={18} style={{ color: '#0B1957' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{job.skill} · {job.location_text}</p>
          <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>
            {job.workers_filled}/{job.workers_needed} filled · ₹{job.per_day_wage}/day · {timeAgo(job.created_at)}
          </p>
        </div>
        <span className="badge" style={{ background: job.status === 'open' ? 'rgba(29,158,117,0.12)' : 'rgba(11,25,87,0.08)', color: job.status === 'open' ? '#1D9E75' : 'rgba(11,25,87,0.5)' }}>
          {job.status}
        </span>
        <Icon.ChevronDown size={16} style={{ color: 'rgba(11,25,87,0.4)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2" style={{ borderTop: '1px solid rgba(11,25,87,0.06)' }}>
          {applicants.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'rgba(11,25,87,0.4)' }}>Abhi tak kisi worker ne apply nahi kiya.</p>
          ) : (
            applicants.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                {a.photo_url ? (
                  <img src={a.photo_url} alt={a.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(11,25,87,0.08)' }}>
                    <Icon.User size={16} style={{ color: '#0B1957' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: '#0B1957' }}>{a.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>{a.skill}</p>
                </div>
                <a href={`tel:${a.phone}`} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.1)' }}>
                  <Icon.Phone size={14} style={{ color: '#1D9E75' }} />
                </a>
                <span className="badge text-xs" style={{ background: a.status === 'accepted' ? 'rgba(29,158,117,0.12)' : 'rgba(11,25,87,0.08)', color: a.status === 'accepted' ? '#1D9E75' : 'rgba(11,25,87,0.5)' }}>
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
