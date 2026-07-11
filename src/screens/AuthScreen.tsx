import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/Icons';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

type Step = 'auth' | 'agreement' | 'role';

export function AuthScreen({ lang, onAuthed }: { lang: Lang; onAuthed: (role: 'worker' | 'contractor', userId: string, email: string) => void }) {
  const t = useT(lang);
  const [step, setStep] = useState<Step>('auth');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email || !password || !fullName) {
          setError('Please fill all required fields');
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          setPendingUserId(data.user.id);
          setPendingEmail(email);
          setStep('agreement');
        }
      } else {
        if (!email || !password) {
          setError('Please enter email and password');
          setLoading(false);
          return;
        }
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) {
          // Check if profile exists
          const { data: profile } = await supabase.from('user_profiles').select('role, agreement_accepted').eq('id', data.user.id).maybeSingle();
          if (profile && profile.agreement_accepted) {
            onAuthed(profile.role, data.user.id, data.user.email ?? email);
          } else {
            setPendingUserId(data.user.id);
            setPendingEmail(data.user.email ?? email);
            setStep('agreement');
          }
        }
      }
    } catch (err: any) {
      setError(err.message ?? (mode === 'signup' ? t.authSignupError : t.authLoginError));
    } finally {
      setLoading(false);
    }
  };

  const handleAgreement = async (accepted: boolean) => {
    if (!accepted) {
      await supabase.auth.signOut();
      setStep('auth');
      setPendingUserId(null);
      return;
    }

    if (pendingUserId) {
      await supabase.from('user_profiles').upsert({
        id: pendingUserId,
        email: pendingEmail,
        full_name: fullName || '',
        phone: phone || '',
        agreement_accepted: true,
        agreement_accepted_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }
    setStep('role');
  };

  const handleRoleSelect = async (role: 'worker' | 'contractor') => {
    if (pendingUserId) {
      await supabase.from('user_profiles').update({ role }).eq('id', pendingUserId);
    }
    onAuthed(role, pendingUserId ?? '', pendingEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F8F3EA' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#0B1957' }}>
            <Icon.HardHat size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>{t.authWelcome}</h1>
        </div>

        {step === 'auth' && (
          <div className="card p-6">
            <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: 'rgba(11,25,87,0.06)' }}>
              <button
                onClick={() => setMode('login')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={mode === 'login' ? { background: '#0B1957', color: '#fff' } : { color: 'rgba(11,25,87,0.5)' }}
              >
                {t.authLogin}
              </button>
              <button
                onClick={() => setMode('signup')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={mode === 'signup' ? { background: '#0B1957', color: '#fff' } : { color: 'rgba(11,25,87,0.5)' }}
              >
                {t.authSignup}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.authFullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-base"
                    placeholder="Ramesh Kumar"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.authEmail}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="you@gmail.com"
                  required
                />
              </div>
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.authPhone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-base"
                    placeholder="9876543210"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.6)' }}>{t.authPassword}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="text-xs font-medium p-2.5 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3"
              >
                {loading ? <Icon.RefreshCw size={18} className="animate-spin mx-auto" /> : (mode === 'login' ? t.authLoginBtn : t.authSignupBtn)}
              </button>
            </form>

            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full text-center text-xs mt-4 font-medium"
              style={{ color: '#0B1957' }}
            >
              {mode === 'login' ? t.authNoAccount : t.authHaveAccount}
            </button>
          </div>
        )}

        {step === 'agreement' && (
          <div className="card p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(11,25,87,0.08)' }}>
              <Icon.FileText size={24} style={{ color: '#0B1957' }} />
            </div>
            <h2 className="font-display font-bold text-lg text-center mb-3" style={{ color: '#0B1957' }}>{t.authAgreementTitle}</h2>
            <p className="text-sm text-center mb-5" style={{ color: 'rgba(11,25,87,0.6)', lineHeight: 1.6 }}>
              {t.authAgreementText}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAgreement(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(11,25,87,0.06)', color: 'rgba(11,25,87,0.5)' }}
              >
                {t.authAgreementDecline}
              </button>
              <button
                onClick={() => handleAgreement(true)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#0B1957', color: '#fff' }}
              >
                {t.authAgreementConfirm}
              </button>
            </div>
          </div>
        )}

        {step === 'role' && (
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-center mb-4" style={{ color: '#0B1957' }}>{t.authSelectRole}</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect('worker')}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#1D9E75' }}>
                  <Icon.HardHat size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-display font-bold text-sm" style={{ color: '#0B1957' }}>{t.authWorker}</p>
                  <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>Find work near you</p>
                </div>
                <Icon.ChevronRight size={20} style={{ color: '#1D9E75' }} />
              </button>
              <button
                onClick={() => handleRoleSelect('contractor')}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.2)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#BA7517' }}>
                  <Icon.Briefcase size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-display font-bold text-sm" style={{ color: '#0B1957' }}>{t.authContractor}</p>
                  <p className="text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>Hire workers for projects</p>
                </div>
                <Icon.ChevronRight size={20} style={{ color: '#BA7517' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
