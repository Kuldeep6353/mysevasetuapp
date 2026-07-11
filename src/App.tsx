import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ToastProvider } from './components/Toast';
import { PulseStrip } from './components/PulseStrip';
import { Icon } from './components/Icons';
import { Landing } from './screens/Landing';
import { LanguageSelect } from './screens/LanguageSelect';
import { AuthScreen } from './screens/AuthScreen';
import { RoleSelect } from './screens/RoleSelect';
import { WorkerOnboarding } from './screens/WorkerOnboarding';
import { WorkerDashboard } from './screens/WorkerDashboard';
import { ContractorOnboarding } from './screens/ContractorOnboarding';
import { ContractorDashboard } from './screens/ContractorDashboard';
import { AdminPanel } from './screens/AdminPanel';
import { ProfileDashboard } from './screens/ProfileDashboard';
import type { Worker } from './lib/supabase';
import type { Lang } from './lib/i18n';

type AuthState = {
  userId: string;
  email: string;
  role: 'worker' | 'contractor';
};

export type Screen =
  | { name: 'landing' }
  | { name: 'language' }
  | { name: 'auth' }
  | { name: 'role' }
  | { name: 'worker_onboarding'; userId: string; email: string }
  | { name: 'worker_dashboard'; workerId: string }
  | { name: 'contractor_onboarding'; userId: string; email: string }
  | { name: 'contractor_dashboard'; contractorName: string; contractorPhone: string }
  | { name: 'profile'; userId: string }
  | { name: 'admin' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'landing' });
  const [lang, setLang] = useState<Lang>('hi');
  const [ready, setReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState | null>(null);

  // Restore session from Supabase auth + localStorage on mount
  useEffect(() => {
    (async () => {
      const savedLang = (localStorage.getItem('mk_lang') ?? 'hi') as Lang;
      setLang(savedLang);

      // Check Supabase auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        const email = session.user.email ?? '';

        // Fetch user profile to get role
        const { data: profile } = await supabase.from('user_profiles').select('role, agreement_accepted').eq('id', userId).maybeSingle();

        if (profile && profile.agreement_accepted) {
          setAuthState({ userId, email, role: profile.role });

          if (profile.role === 'worker') {
            // Check if worker record exists
            const { data: worker } = await supabase.from('workers').select('id').eq('user_id', userId).maybeSingle();
            if (worker) {
              setScreen({ name: 'worker_dashboard', workerId: worker.id });
              setReady(true);
              return;
            }
            setScreen({ name: 'worker_onboarding', userId, email });
            setReady(true);
            return;
          } else {
            // Contractor — check localStorage for name/phone
            const contractorName = localStorage.getItem('mk_contractor_name');
            const contractorPhone = localStorage.getItem('mk_contractor_phone');
            if (contractorName && contractorPhone) {
              setScreen({ name: 'contractor_dashboard', contractorName, contractorPhone });
              setReady(true);
              return;
            }
            setScreen({ name: 'contractor_onboarding', userId, email });
            setReady(true);
            return;
          }
        }
      }

      // Fallback: check legacy localStorage sessions (pre-auth)
      const workerId = localStorage.getItem('mk_worker_id');
      if (workerId && workerId.length > 10) {
        setScreen({ name: 'worker_dashboard', workerId });
        setReady(true);
        return;
      }
      const contractorName = localStorage.getItem('mk_contractor_name');
      const contractorPhone = localStorage.getItem('mk_contractor_phone');
      if (contractorName && contractorPhone && contractorPhone.length === 10) {
        setScreen({ name: 'contractor_dashboard', contractorName, contractorPhone });
        setReady(true);
        return;
      }

      setReady(true);
    })();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          setAuthState(null);
          localStorage.removeItem('mk_worker_id');
          localStorage.removeItem('mk_contractor_name');
          localStorage.removeItem('mk_contractor_phone');
          setScreen({ name: 'landing' });
        }
      })();
    });
  }, []);

  const pickLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('mk_lang', l);
    setScreen({ name: 'auth' });
  };

  if (!ready) return null;

  const goProfile = () => {
    if (authState) setScreen({ name: 'profile', userId: authState.userId });
  };

  // Profile button shown on dashboards
  const ProfileBtn = () => (
    <button
      onClick={goProfile}
      className="w-9 h-9 rounded-lg flex items-center justify-center"
      style={{ background: 'rgba(11,25,87,0.08)' }}
    >
      <Icon.User size={18} style={{ color: '#0B1957' }} />
    </button>
  );

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
          <LanguageSelect onPick={pickLang} onBack={() => setScreen({ name: 'landing' })} />
        )}
        {screen.name === 'auth' && (
          <AuthScreen
            lang={lang}
            onBack={() => setScreen({ name: 'language' })}
            onAuthed={(role, userId, email) => {
              setAuthState({ userId, email, role });
              if (role === 'worker') {
                setScreen({ name: 'worker_onboarding', userId, email });
              } else {
                setScreen({ name: 'contractor_onboarding', userId, email });
              }
            }}
          />
        )}
        {screen.name === 'role' && (
          <RoleSelect
            lang={lang}
            onWorker={() => setScreen({ name: 'worker_onboarding', userId: authState?.userId ?? '', email: authState?.email ?? '' })}
            onContractor={() => setScreen({ name: 'contractor_onboarding', userId: authState?.userId ?? '', email: authState?.email ?? '' })}
          />
        )}
        {screen.name === 'worker_onboarding' && (
          <WorkerOnboarding
            lang={lang}
            userId={screen.userId}
            email={screen.email}
            onDone={(w: Worker) => {
              localStorage.setItem('mk_worker_id', w.id);
              setScreen({ name: 'worker_dashboard', workerId: w.id });
            }}
          />
        )}
        {screen.name === 'worker_dashboard' && (
          <>
            <div className="fixed top-11 right-3 z-40">
              <ProfileBtn />
            </div>
            <WorkerDashboard
              lang={lang}
              workerId={screen.workerId}
              onBack={() => setScreen({ name: 'profile', userId: authState?.userId ?? '' })}
              onExit={() => {
                localStorage.removeItem('mk_worker_id');
                supabase.auth.signOut();
                setScreen({ name: 'landing' });
              }}
            />
          </>
        )}
        {screen.name === 'contractor_onboarding' && (
          <ContractorOnboarding
            lang={lang}
            userId={screen.userId}
            email={screen.email}
            onDone={(name, phone) => {
              localStorage.setItem('mk_contractor_name', name);
              localStorage.setItem('mk_contractor_phone', phone);
              setScreen({ name: 'contractor_dashboard', contractorName: name, contractorPhone: phone });
            }}
          />
        )}
        {screen.name === 'contractor_dashboard' && (
          <>
            <div className="fixed top-11 right-3 z-40">
              <ProfileBtn />
            </div>
            <ContractorDashboard
              lang={lang}
              contractorName={screen.contractorName}
              contractorPhone={screen.contractorPhone}
              onBack={() => setScreen({ name: 'profile', userId: authState?.userId ?? '' })}
              onExit={() => {
                localStorage.removeItem('mk_contractor_name');
                localStorage.removeItem('mk_contractor_phone');
                supabase.auth.signOut();
                setScreen({ name: 'landing' });
              }}
            />
          </>
        )}
        {screen.name === 'profile' && authState && (
          <ProfileDashboard
            lang={lang}
            userId={screen.userId}
            onBack={() => {
              if (authState?.role === 'worker') {
                const wid = localStorage.getItem('mk_worker_id');
                if (wid) setScreen({ name: 'worker_dashboard', workerId: wid });
                else setScreen({ name: 'landing' });
              } else if (authState?.role === 'contractor') {
                const n = localStorage.getItem('mk_contractor_name');
                const p = localStorage.getItem('mk_contractor_phone');
                if (n && p) setScreen({ name: 'contractor_dashboard', contractorName: n, contractorPhone: p });
                else setScreen({ name: 'landing' });
              } else {
                setScreen({ name: 'landing' });
              }
            }}
            onLogout={() => {
              setAuthState(null);
              localStorage.removeItem('mk_worker_id');
              localStorage.removeItem('mk_contractor_name');
              localStorage.removeItem('mk_contractor_phone');
              setScreen({ name: 'landing' });
            }}
            onAccountDeleted={() => {
              setAuthState(null);
              localStorage.removeItem('mk_worker_id');
              localStorage.removeItem('mk_contractor_name');
              localStorage.removeItem('mk_contractor_phone');
              setScreen({ name: 'landing' });
            }}
          />
        )}
        {screen.name === 'admin' && <AdminPanel onExit={() => setScreen({ name: 'landing' })} onBack={() => setScreen({ name: 'landing' })} />}
      </div>
    </ToastProvider>
  );
}
