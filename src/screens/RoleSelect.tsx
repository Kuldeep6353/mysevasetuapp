import { Icon } from '../components/Icons';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

export function RoleSelect({ lang, onWorker, onContractor }: { lang: Lang; onWorker: () => void; onContractor: () => void }) {
  const t = useT(lang);
  return (
    <div className="min-h-screen flex flex-col px-5 py-8 fade-in">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#0B1957' }}>
          {t.whoAreYou}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(11,25,87,0.5)' }}>
          {t.chooseLanguage}
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={onWorker}
            className="card flex items-center gap-4 p-5 hover:scale-[1.01] active:scale-[0.99] transition-transform text-left"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(158,204,250,0.25)' }}
            >
              <Icon.Tool size={30} style={{ color: '#0B1957' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg" style={{ color: '#0B1957' }}>
                {t.iAmWorker}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>
                {t.workerSub}
              </p>
            </div>
            <Icon.ChevronRight size={22} style={{ color: 'rgba(11,25,87,0.3)' }} />
          </button>

          <button
            onClick={onContractor}
            className="card flex items-center gap-4 p-5 hover:scale-[1.01] active:scale-[0.99] transition-transform text-left"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(29,158,117,0.15)' }}
            >
              <Icon.Building size={30} style={{ color: '#1D9E75' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-lg" style={{ color: '#0B1957' }}>
                {t.iAmContractor}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>
                {t.contractorSub}
              </p>
            </div>
            <Icon.ChevronRight size={22} style={{ color: 'rgba(11,25,87,0.3)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
