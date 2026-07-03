import type { ReactNode } from 'react';
import { Icon } from './Icons';

export function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-display font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: '#2A3D8F', fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 80 ? '#1D9E75' : score >= 60 ? '#BA7517' : '#D85A30';
  const bg = score >= 80 ? 'rgba(29,158,117,0.12)' : score >= 60 ? 'rgba(186,117,23,0.12)' : 'rgba(216,90,48,0.12)';
  return (
    <span
      className="badge"
      style={{ background: bg, color, fontSize: size === 'md' ? '0.8rem' : '0.7rem', padding: size === 'md' ? '0.3rem 0.6rem' : '0.2rem 0.5rem' }}
    >
      <Icon.ShieldCheck size={size === 'md' ? 14 : 12} />
      {score}
    </span>
  );
}

export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded-xl ${className}`} style={style} />;
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(11,25,87,0.06)', color: 'rgba(11,25,87,0.4)' }}
      >
        {icon}
      </div>
      <p className="font-display font-semibold text-base mb-1" style={{ color: '#0B1957' }}>{title}</p>
      {subtitle && <p className="text-sm" style={{ color: 'rgba(11,25,87,0.5)' }}>{subtitle}</p>}
    </div>
  );
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md slide-up sm:slide-in-right bg-white rounded-t-3xl sm:rounded-2xl p-6 m-0 sm:m-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg" style={{ color: '#0B1957' }}>{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5">
              <Icon.X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function LoadingScreen({ label = 'Load ho raha hai...' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#F8F3EA' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#0B1957' }}>
        <Icon.Tool size={26} className="text-white" />
      </div>
      <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(11,25,87,0.6)' }}>
        <Icon.RefreshCw size={16} className="animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-11 z-30 px-4 py-3 flex items-center gap-3" style={{ background: '#F8F3EA', borderBottom: '1px solid rgba(11,25,87,0.06)' }}>
      {onBack && (
        <button onClick={onBack} className="btn-ghost p-2 -ml-2">
          <Icon.ArrowLeft size={20} />
        </button>
      )}
      <h1 className="font-display font-bold text-lg flex-1" style={{ color: '#0B1957' }}>{title}</h1>
      {right}
    </div>
  );
}
