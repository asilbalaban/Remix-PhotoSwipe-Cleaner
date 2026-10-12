import React from 'react';
import { AppIcon } from './AppIcon';
import { X, Sparkles, Check, Smartphone, ShieldCheck, Heart } from 'lucide-react';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 flex flex-col items-center text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large 3D Squircle App Icon Design */}
        <div className="relative group my-2">
          <div className="absolute -inset-2 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-[32%] blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />
          <AppIcon size={128} hasShadow={true} className="relative ring-2 ring-white/20 shadow-2xl" />
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mt-3">CleanSwipe</h3>
        <p className="text-xs text-rose-400 font-semibold mb-1">PhotoSwipe Cleaner for Android</p>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60 font-mono">
          v2.4.0 • Material 3 Edition
        </span>

        {/* Feature Highlights */}
        <div className="w-full mt-5 space-y-2 text-left text-xs text-neutral-300">
          <div className="p-2.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 flex items-center gap-2.5">
            <span className="text-base">🃏</span>
            <div>
              <div className="font-bold text-white text-[11px]">Swipe Temizleme</div>
              <div className="text-[10px] text-neutral-400">Sola kaydır: Sil • Sağa kaydır: Sakla</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 flex items-center gap-2.5">
            <span className="text-base">📅</span>
            <div>
              <div className="font-bold text-white text-[11px]">Tarih & Albüm Filtresi</div>
              <div className="text-[10px] text-neutral-400">Yıl yıl, ay ay ve albümlere göre ayıklama</div>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 flex items-center gap-2.5">
            <span className="text-base">👤</span>
            <div>
              <div className="font-bold text-white text-[11px]">Kişi / Portre Ayıklama</div>
              <div className="text-[10px] text-neutral-400">İnsan içeren veya içermeyen fotoğrafları ayırma</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Kapat
        </button>
      </div>
    </div>
  );
};
