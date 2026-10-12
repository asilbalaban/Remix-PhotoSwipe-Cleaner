import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CleanerStats } from '../types';
import { formatBytes } from '../services/photoUtils';
import { Check, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface BatchCompleteViewProps {
  stats: CleanerStats;
  trashedCount: number;
  trashedBytes: number;
  onOpenTrashModal: () => void;
  onReset: () => void;
  onOpenFilters: () => void;
}

export const BatchCompleteView: React.FC<BatchCompleteViewProps> = ({
  stats,
  trashedCount,
  trashedBytes,
  onOpenTrashModal,
  onReset,
  onOpenFilters,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFC629', '#1D1D1B', '#FFFFFF'],
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex-1 w-full px-7 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/50">
        <Check className="w-12 h-12 text-ink stroke-[3]" />
      </div>

      <h2 className="mt-5 text-2xl font-black text-ink tracking-tight">Hepsine baktın!</h2>
      <p className="text-sm text-neutral-500 mt-1.5 max-w-[17rem]">
        Bu listede incelenecek fotoğraf kalmadı. Şimdiye kadar {stats.totalReviewed} fotoğrafa baktın.
        {trashedCount > 0 && ' Son adım: silinecekleri onayla.'}
      </p>

      <div className="w-full max-w-xs mt-7 space-y-2.5">
        {trashedCount > 0 && (
          <button
            onClick={onOpenTrashModal}
            className="w-full py-3.5 rounded-full bg-brand hover:bg-brand-deep text-ink font-extrabold text-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            {trashedCount} Fotoğrafı Temizle ({formatBytes(trashedBytes)})
          </button>
        )}

        <button
          onClick={onOpenFilters}
          className="w-full py-3.5 rounded-full bg-white border border-neutral-200 text-ink font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtreyi Değiştir</span>
        </button>

        <button
          onClick={onReset}
          className="w-full py-2.5 text-neutral-500 hover:text-ink font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Saklananları Yeniden Göster</span>
        </button>
      </div>
    </div>
  );
};
