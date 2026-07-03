import { Icon } from '../components/Icons';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

export function Landing({
  lang,
  onEnter,
  onWorkerLogin,
  onContractorLogin,
  onAdmin,
}: {
  lang: Lang;
  onEnter: () => void;
  onWorkerLogin: () => void;
  onContractorLogin: () => void;
  onAdmin: () => void;
}) {
  const t = useT(lang);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 fade-in">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#0B1957' }}>
            <Icon.Tool size={24} className="text-white" />
          </div>
          <div className="text-left">
            <h1 className="font-display font-extrabold text-2xl leading-none" style={{ color: '#0B1957' }}>
              Mera Karigar
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Hero card */}
        <div className="card w-full mt-8 flex flex-col items-center py-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #9ECCFA, #0B1957)' }}
          >
            <Icon.Tool size={40} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-lg mb-1" style={{ color: '#0B1957' }}>
            {t.nakaDigital}
          </h2>
          <p className="text-sm mb-6 px-4" style={{ color: 'rgba(11,25,87,0.55)' }}>
            {t.nakaSub}
          </p>
          <button onClick={onEnter} className="btn-primary w-full text-base">
            {t.enterApp}
            <Icon.ArrowRight size={20} />
          </button>
        </div>

        {/* Login buttons */}
        <div className="w-full mt-4 grid grid-cols-2 gap-3">
          <button onClick={onWorkerLogin} className="btn-secondary text-sm py-3">
            <Icon.Tool size={16} />
            {t.workerLogin}
          </button>
          <button onClick={onContractorLogin} className="btn-secondary text-sm py-3">
            <Icon.Building size={16} />
            {t.contractorLogin}
          </button>
        </div>

        {/* Trust strip */}
        <div className="flex items-center justify-center gap-5 mt-8 text-xs" style={{ color: 'rgba(11,25,87,0.5)' }}>
          <span className="flex items-center gap-1.5">
            <Icon.ShieldCheck size={14} style={{ color: '#1D9E75' }} />
            {t.bharosaScore}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon.MapPin size={14} style={{ color: '#9ECCFA' }} />
            {t.liveNaka}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon.Heart size={14} style={{ color: '#D85A30' }} />
            {t.suraksha}
          </span>
        </div>

        <button onClick={onAdmin} className="mt-8 text-sm font-medium underline" style={{ color: 'rgba(11,25,87,0.45)' }}>
          {t.adminLink}
        </button>
      </div>
    </div>
  );
}
