import { useState } from 'react';
import { Icon } from '../components/Icons';
import { Header } from '../components/ui';
import { useToast } from '../components/Toast';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

export function ContractorOnboarding({ lang, userId: _userId, email: _email, onDone }: { lang: Lang; userId?: string; email?: string; onDone: (name: string, phone: string) => void }) {
  const t = useT(lang);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();
  const canSubmit = name.trim().length >= 2 && /^\d{10}$/.test(phone);

  return (
    <div className="min-h-screen">
      <Header title={t.contractorProfile} />
      <div className="px-5 py-6 max-w-md mx-auto fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.15)' }}>
            <Icon.Building size={28} style={{ color: '#1D9E75' }} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>{t.becomeContractor}</h1>
            <p className="text-sm" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.fast30Sec}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.nameOrFirm}</label>
            <input
              className="input"
              placeholder={t.firmPlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>{t.phoneNumber}</label>
            <div className="flex items-center gap-2">
              <span className="input w-16 text-center font-semibold flex-shrink-0" style={{ background: 'rgba(11,25,87,0.04)' }}>+91</span>
              <input
                className="input flex-1"
                type="tel"
                inputMode="numeric"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (canSubmit) {
              toast(t.profileCreated, 'success');
              onDone(name.trim(), phone);
            }
          }}
          disabled={!canSubmit}
          className="btn-primary w-full mt-6 text-base disabled:opacity-40"
        >
          {t.proceed}
          <Icon.ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
