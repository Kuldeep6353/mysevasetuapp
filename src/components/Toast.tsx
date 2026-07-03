import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon } from './Icons';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
type Ctx = { toast: (message: string, type?: Toast['type']) => void };

const ToastCtx = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="slide-in-right flex items-center gap-3 rounded-xl px-4 py-3.5 shadow-lg text-white text-sm font-medium"
            style={{
              background:
                t.type === 'success' ? '#1D9E75' : t.type === 'error' ? '#D85A30' : '#0B1957',
            }}
          >
            {t.type === 'success' ? (
              <Icon.CheckCircle size={20} />
            ) : t.type === 'error' ? (
              <Icon.AlertTriangle size={20} />
            ) : (
              <Icon.Info size={20} />
            )}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
