import { Icon } from '../components/Icons';
import type { Lang } from '../lib/i18n';
import { useT } from '../lib/i18n';

const LANGS: { code: Lang; native: string; english: string }[] = [
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu' },
];

export function LanguageSelect({ onPick, onBack }: { onPick: (code: Lang) => void; onBack?: () => void }) {
  const t = useT('hi');
  return (
    <div className="min-h-screen flex flex-col px-5 py-8 fade-in">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 mb-3 text-sm font-semibold" style={{ color: '#0B1957' }}>
            <Icon.ArrowLeft size={20} />
            Back
          </button>
        )}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0B1957' }}>
            <Icon.Globe size={20} className="text-white" />
          </div>
        </div>
        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#0B1957' }}>
          {t.chooseLanguage}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(11,25,87,0.5)' }}>
          {t.appTagline}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => onPick(l.code)}
              className="card flex flex-col items-center justify-center py-7 hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <span className="font-display font-bold text-2xl mb-1.5" style={{ color: '#0B1957' }}>
                {l.native}
              </span>
              <span className="text-xs font-medium" style={{ color: 'rgba(11,25,87,0.45)' }}>
                {l.english}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
