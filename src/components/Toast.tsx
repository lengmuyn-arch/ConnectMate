import React from 'react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[420px] pointer-events-auto transition-all animate-bounce-short">
      <div className="bg-[#2B2118] text-white px-4 py-3 rounded-2xl border-[3px] border-[#2B2118] pop-shadow flex items-center justify-between gap-3">
        <span className="text-xs sm:text-sm font-bold font-heading">{toast.message}</span>
        <div className="flex items-center gap-2">
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction?.();
                dismissToast();
              }}
              className="text-xs bg-[#DFB2FA] text-[#2B2118] px-2.5 py-1 rounded-lg font-black border-2 border-[#2B2118] pop-shadow-sm active:translate-y-[1px]"
            >
              Hoàn tác
            </button>
          )}
          <button
            onClick={dismissToast}
            className="text-white/80 hover:text-white text-base font-black px-1"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
