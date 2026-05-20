'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-zinc-900 border-zinc-800 text-white';
          let Icon = Info;
          
          if (toast.type === 'success') {
            bgClass = 'bg-zinc-950/90 border-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.08)]';
            Icon = CheckCircle;
          } else if (toast.type === 'error') {
            bgClass = 'bg-zinc-950/90 border-rose-500/20 text-white shadow-[0_0_15px_rgba(244,63,94,0.08)]';
            Icon = XCircle;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-zinc-950/90 border-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.08)]';
            Icon = AlertCircle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl ${bgClass} animate-slide-in-right transition-all`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                  toast.type === 'success' ? 'text-emerald-400' :
                  toast.type === 'error' ? 'text-rose-400' :
                  toast.type === 'warning' ? 'text-amber-400' :
                  'text-purple-400'
                }`} />
                <span className="text-xs font-semibold leading-normal">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-lg hover:bg-zinc-800/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
