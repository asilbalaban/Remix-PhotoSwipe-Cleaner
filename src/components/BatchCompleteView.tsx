import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CleanerStats } from '../types';
import { formatBytes } from '../services/googlePhotosService';
import { CheckCircle2, Trash2, RotateCcw, Heart, Star, Sparkles, HardDrive } from 'lucide-react';

interface BatchCompleteViewProps {
  stats: CleanerStats;
  trashedCount: number;
  trashedBytes: number;
  onOpenTrashModal: () => void;
  onReset: () => void;
  onFetchMore: () => void;
}

export const BatchCompleteView: React.FC<BatchCompleteViewProps> = ({
  stats,
  trashedCount,
  trashedBytes,
  onOpenTrashModal,
  onReset,
  onFetchMore,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-xl shadow-emerald-950/50 mb-4 animate-bounce">
        <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      <h2 className="text-xl font-black text-white tracking-tight">Harika İş!</h2>
      <p className="text-xs text-neutral-400 mt-1 max-w-xs">
        Mevcut albümdeki tüm fotoğrafları incelediniz. Depolama alanınızı temizlemek için son adım!
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 w-full my-5">
        <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/60">
          <Heart className="w-5 h-5 text-emerald-400 mx-auto mb-1 fill-emerald-500/20" />
          <div className="text-base font-bold text-white">{stats.keptCount}</div>
          <div className="text-[10px] text-neutral-400">Saklanan</div>
        </div>

        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40">
          <Trash2 className="w-5 h-5 text-rose-400 mx-auto mb-1" />
          <div className="text-base font-bold text-rose-400">{trashedCount}</div>
          <div className="text-[10px] text-rose-300">Silinecek</div>
        </div>

        <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/60">
          <Star className="w-5 h-5 text-amber-400 mx-auto mb-1 fill-amber-500/20" />
          <div className="text-base font-bold text-white">{stats.favoritedCount}</div>
          <div className="text-[10px] text-neutral-400">Favori</div>
        </div>
      </div>

      {trashedCount > 0 && (
        <div className="w-full mb-4 p-3 rounded-2xl bg-rose-900/30 border border-rose-500/30 flex items-center justify-between">
          <div className="text-left">
            <div className="text-xs font-bold text-rose-300">{trashedCount} Fotoğraf Hazır</div>
            <div className="text-[11px] text-neutral-400">{formatBytes(trashedBytes)} yer açılacak</div>
          </div>
          <button
            onClick={onOpenTrashModal}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition-all cursor-pointer"
          >
            Hemen Temizle
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="w-full space-y-2">
        <button
          onClick={onFetchMore}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-all cursor-pointer"
        >
          <HardDrive className="w-4 h-4" />
          <span>Daha Fazla Fotoğraf Yükle</span>
        </button>

        <button
          onClick={onReset}
          className="w-full py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Bu Albümü Yeniden İncele</span>
        </button>
      </div>
    </div>
  );
};
