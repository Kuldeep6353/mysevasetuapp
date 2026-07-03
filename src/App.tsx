import { useEffect, useState } from 'react';
import { ToastProvider } from './components/Toast';
import { PulseStrip } from './components/PulseStrip';
import { Landing } from './screens/Landing';
import { LanguageSelect } from './screens/LanguageSelect';
import { RoleSelect } from './screens/RoleSelect';
import { WorkerOnboarding } from './screens/WorkerOnboarding';
import { WorkerDashboard } from './screens/WorkerDashboard';
import { ContractorOnboarding } from './screens/ContractorOnboarding';
import { ContractorDashboard } from './screens/ContractorDashboard';
import { AdminPanel } from './screens/AdminPanel';
import type { Worker } from './lib/supabase';
import type { Lang } from './lib/i18n';

export type Screen =
  | { name: 'landing' }
  | { name: 'language' }
  | { name: 'role' }
  | { name: 'worker_onboarding' }
  | { name: 'worker_dashboard'; workerId: string }
  | { name: 'contractor_onboarding' }
  | { name: 'contractor_dashboard'; contractorName: string; contractorPhone: string }
  | { name: 'admin' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'landing' });
  const [lang, setLang] = useState<Lang>('hi');
  const [ready, setReady] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedLang = (localStorage.getItem('mk_lang') ?? 'hi') as Lang;
    setLang(savedLang);

    const workerId = localStorage.getItem('mk_worker_id');
    if (workerId) {
      setScreen({ name: 'worker_dashboard', workerId });
      setReady(true);
      return;
    }
    const contractorName = localStorage.getItem('mk_contractor_name');
    const contractorPhone = localStorage.getItem('mk_contractor_phone');
    if (contractorName && contractorPhone) {
      setScreen({ name: 'contractor_dashboard', contractorName, contractorPhone });
      setReady(true);
      return;
    }
    setReady(true);
  }, []);

  const pickLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('mk_lang', l);
    setScreen({ name: 'role' });
  };

  if (!ready) return null;

  return (
    <ToastProvider>
      <PulseStrip />
      <div className="min-h-screen pt-11" style={{ background: '#F8F3EA' }}>
        {screen.name === 'landing' && (
          <Landing
            lang={lang}
            onEnter={() => setScreen({ name: 'language' })}
            onWorkerLogin={() => {
              const id = localStorage.getItem('mk_worker_id');
              if (id) setScreen({ name: 'worker_dashboard', workerId: id });
              else setScreen({ name: 'language' });
            }}
            onContractorLogin={() => {
              const n = localStorage.getItem('mk_contractor_name');
              const p = localStorage.getItem('mk_contractor_phone');
              if (n && p) setScreen({ name: 'contractor_dashboard', contractorName: n, contractorPhone: p });
              else setScreen({ name: 'language' });
            }}
            onAdmin={() => setScreen({ name: 'admin' })}
          />
        )}
        {screen.name === 'language' && (
          <LanguageSelect onPick={pickLang} />
        )}
        {screen.name === 'role' && (
          <RoleSelect
            lang={lang}
            onWorker={() => setScreen({ name: 'worker_onboarding' })}
            onContractor={() => setScreen({ name: 'contractor_onboarding' })}
          />
        )}
        {screen.name === 'worker_onboarding' && (
          <WorkerOnboarding
            lang={lang}
            onDone={(w: Worker) => {
              localStorage.setItem('mk_worker_id', w.id);
              setScreen({ name: 'worker_dashboard', workerId: w.id });
            }}
          />
        )}
        {screen.name === 'worker_dashboard' && (
          <WorkerDashboard
            lang={lang}
            workerId={screen.workerId}
            onExit={() => {
              localStorage.removeItem('mk_worker_id');
              setScreen({ name: 'landing' });
            }}
          />
        )}
        {screen.name === 'contractor_onboarding' && (
          <ContractorOnboarding
            lang={lang}
            onDone={(name, phone) => {
              localStorage.setItem('mk_contractor_name', name);
              localStorage.setItem('mk_contractor_phone', phone);
              setScreen({ name: 'contractor_dashboard', contractorName: name, contractorPhone: phone });
            }}
          />
        )}
        {screen.name === 'contractor_dashboard' && (
          <ContractorDashboard
            lang={lang}
            contractorName={screen.contractorName}
            contractorPhone={screen.contractorPhone}
            onExit={() => {
              localStorage.removeItem('mk_contractor_name');
              localStorage.removeItem('mk_contractor_phone');
              setScreen({ name: 'landing' });
            }}
          />
        )}
        {screen.name === 'admin' && <AdminPanel onExit={() => setScreen({ name: 'landing' })} />}
      </div>
    </ToastProvider>
  );
}
