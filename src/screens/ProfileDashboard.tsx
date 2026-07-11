import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toast';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

type UserProfile = {
  id: string;
  role: 'worker' | 'contractor';
  full_name: string;
  phone: string;
  email: string;
  agreement_accepted: boolean;
  created_at: string;
};

export function ProfileDashboard({ lang, userId, onLogout, onAccountDeleted }: { lang: Lang; userId: string; onLogout: () => void; onAccountDeleted: () => void }) {
  const t = useT(lang);
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setProfile(data as UserProfile);
        setName(data.full_name);
        setPhone(data.phone);
      }
    })();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('user_profiles').update({ full_name: name, phone }).eq('id', userId);
    if (error) {
      toast('Error saving profile', 'error');
    } else {
      setProfile(prev => prev ? { ...prev, full_name: name, phone } : null);
      toast(t.profileSaved, 'success');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Delete user profile data
    await supabase.from('user_profiles').delete().eq('id', userId);
    // Delete worker record if exists
    await supabase.from('workers').delete().eq('user_id', userId);
    // Sign out and delete auth user via edge function would be ideal,
    // but for now we sign out and clear local state
    await supabase.auth.signOut();
    toast(t.profileDeleted, 'success');
    onAccountDeleted();
    setDeleting(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon.RefreshCw size={24} className="animate-spin" style={{ color: '#0B1957' }} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#0B1957' }}>
          <Icon.User size={36} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-xl" style={{ color: '#0B1957' }}>{t.profileTitle}</h1>
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mt-1" style={{ background: profile.role === 'worker' ? 'rgba(29,158,117,0.12)' : 'rgba(186,117,23,0.12)', color: profile.role === 'worker' ? '#1D9E75' : '#BA7517' }}>
          {profile.role === 'worker' ? t.authWorker : t.authContractor}
        </span>
      </div>

      {/* Profile Details */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-sm" style={{ color: '#0B1957' }}>{t.profileDetails}</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#0B1957' }}>
              <Icon.Pencil size={14} />
              {t.profileEdit}
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#1D9E75' }}>
              {saving ? <Icon.RefreshCw size={14} className="animate-spin" /> : <Icon.Check size={14} />}
              {t.profileSave}
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.profileName}</label>
            {editing ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
            ) : (
              <p className="text-sm font-medium" style={{ color: '#0B1957' }}>{profile.full_name || '—'}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.profileEmail}</label>
            <p className="text-sm font-medium" style={{ color: '#0B1957' }}>{profile.email}</p>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.profilePhone}</label>
            {editing ? (
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-base" />
            ) : (
              <p className="text-sm font-medium" style={{ color: '#0B1957' }}>{profile.phone || '—'}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.profileRole}</label>
            <p className="text-sm font-medium" style={{ color: '#0B1957' }}>{profile.role === 'worker' ? t.authWorker : t.authContractor}</p>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(11,25,87,0.5)' }}>Member Since</label>
            <p className="text-sm font-medium" style={{ color: '#0B1957' }}>{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(11,25,87,0.06)', color: '#0B1957' }}
        >
          <Icon.LogOut size={18} />
          {t.profileLogout}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}
        >
          <Icon.Trash2 size={18} />
          {t.profileDelete}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(220,38,38,0.1)' }}>
              <Icon.AlertTriangle size={24} style={{ color: '#DC2626' }} />
            </div>
            <h3 className="font-display font-bold text-base text-center mb-2" style={{ color: '#0B1957' }}>{t.profileDeleteConfirm}</h3>
            <p className="text-xs text-center mb-5" style={{ color: 'rgba(11,25,87,0.5)' }}>{t.profileDeleteWarning}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(11,25,87,0.06)', color: '#0B1957' }}
              >
                {t.profileDeleteNo}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#DC2626', color: '#fff' }}
              >
                {deleting ? <Icon.RefreshCw size={16} className="animate-spin mx-auto" /> : t.profileDeleteYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
