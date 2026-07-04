import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icons';
import { EmptyState, Modal, Header, Skeleton } from '../components/ui';
import { useToast } from '../components/Toast';
import { EmergencySection } from '../components/EmergencyButton';
import { supabase, MARKET_RATES, SCHEMES, type Worker, type Job } from '../lib/supabase';
import { useJobs, useMatches, timeAgo, haversine, computeBharosa } from '../lib/hooks';
import type { Lang, T } from '../lib/i18n';
import { useT } from '../lib/i18n';

export function WorkerDashboard({ lang, workerId, onExit }: { lang: Lang; workerId: string; onExit: () => void }) {
  const t = useT(lang);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: jobs } = useJobs();
  const { data: matches } = useMatches();
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('workers').select('*').eq('id', workerId).maybeSingle();
      if (active && data) setWorker(data as Worker);
      if (active) setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`worker-${workerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers', filter: `id=eq.${workerId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `worker_id=eq.${workerId}` }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [workerId]);

  const myMatches = useMemo(
    () => (matches ?? []).filter((m) => m.worker_id === workerId),
    [matches, workerId],
  );

  const matchingJobs = useMemo(() => {
    if (!worker || !jobs) return [];
    return jobs
      .filter((j) => j.status === 'open' && worker.skills.includes(j.skill))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [worker, jobs]);

  if (loading) return <div className="px-5 py-8"><Skeleton className="h-40" /></div>;
  if (!worker) return <EmptyState icon={<Icon.User size={28} />} title="Profile nahi mila" />;

  const bharosa = computeBharosa(worker);
  const newMatches = myMatches.filter((m) => m.status === 'accepted').length;

  return (
    <div className="min-h-screen pb-24">
      <Header
        title={`${t.namaste}, ${worker.name.split(' ')[0]}`}
        right={
          <button onClick={onExit} className="btn-ghost p-2 -mr-2">
            <Icon.LogOut size={20} />
          </button>
        }
      />

      <div className="px-5 py-4 max-w-md mx-auto space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Icon.ShieldCheck size={18} />} value={bharosa} label={t.bharosaScore} color="#1D9E75" />
          <StatCard icon={<Icon.CheckCircle size={18} />} value={worker.jobs_completed} label={t.jobsComplete} color="#0B1957" />
          <StatCard icon={<Icon.Briefcase size={18} />} value={newMatches} label={t.newMatches} color="#BA7517" />
        </div>

        {/* Wage transparency meter */}
        <WageMeter skills={worker.skills} t={t} />

        {/* Job feed */}
        <div>
          <h2 className="font-display font-bold text-base mb-3 px-1" style={{ color: '#0B1957' }}>
            {t.jobsForYou}
          </h2>
          {matchingJobs.length === 0 ? (
            <EmptyState icon={<Icon.Briefcase size={28} />} title={t.noJobsYet} subtitle={t.noJobsSub} />
          ) : (
            <div className="space-y-3">
              {matchingJobs.map((job) => (
                <JobCard key={job.id} job={job} worker={worker} t={t} onAccept={async () => {
                  // Insert match (unique constraint prevents duplicates)
                  const { error: matchErr } = await supabase.from('matches').insert({ worker_id: worker.id, job_id: job.id, status: 'accepted' });
                  if (matchErr) {
                    if (matchErr.code === '23505') {
                      toast('Aapne ye kaam pehle accept kiya hai.', 'error');
                    } else {
                      toast('Accept karne mein error. Phir try karein.', 'error');
                    }
                    return;
                  }
                  // Atomically increment workers_filled using latest DB value
                  const { data: fresh } = await supabase.from('jobs').select('workers_filled, workers_needed').eq('id', job.id).maybeSingle();
                  const cur = fresh?.workers_filled ?? 0;
                  const need = fresh?.workers_needed ?? job.workers_needed;
                  const newFilled = Math.min(cur + 1, need);
                  await supabase.from('jobs').update({ workers_filled: newFilled, status: newFilled >= need ? 'closed' : 'open' }).eq('id', job.id);
                  await supabase.from('workers').update({ status: 'on_job', jobs_accepted: worker.jobs_accepted + 1 }).eq('id', worker.id);
                  await supabase.from('activity').insert({ event_type: 'worker_matched', actor_name: worker.name, detail: `accepted ${job.skill} job`, photo_url: worker.photo_url });
                  toast('Kaam accept kiya! Site par pahunch kar confirm karein.', 'success');
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Active jobs — arrival confirmation */}
        {myMatches.filter((m) => m.status === 'accepted').length > 0 && (
          <div>
            <h2 className="font-display font-bold text-base mb-3 px-1" style={{ color: '#0B1957' }}>
              {t.arrivedConfirm}
            </h2>
            {myMatches.filter((m) => m.status === 'accepted' || m.status === 'arrived').map((m) => {
              const job = jobs?.find((j) => j.id === m.job_id);
              if (!job) return null;
              const confirmed = m.arrival_confirmed_by === 'contractor';
              const rejected = m.arrival_confirmed_by === 'rejected';
              return (
                <div key={m.id} className="card">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{job.skill} — {job.location_text}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.confirmJobWarning}</p>
                    </div>
                    {m.status === 'accepted' && (
                      <button
                        onClick={async () => {
                          await supabase.from('matches').update({ status: 'arrived', arrived_at: new Date().toISOString() }).eq('id', m.id);
                          toast('Aap site par pahunch gaye. Contractor ki pushti ka wait karein.', 'success');
                        }}
                        className="btn-primary text-sm px-4 py-2.5"
                      >
                        <Icon.Check size={16} />
                        {t.arrivedBtn}
                      </button>
                    )}
                    {m.status === 'arrived' && !confirmed && !rejected && (
                      <span className="badge text-xs" style={{ background: 'rgba(234,88,12,0.12)', color: '#EA580C' }}>
                        <Icon.Clock size={12} className="inline mr-1" />
                        {t.arrivalWaiting}
                      </span>
                    )}
                    {m.status === 'arrived' && confirmed && (
                      <span className="badge text-xs" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
                        <Icon.CheckCircle size={12} className="inline mr-1" />
                        {t.arrivalConfirmedByContractor}
                      </span>
                    )}
                    {m.status === 'arrived' && rejected && (
                      <span className="badge text-xs" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>
                        <Icon.X size={12} className="inline mr-1" />
                        {t.arrivalRejectedByContractor}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Government schemes */}
        <SchemesCard worker={worker} lang={lang} onUpdate={async (schemes) => {
          await supabase.from('workers').update({ schemes_registered: schemes }).eq('id', worker.id);
          toast('Sarkari labh update kiya.', 'success');
        }} />

        {/* Report issue */}
        <ReportIssue worker={worker} t={t} />
      </div>

      {/* Emergency section — visible to everyone */}
      <EmergencySection lang={lang} userType="worker" userName={worker.name} userPhone={worker.phone} />

      {/* SOS button */}
      {worker.women_safety && <SosButton worker={worker} t={t} />}
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="card p-3.5 flex flex-col items-center text-center">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <span className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>{value}</span>
      <span className="text-[10px] font-medium leading-tight" style={{ color: 'rgba(11,25,87,0.5)' }}>{label}</span>
    </div>
  );
}

function WageMeter({ skills, t }: { skills: string[]; t: T }) {
  const [skill, setSkill] = useState(skills[0] ?? 'Mason/Mistri');
  const range = MARKET_RATES[skill] ?? [400, 700];
  const pct = (v: number) => ((v - range[0]) / (range[1] - range[0])) * 100;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(158,204,250,0.25)' }}>
          <Icon.TrendingUp size={18} style={{ color: '#0B1957' }} />
        </div>
        <h2 className="font-display font-bold text-base flex-1" style={{ color: '#0B1957' }}>{t.todayFairRate}</h2>
      </div>
      {skills.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {skills.map((s) => (
            <button key={s} onClick={() => setSkill(s)} className={`chip text-xs px-3 py-1.5 ${skill === s ? 'chip-active' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="relative h-3 rounded-full mb-2" style={{ background: 'rgba(11,25,87,0.08)' }}>
        <div
          className="absolute h-3 rounded-full"
          style={{ left: '0%', width: '100%', background: 'linear-gradient(90deg, #9ECCFA, #1D9E75)' }}
        />
        <div className="absolute -top-1 w-5 h-5 rounded-full border-2 border-white" style={{ left: `calc(${pct(range[0])}% - 10px)`, background: '#0B1957' }} />
        <div className="absolute -top-1 w-5 h-5 rounded-full border-2 border-white" style={{ left: `calc(${pct(range[1])}% - 10px)`, background: '#1D9E75' }} />
      </div>
      <div className="flex justify-between text-sm font-semibold mb-2" style={{ color: '#0B1957' }}>
        <span>₹{range[0]}/day</span>
        <span>₹{range[1]}/day</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(11,25,87,0.55)' }}>
        {t.negotiateNote}
      </p>
    </div>
  );
}

function JobCard({ job, worker, onAccept, t }: { job: Job; worker: Worker; onAccept: () => void; t: T }) {
  const [confirm, setConfirm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const dist = worker.lat != null && worker.lng != null && job.lat != null && job.lng != null
    ? haversine(worker.lat, worker.lng, job.lat, job.lng)
    : null;

  return (
    <div className="card fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(11,25,87,0.06)' }}>
          <Icon.Building size={20} style={{ color: '#0B1957' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{job.contractor_name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>{job.skill} · {timeAgo(job.created_at)}</p>
        </div>
        <span className="badge" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
          ₹{job.per_day_wage}/day
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: 'rgba(11,25,87,0.6)' }}>
        <span className="flex items-center gap-1">
          <Icon.MapPin size={13} />
          {job.location_text}
        </span>
        {dist != null && <span>· {dist.toFixed(1)}km door</span>}
      </div>

      <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>
        <Icon.Users size={13} />
        {job.workers_needed - job.workers_filled} {t.workersNeeded}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setShowMap(true)} className="btn-secondary text-sm flex-1 py-2.5">
          <Icon.Map size={16} />
          {t.mapView}
        </button>
        <button onClick={() => setConfirm(true)} className="btn-primary text-sm flex-1 py-2.5">
          <Icon.Check size={16} />
          {t.acceptJob}
        </button>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t.confirmJob}>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(186,117,23,0.1)' }}>
            <Icon.AlertTriangle size={20} style={{ color: '#BA7517' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: '#0B1957' }}>
              {t.confirmJobWarning}
            </p>
          </div>
          <button
            onClick={() => { setConfirm(false); onAccept(); }}
            className="btn-primary w-full"
          >
            {t.understoodAccept}
          </button>
        </div>
      </Modal>

      <MapModal open={showMap} onClose={() => setShowMap(false)} job={job} workerLat={worker.lat} workerLng={worker.lng} t={t} />
    </div>
  );
}

export function MapModal({ open, onClose, job, workerLat, workerLng, t }: { open: boolean; onClose: () => void; job: Job; workerLat: number | null; workerLng: number | null; t: T }) {
  const hasDest = job.lat != null && job.lng != null;
  const hasOrigin = workerLat != null && workerLng != null;
  const mapsUrl = hasDest
    ? hasOrigin
      ? `https://www.google.com/maps/dir/?api=1&origin=${workerLat},${workerLng}&destination=${job.lat},${job.lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${job.lat},${job.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location_text)}`;
  const embedUrl = hasDest
    ? `https://maps.google.com/maps?q=${job.lat},${job.lng}&z=14&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(job.location_text)}&z=13&output=embed`;

  return (
    <Modal open={open} onClose={onClose} title={t.mapView}>
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(11,25,87,0.1)' }}>
          <iframe
            src={embedUrl}
            className="w-full"
            style={{ height: 220, border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="map"
          />
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(11,25,87,0.6)' }}>
          <Icon.MapPin size={16} style={{ color: '#D85A30' }} />
          {job.location_text}
        </div>
        {!hasOrigin && (
          <p className="text-xs" style={{ color: 'rgba(11,25,87,0.45)' }}>
            Location permission nahi mila, sirf site ka pin dikha rahe hain.
          </p>
        )}
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-primary w-full">
          <Icon.Navigation size={18} />
          Turn-by-turn navigation kholo
        </a>
      </div>
    </Modal>
  );
}

function SchemesCard({ worker, lang, onUpdate }: { worker: Worker; lang: Lang; onUpdate: (s: string[]) => void }) {
  const t = useT(lang);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [registerScheme, setRegisterScheme] = useState<typeof SCHEMES[number] | null>(null);
  const registered = worker.schemes_registered ?? [];

  const toggle = (id: string) => {
    const next = registered.includes(id) ? registered.filter((x) => x !== id) : [...registered, id];
    onUpdate(next);
  };

  const filtered = SCHEMES.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="card">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-3 w-full text-left">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.12)' }}>
            <Icon.Award size={18} style={{ color: '#1D9E75' }} />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-sm" style={{ color: '#0B1957' }}>{t.govSchemes}</h2>
            <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>
              {registered.length > 0 ? `${registered.length} ${t.alreadyRegistered}` : t.govSchemesSub}
            </p>
          </div>
          <Icon.ChevronDown size={20} style={{ color: 'rgba(11,25,87,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {open && (
          <div className="mt-4 space-y-4 fade-in">
            {/* Search */}
            <div className="relative">
              <Icon.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(11,25,87,0.4)' }} />
              <input
                className="input pl-9 text-sm"
                placeholder={t.schemeSearch}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Latest news */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#D85A30' }} />
                <h3 className="font-display font-bold text-xs uppercase tracking-wide" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.latestNews}</h3>
              </div>
              <div className="space-y-1.5">
                <NewsItem text={t.eshramNews1} tag={t.schemeNew} tagColor="#D85A30" />
                <NewsItem text={t.bocwNews} tag={t.schemeActive} tagColor="#1D9E75" />
                <NewsItem text={t.eshramNews2} tag={t.schemeActive} tagColor="#1D9E75" />
              </div>
            </div>

            {/* Scheme cards */}
            <div>
              <h3 className="font-display font-bold text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.majorSchemes}</h3>
              <div className="space-y-2.5">
                {filtered.map((s) => {
                  const isReg = registered.includes(s.id);
                  return (
                    <div key={s.id} className="rounded-xl p-3.5" style={{ background: isReg ? 'rgba(29,158,117,0.06)' : '#fff', border: `1px solid ${isReg ? 'rgba(29,158,117,0.2)' : 'rgba(11,25,87,0.08)'}` }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, color: s.color }}>
                          <Icon.ShieldCheck size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{s.name}</p>
                            {isReg && (
                              <span className="badge" style={{ background: '#1D9E75', color: '#fff' }}>
                                <Icon.Check size={10} /> {t.alreadyRegistered}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(11,25,87,0.55)' }}>{s.desc}</p>
                          <p className="text-xs mt-1.5 font-medium" style={{ color: s.color }}>{s.benefit}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {!isReg ? (
                          <button onClick={() => setRegisterScheme(s)} className="btn-primary text-xs flex-1 py-2.5">
                            <Icon.ArrowRight size={14} />
                            {t.registerNow}
                          </button>
                        ) : (
                          <button onClick={() => toggle(s.id)} className="btn-secondary text-xs flex-1 py-2.5">
                            <Icon.X size={14} />
                            Remove
                          </button>
                        )}
                        <button onClick={() => setRegisterScheme(s)} className="btn-ghost text-xs px-3 py-2.5" style={{ border: '1px solid rgba(11,25,87,0.1)' }}>
                          <Icon.Info size={14} />
                          Guide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Help section */}
            <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'rgba(11,25,87,0.04)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0B1957' }}>
                <Icon.PhoneCall size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{t.needHelp}</p>
                <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.needHelpSub}</p>
              </div>
              <a href="tel:18001801111" className="btn-secondary text-xs px-3 py-2.5">
                <Icon.Phone size={14} />
                {t.helpFind}
              </a>
            </div>
          </div>
        )}
      </div>

      {registerScheme && (
        <RegisterModal
          scheme={registerScheme}
          lang={lang}
          isReg={registered.includes(registerScheme.id)}
          onClose={() => setRegisterScheme(null)}
          onRegister={() => { toggle(registerScheme.id); setRegisterScheme(null); }}
        />
      )}
    </>
  );
}

function NewsItem({ text, tag, tagColor }: { text: string; tag: string; tagColor: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(11,25,87,0.03)' }}>
      <span className="badge flex-shrink-0 text-[9px] px-1.5 py-0.5" style={{ background: `${tagColor}15`, color: tagColor }}>{tag}</span>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(11,25,87,0.65)' }}>{text}</p>
    </div>
  );
}

function RegisterModal({ scheme, lang, isReg, onClose, onRegister }: {
  scheme: typeof SCHEMES[number];
  lang: Lang;
  isReg: boolean;
  onClose: () => void;
  onRegister: () => void;
}) {
  const t = useT(lang);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md slide-up bg-white rounded-t-3xl sm:rounded-2xl m-0 sm:m-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(11,25,87,0.06)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${scheme.color}15`, color: scheme.color }}>
            <Icon.ShieldCheck size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-base" style={{ color: '#0B1957' }}>{scheme.name}</h3>
            <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>{scheme.benefit}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5">
            <Icon.X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,25,87,0.7)' }}>{scheme.desc}</p>

          {/* Video tutorial */}
          <YouTubePlayer url={scheme.videoUrl} title={t.schemeVideoHelp} />

          {/* Step-by-step guide */}
          <div>
            <h4 className="font-display font-bold text-sm mb-3" style={{ color: '#0B1957' }}>{t.schemeStepTitle}</h4>
            <div className="space-y-2">
              {scheme.steps.map((s, i) => {
                const isDone = done || i < step;
                return (
                  <button
                    key={i}
                    onClick={() => setStep(i + 1)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.99]"
                    style={{ background: isDone ? 'rgba(29,158,117,0.08)' : 'rgba(11,25,87,0.03)', border: `1px solid ${isDone ? 'rgba(29,158,117,0.2)' : 'transparent'}` }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={isDone ? { background: '#1D9E75', color: '#fff' } : { background: 'rgba(11,25,87,0.08)', color: 'rgba(11,25,87,0.5)' }}
                    >
                      {isDone ? <Icon.Check size={14} /> : i + 1}
                    </div>
                    <p className="text-sm flex-1 pt-0.5" style={{ color: isDone ? '#1D9E75' : '#0B1957' }}>{s}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Helpline */}
          <a href={`tel:${scheme.helpline}`} className="card-sand w-full flex items-center gap-3 active:scale-[0.99]">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1D9E75' }}>
              <Icon.Phone size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{t.schemeCallHelp}</p>
              <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>Helpline: {scheme.helpline}</p>
            </div>
            <Icon.PhoneCall size={18} style={{ color: '#1D9E75' }} />
          </a>

          {/* Submit */}
          <button
            onClick={() => { setDone(true); setTimeout(() => { onRegister(); }, 600); }}
            disabled={done}
            className="btn-primary w-full disabled:opacity-60"
          >
            {done ? <><Icon.CheckCircle size={20} /> Done!</> : <><Icon.Check size={20} /> {isReg ? 'Update' : t.schemeSubmit}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportIssue({ worker, t }: { worker: Worker; t: T }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const { toast } = useToast();
  const categories = ['payment_not_received', 'wrong_skill_match', 'no_show_dispute', 'wage_below_agreed', 'other'];

  const submit = async () => {
    if (!category || !desc.trim()) return;
    await supabase.from('tickets').insert({
      raised_by_type: 'worker',
      raised_by_name: worker.name,
      category,
      description: desc.trim(),
      status: 'open',
    });
    setOpen(false);
    setCategory('');
    setDesc('');
    toast('Shikayat darj ho gayi. Team jald contact karegi.', 'success');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="card-sand w-full flex items-center gap-3 text-left active:scale-[0.99]">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(216,90,48,0.12)' }}>
          <Icon.Flag size={18} style={{ color: '#D85A30' }} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{t.reportIssue}</p>
          <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.reportIssueSub}</p>
        </div>
        <Icon.ChevronRight size={18} style={{ color: 'rgba(11,25,87,0.3)' }} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t.reportIssue}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.reportCategory}</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`chip text-xs ${category === c ? 'chip-active' : ''}`}>
                  {c.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.reportDetail}</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder={t.reportDetailPlaceholder}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <button onClick={submit} disabled={!category || !desc.trim()} className="btn-primary w-full disabled:opacity-40">
            {t.reportSubmit}
          </button>
        </div>
      </Modal>
    </>
  );
}

function SosButton({ worker, t }: { worker: Worker; t: T }) {
  const [confirm, setConfirm] = useState(false);
  const { toast } = useToast();

  const trigger = async () => {
    setConfirm(false);
    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }),
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch { /* ignore */ }

    await supabase.from('sos_events').insert({
      worker_id: worker.id,
      worker_name: worker.name,
      lat,
      lng,
      status: 'active',
    });
    await supabase.from('activity').insert({
      event_type: 'sos_alert',
      actor_name: worker.name,
      detail: 'SOS alert triggered',
      photo_url: worker.photo_url,
    });
    toast('Support team ko alert bhej diya gaya. Help aa rahi hai.', 'error');
  };

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="fixed bottom-5 right-5 z-40 w-16 h-16 rounded-full flex items-center justify-center text-white sos-pulse"
        style={{ background: '#D85A30' }}
      >
        <span className="font-display font-bold text-sm leading-none text-center">
          SOS
        </span>
      </button>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t.sosTitle}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(216,90,48,0.1)' }}>
            <Icon.AlertTriangle size={20} style={{ color: '#D85A30' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: '#0B1957' }}>
              {t.sosConfirm}
            </p>
          </div>
          <button onClick={trigger} className="btn-primary w-full" style={{ background: '#D85A30' }}>
            <Icon.Send size={18} />
            {t.sosSend}
          </button>
        </div>
      </Modal>
    </>
  );
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function YouTubePlayer({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumbOk, setThumbOk] = useState(true);
  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(11,25,87,0.08)' }}
      >
        <div className="flex items-center gap-3 p-3" style={{ background: 'rgba(11,25,87,0.03)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#D85A30' }}>
            <Icon.Play size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{title}</p>
            <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>Open video on YouTube</p>
          </div>
        </div>
      </a>
    );
  }

  const thumb = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(11,25,87,0.08)' }}>
      <div className="flex items-center gap-3 p-3" style={{ background: 'rgba(11,25,87,0.03)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#D85A30' }}>
          <Icon.Play size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{title}</p>
          <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>Tap play to watch</p>
        </div>
      </div>
      <div className="relative" style={{ aspectRatio: '16/9', background: '#0B1957' }}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full flex items-center justify-center group"
            aria-label="Play video"
          >
            {thumbOk && (
              <img
                src={thumb}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={() => setThumbOk(false)}
              />
            )}
            <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
            <span className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95" style={{ background: 'rgba(217,90,48,0.95)' }}>
              <span className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[18px] border-l-white ml-1" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
