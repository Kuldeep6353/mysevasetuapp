import { useMemo, useState } from 'react';
import { Icon } from '../components/Icons';
import { Avatar, ScoreBadge, EmptyState, Modal, Skeleton } from '../components/ui';
import { useToast } from '../components/Toast';
import { supabase, SCHEMES, type Worker, type Job, type Ticket, type SosEvent, type Activity } from '../lib/supabase';
import { useWorkers, useJobs, useTickets, useSosEvents, useActivity, timeAgo, computeBharosa } from '../lib/hooks';

type Tab = 'overview' | 'workers' | 'jobs' | 'tickets' | 'welfare' | 'safety';

export function AdminPanel({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const { data: workers } = useWorkers();
  const { data: jobs } = useJobs();
  const { data: tickets } = useTickets();
  const { data: sos } = useSosEvents();
  const { data: activity } = useActivity();

  const activeSos = (sos ?? []).filter((s) => s.status === 'active');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Icon.Activity size={18} /> },
    { id: 'workers', label: 'Workers', icon: <Icon.Users size={18} />, badge: workers?.length },
    { id: 'jobs', label: 'Jobs', icon: <Icon.Briefcase size={18} />, badge: jobs?.filter((j) => j.status === 'open').length },
    { id: 'tickets', label: 'Tickets', icon: <Icon.LifeBuoy size={18} />, badge: tickets?.filter((t) => t.status !== 'resolved').length },
    { id: 'welfare', label: 'Welfare', icon: <Icon.Award size={18} /> },
    { id: 'safety', label: 'Safety', icon: <Icon.Shield size={18} />, badge: activeSos.length || undefined },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden sm:flex flex-col w-60 fixed inset-y-0 left-0 pt-11 z-30" style={{ background: '#0B1957' }}>
        <div className="px-5 py-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Icon.Tool size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">Mera Karigar</p>
            <p className="text-[10px] text-white/50 mt-0.5">Helpline Operations</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.12)', color: '#fff' } : { color: 'rgba(255,255,255,0.6)' }}
            >
              {t.icon}
              <span className="flex-1 text-left">{t.label}</span>
              {t.badge != null && t.badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: t.id === 'safety' ? '#D85A30' : 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button onClick={onExit} className="px-5 py-4 flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <Icon.LogOut size={18} />
          Exit
        </button>
      </aside>

      {/* Mobile top tabs */}
      <div className="sm:hidden fixed top-11 left-0 right-0 z-30 overflow-x-auto" style={{ background: '#0B1957' }}>
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
              style={tab === t.id ? { background: 'rgba(255,255,255,0.15)', color: '#fff' } : { color: 'rgba(255,255,255,0.5)' }}
            >
              {t.icon}
              {t.label}
              {t.badge != null && t.badge > 0 && <span className="text-[9px] font-bold px-1 rounded-full" style={{ background: t.id === 'safety' ? '#D85A30' : 'rgba(255,255,255,0.2)' }}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 sm:ml-60 pt-11 sm:pt-11" style={{ background: '#F8F3EA' }}>
        <div className="sm:hidden h-12" />
        <div className="p-4 sm:p-6 max-w-5xl">
          {tab === 'overview' && <Overview workers={workers} jobs={jobs} activity={activity} sos={sos} />}
          {tab === 'workers' && <WorkersTab workers={workers} />}
          {tab === 'jobs' && <JobsTab jobs={jobs} />}
          {tab === 'tickets' && <TicketsTab tickets={tickets} />}
          {tab === 'welfare' && <WelfareTab workers={workers} />}
          {tab === 'safety' && <SafetyTab workers={workers} sos={sos} />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>{icon}</div>
      </div>
      <p className="font-display font-bold text-2xl" style={{ color: '#0B1957' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: 'rgba(11,25,87,0.5)' }}>{label}</p>
    </div>
  );
}

function Overview({ workers, jobs, activity, sos }: { workers: Worker[] | null; jobs: Job[] | null; activity: Activity[] | null; sos: SosEvent[] | null }) {
  const avgBharosa = workers && workers.length > 0 ? Math.round(workers.reduce((s, w) => s + computeBharosa(w), 0) / workers.length) : 0;
  const filled = jobs ? jobs.reduce((s, j) => s + j.workers_filled, 0) : 0;
  const needed = jobs ? jobs.reduce((s, j) => s + j.workers_needed, 0) : 0;
  const activeSos = (sos ?? []).filter((s) => s.status === 'active');

  return (
    <div className="space-y-5 fade-in">
      {activeSos.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#D85A30' }}>
          <Icon.AlertTriangle size={24} className="text-white flex-shrink-0" />
          <div className="flex-1 text-white">
            <p className="font-display font-bold text-sm">{activeSos.length} SOS ALERT{activeSos.length > 1 ? 'S' : ''} — IMMEDIATE ATTENTION</p>
            <p className="text-xs opacity-90 mt-0.5">{activeSos[0].worker_name} — Safety tab par jayein</p>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display font-bold text-xl mb-3" style={{ color: '#0B1957' }}>Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Icon.Users size={18} />} value={workers?.length ?? 0} label="Total workers" color="#0B1957" />
          <StatCard icon={<Icon.ShieldCheck size={18} />} value={avgBharosa} label="Avg Bharosa Score" color="#1D9E75" />
          <StatCard icon={<Icon.Briefcase size={18} />} value={jobs?.filter((j) => j.status === 'open').length ?? 0} label="Jobs posted today" color="#BA7517" />
          <StatCard icon={<Icon.CheckCircle size={18} />} value={`${filled}/${needed}`} label="Positions filled" color="#1D9E75" />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#1D9E75' }} />
          <h2 className="font-display font-bold text-base" style={{ color: '#0B1957' }}>Live Activity Feed</h2>
        </div>
        {!activity ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : activity.length === 0 ? (
          <EmptyState icon={<Icon.Activity size={28} />} title="Abhi koi activity nahi" />
        ) : (
          <div className="space-y-2">
            {activity.slice(0, 30).map((a) => <ActivityRow key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ a }: { a: Activity }) {
  const icon = a.event_type === 'worker_checkin' ? <Icon.User size={16} /> :
    a.event_type === 'job_posted' ? <Icon.Briefcase size={16} /> :
    a.event_type === 'worker_matched' ? <Icon.CheckCircle size={16} /> :
    a.event_type === 'sos_alert' ? <Icon.AlertTriangle size={16} /> :
    a.event_type === 'invite_sent' ? <Icon.Send size={16} /> : <Icon.Activity size={16} />;
  const color = a.event_type === 'sos_alert' ? '#D85A30' : a.event_type === 'worker_checkin' ? '#1D9E75' : a.event_type === 'job_posted' ? '#BA7517' : '#0B1957';
  return (
    <div className="card flex items-center gap-3 py-3 fade-in">
      {a.photo_url ? (
        <Avatar src={a.photo_url} name={a.actor_name} size={36} />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: '#0B1957' }}>
          <span className="font-semibold">{a.actor_name}</span> {a.detail}
        </p>
        <p className="text-xs" style={{ color: 'rgba(11,25,87,0.4)' }}>{timeAgo(a.created_at)}</p>
      </div>
      {!a.photo_url && <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>{icon}</div>}
    </div>
  );
}

function WorkersTab({ workers }: { workers: Worker[] | null }) {
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    if (!workers) return [];
    return workers.filter((w) => {
      if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.phone.includes(search)) return false;
      if (skillFilter && !w.skills.includes(skillFilter)) return false;
      if (statusFilter && w.status !== statusFilter) return false;
      return true;
    });
  }, [workers, search, skillFilter, statusFilter]);

  return (
    <div className="space-y-4 fade-in">
      <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>Workers</h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Icon.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(11,25,87,0.4)' }} />
          <input className="input pl-9" placeholder="Naam ya phone search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
          <option value="">All skills</option>
          {['Mason/Mistri', 'Plumber', 'Electrician', 'Painter', 'Carpenter', 'Helper/Labour', 'Welder', 'Tile Worker'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="available">Available</option>
          <option value="on_job">On job</option>
        </select>
      </div>

      {!workers ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Icon.Users size={28} />} title="Koi worker nahi mila" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(11,25,87,0.04)' }}>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'rgba(11,25,87,0.6)' }}>WORKER</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'rgba(11,25,87,0.6)' }}>SKILL</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'rgba(11,25,87,0.6)' }}>PHONE</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'rgba(11,25,87,0.6)' }}>STATUS</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'rgba(11,25,87,0.6)' }}>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="border-t" style={{ borderColor: 'rgba(11,25,87,0.05)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={w.photo_url} name={w.name} size={32} />
                        <span className="font-medium" style={{ color: '#0B1957' }}>{w.name}</span>
                        {w.women_safety && <Icon.Shield size={12} style={{ color: '#D85A30' }} />}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(11,25,87,0.6)' }}>{w.skills.join(', ')}</td>
                    <td className="px-4 py-3" style={{ color: 'rgba(11,25,87,0.6)' }}>+91 {w.phone}</td>
                    <td className="px-4 py-3">
                      <span className="badge" style={{ background: w.status === 'available' ? 'rgba(29,158,117,0.12)' : 'rgba(186,117,23,0.12)', color: w.status === 'available' ? '#1D9E75' : '#BA7517' }}>
                        {w.status === 'available' ? 'Available' : 'On job'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ScoreBadge score={computeBharosa(w)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function JobsTab({ jobs }: { jobs: Job[] | null }) {
  const { toast } = useToast();
  return (
    <div className="space-y-4 fade-in">
      <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>Jobs</h1>
      {!jobs ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={<Icon.Briefcase size={28} />} title="Koi job nahi" />
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <div key={j.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(11,25,87,0.06)' }}>
                <Icon.Briefcase size={20} style={{ color: '#0B1957' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{j.contractor_name} — {j.skill}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>
                  {j.location_text} · ₹{j.per_day_wage}/day · {j.workers_filled}/{j.workers_needed} filled · {timeAgo(j.created_at)}
                </p>
              </div>
              <span className="badge flex-shrink-0" style={{ background: j.status === 'open' ? 'rgba(29,158,117,0.12)' : j.status === 'disputed' ? 'rgba(216,90,48,0.12)' : 'rgba(11,25,87,0.08)', color: j.status === 'open' ? '#1D9E75' : j.status === 'disputed' ? '#D85A30' : 'rgba(11,25,87,0.5)' }}>
                {j.status}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={async () => { await supabase.from('jobs').update({ status: 'closed' }).eq('id', j.id); toast('Job closed.', 'success'); }}
                  className="btn-ghost text-xs px-2.5 py-1.5"
                >Close</button>
                <button
                  onClick={async () => { await supabase.from('jobs').update({ status: 'disputed' }).eq('id', j.id); toast('Job marked disputed.', 'error'); }}
                  className="btn-ghost text-xs px-2.5 py-1.5"
                  style={{ color: '#D85A30' }}
                >Dispute</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketsTab({ tickets }: { tickets: Ticket[] | null }) {
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const statusColor = (s: string) => s === 'open' ? '#D85A30' : s === 'in_progress' ? '#BA7517' : '#1D9E75';
  const statusBg = (s: string) => s === 'open' ? 'rgba(216,90,48,0.12)' : s === 'in_progress' ? 'rgba(186,117,23,0.12)' : 'rgba(29,158,117,0.12)';

  return (
    <div className="space-y-4 fade-in">
      <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>Support Tickets</h1>
      {!tickets ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={<Icon.LifeBuoy size={28} />} title="Koi ticket nahi" />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => { setSelected(t); setNotes(t.notes); }} className="card flex items-start gap-3 text-left w-full active:scale-[0.99]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: statusBg(t.status), color: statusColor(t.status) }}>
                <Icon.LifeBuoy size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{t.raised_by_name}</p>
                  <span className="badge" style={{ background: statusBg(t.status), color: statusColor(t.status) }}>{t.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.category.replace(/_/g, ' ')} · {timeAgo(t.created_at)}</p>
                <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.description}</p>
              </div>
              <Icon.ChevronRight size={18} style={{ color: 'rgba(11,25,87,0.3)' }} />
            </button>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Ticket detail">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium" style={{ color: 'rgba(11,25,87,0.5)' }}>Raised by</p>
              <p className="text-sm font-semibold" style={{ color: '#0B1957' }}>{selected.raised_by_name} ({selected.raised_by_type})</p>
              {selected.against_name && <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>Against: {selected.against_name}</p>}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'rgba(11,25,87,0.5)' }}>Category</p>
              <p className="text-sm" style={{ color: '#0B1957' }}>{selected.category.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'rgba(11,25,87,0.5)' }}>Description</p>
              <p className="text-sm" style={{ color: '#0B1957' }}>{selected.description}</p>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'rgba(11,25,87,0.5)' }}>Operator notes</label>
              <textarea className="input min-h-[70px] resize-none text-sm" placeholder="Notes add karein..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {['open', 'in_progress', 'resolved'].map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    await supabase.from('tickets').update({ status: s, notes, updated_at: new Date().toISOString() }).eq('id', selected.id);
                    toast(`Ticket ${s.replace('_', ' ')}`, 'success');
                    setSelected(null);
                  }}
                  className="btn-secondary text-xs flex-1 py-2.5"
                  style={selected.status === s ? { background: statusBg(s), color: statusColor(s), borderColor: statusColor(s) } : {}}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function WelfareTab({ workers }: { workers: Worker[] | null }) {
  const { toast } = useToast();
  if (!workers) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const nudged = workers.length;
  const registered = (schemeId: string) => workers.filter((w) => (w.schemes_registered ?? []).includes(schemeId)).length;

  return (
    <div className="space-y-5 fade-in">
      <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>Welfare Scheme Tracker</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCHEMES.map((s) => {
          const reg = registered(s.id);
          const pct = nudged > 0 ? Math.round((reg / nudged) * 100) : 0;
          return (
            <div key={s.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.12)' }}>
                  <Icon.Award size={16} style={{ color: '#1D9E75' }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>{s.name}</p>
              </div>
              <p className="font-display font-bold text-2xl" style={{ color: '#0B1957' }}>{reg}<span className="text-sm font-normal" style={{ color: 'rgba(11,25,87,0.4)' }}>/{nudged}</span></p>
              <div className="h-2 rounded-full mt-2" style={{ background: 'rgba(11,25,87,0.06)' }}>
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: '#1D9E75' }} />
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(11,25,87,0.5)' }}>{pct}% registered</p>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="font-display font-bold text-sm mb-2" style={{ color: '#0B1957' }}>Workers — manually mark registration</h2>
        <div className="space-y-2">
          {workers.slice(0, 20).map((w) => (
            <div key={w.id} className="card flex items-center gap-3 py-3">
              <Avatar src={w.photo_url} name={w.name} size={36} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm" style={{ color: '#0B1957' }}>{w.name}</p>
                <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>{w.skills.join(', ')}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {SCHEMES.map((s) => {
                  const isReg = (w.schemes_registered ?? []).includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={async () => {
                        const cur = w.schemes_registered ?? [];
                        const next = isReg ? cur.filter((x) => x !== s.id) : [...cur, s.id];
                        await supabase.from('workers').update({ schemes_registered: next }).eq('id', w.id);
                        toast(`${w.name}: ${s.name} ${isReg ? 'removed' : 'marked'}`, 'success');
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={isReg ? { background: '#1D9E75', color: '#fff' } : { background: 'rgba(11,25,87,0.06)', color: 'rgba(11,25,87,0.4)' }}
                      title={s.name}
                    >
                      {isReg ? <Icon.Check size={16} /> : <Icon.Plus size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SafetyTab({ workers, sos }: { workers: Worker[] | null; sos: SosEvent[] | null }) {
  const { toast } = useToast();
  const womenWorkers = (workers ?? []).filter((w) => w.women_safety);
  const activeSos = (sos ?? []).filter((s) => s.status === 'active');
  const resolvedSos = (sos ?? []).filter((s) => s.status === 'resolved');

  return (
    <div className="space-y-5 fade-in">
      <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>Safety</h1>

      {activeSos.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#D85A30' }}>
          {activeSos.map((s) => (
            <div key={s.id} className="p-4 flex items-center gap-3 text-white">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon.AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-sm">SOS — {s.worker_name}</p>
                <p className="text-xs opacity-90 mt-0.5">
                  {timeAgo(s.created_at)}
                  {s.lat != null && s.lng != null && ` · ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`}
                </p>
                {s.lat != null && s.lng != null && (
                  <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline mt-1">
                    <Icon.Map size={12} /> Map pe dekho
                  </a>
                )}
              </div>
              <button
                onClick={async () => { await supabase.from('sos_events').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', s.id); toast('SOS resolved.', 'success'); }}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                Mark resolved
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-display font-bold text-sm mb-2" style={{ color: '#0B1957' }}>Women workers — safety enabled</h2>
        {womenWorkers.length === 0 ? (
          <EmptyState icon={<Icon.Shield size={28} />} title="Koi safety-enabled worker nahi" />
        ) : (
          <div className="space-y-2">
            {womenWorkers.map((w) => (
              <div key={w.id} className="card flex items-center gap-3 py-3">
                <Avatar src={w.photo_url} name={w.name} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: '#0B1957' }}>{w.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>{w.skills.join(', ')} · {w.status}</p>
                </div>
                <Icon.Shield size={16} style={{ color: '#D85A30' }} />
                <ScoreBadge score={computeBharosa(w)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {resolvedSos.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-sm mb-2" style={{ color: 'rgba(11,25,87,0.5)' }}>Resolved SOS</h2>
          <div className="space-y-2">
            {resolvedSos.map((s) => (
              <div key={s.id} className="card flex items-center gap-3 py-3 opacity-60">
                <Icon.CheckCircle size={20} style={{ color: '#1D9E75' }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#0B1957' }}>{s.worker_name}</p>
                  <p className="text-xs" style={{ color: 'rgba(11,25,87,0.4)' }}>Resolved {timeAgo(s.resolved_at ?? s.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
