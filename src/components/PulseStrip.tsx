import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from './Icons';

export function PulseStrip() {
  const [stats, setStats] = useState({ workers: 0, jobs: 0, matched: 0 });
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [w, j, m] = await Promise.all([
        supabase.from('workers').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('matches').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 3600000).toISOString()),
      ]);
      if (!active) return;
      setStats({ workers: w.count ?? 0, jobs: j.count ?? 0, matched: m.count ?? 0 });
    };
    load();
    const interval = setInterval(load, 4000);

    const channel = supabase
      .channel('pulse')
      .on('system', {}, () => setOnline(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe((status) => setOnline(status === 'SUBSCRIBED'));

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 text-white"
      style={{ background: '#0B1957' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-11 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 font-display font-bold tracking-tight">
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: '#1D9E75' }}
          />
          <span className="hidden sm:inline">LIVE</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 font-medium overflow-hidden">
          <Stat value={stats.workers} label="workers active" />
          <Divider />
          <Stat value={stats.jobs} label="jobs posted" />
          <Divider />
          <Stat value={stats.matched} label="matched (1hr)" />
        </div>
        <div className="flex items-center gap-1.5">
          {online ? <Icon.Wifi size={14} /> : <Icon.WifiOff size={14} style={{ color: '#D85A30' }} />}
        </div>
      </div>
    </div>
  );
}

const Stat = ({ value, label }: { value: number; label: string }) => (
  <span className="flex items-baseline gap-1 whitespace-nowrap">
    <span className="font-display font-bold text-sm sm:text-base">{value}</span>
    <span className="text-[10px] sm:text-xs opacity-70">{label}</span>
  </span>
);

const Divider = () => <span className="opacity-20">|</span>;
