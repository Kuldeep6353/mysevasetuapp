import { useState } from 'react';
import { supabase, EMERGENCY_NUMBERS } from '../lib/supabase';
import { Icon } from './Icons';
import { useToast } from './Toast';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

export function EmergencySection({ lang, userType, userName, userPhone }: { lang: Lang; userType: 'worker' | 'contractor'; userName: string; userPhone: string }) {
  const t = useT(lang);
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const handleEmergency = async (em: typeof EMERGENCY_NUMBERS[number]) => {
    // Insert emergency alert for admin
    await supabase.from('emergency_alerts').insert({
      user_type: userType,
      user_name: userName,
      user_phone: userPhone,
      emergency_type: em.key,
      phone_number: em.number,
      status: 'active',
    });
    await supabase.from('activity').insert({
      event_type: 'emergency',
      actor_name: userName,
      detail: `Emergency: ${t[em.labelKey as keyof typeof t] ?? em.key} (${em.number})`,
    });
    toast(t.emergencySent, 'error');
    // Redirect to dial pad
    window.location.href = `tel:${em.number}`;
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(220,38,38,0.2)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5"
        style={{ background: expanded ? '#DC2626' : 'rgba(220,38,38,0.06)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#DC2626' }}>
          <Icon.AlertTriangle size={20} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display font-bold text-sm" style={{ color: expanded ? '#fff' : '#DC2626' }}>{t.emergencyTitle}</p>
          <p className="text-xs" style={{ color: expanded ? 'rgba(255,255,255,0.8)' : 'rgba(220,38,38,0.6)' }}>{t.emergencySub}</p>
        </div>
        <Icon.ChevronDown
          size={20}
          style={{ color: expanded ? '#fff' : '#DC2626', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      {expanded && (
        <div className="p-3 grid grid-cols-3 gap-2" style={{ background: '#FEF2F2' }}>
          {EMERGENCY_NUMBERS.map((em) => {
            const IconCmp = (Icon as any)[em.icon] ?? Icon.PhoneCall;
            return (
              <button
                key={em.key}
                onClick={() => handleEmergency(em)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95 hover:scale-105"
                style={{ background: '#fff', border: `1px solid ${em.color}20` }}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${em.color}15` }}>
                  <IconCmp size={20} style={{ color: em.color }} />
                </div>
                <p className="text-xs font-semibold text-center" style={{ color: '#0B1957' }}>
                  {t[em.labelKey as keyof typeof t] ?? em.key}
                </p>
                <p className="text-sm font-bold" style={{ color: em.color }}>{em.number}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
