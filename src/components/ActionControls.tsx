import React from 'react';
import { RotateCcw, X, Heart, Star, Trash2 } from 'lucide-react';
import { SwipeDirection } from '../types';

interface ActionControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onSwipeAction: (direction: SwipeDirection) => void;
  trashedCount: number;
  onOpenTrashModal: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  canUndo,
  onUndo,
  onSwipeAction,
  trashedCount,
  onOpenTrashModal,
}) => {
  return (
    <div className="w-full px-4 py-3 flex items-center justify-between gap-2 z-20">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          canUndo
            ? 'bg-neutral-800 text-amber-400 hover:bg-neutral-700 active:scale-95 shadow-md border border-neutral-700'
            : 'bg-neutral-900/60 text-neutral-600 cursor-not-allowed border border-neutral-800/40'
        }`}
        title="Son hareketi geri al (Z)"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Swipe Left (Delete) Button */}
      <button
        onClick={() => onSwipeAction('left')}
        className="w-14 h-14 rounded-full bg-rose-950/70 hover:bg-rose-900 active:scale-90 text-rose-400 hover:text-rose-200 border-2 border-rose-500/60 flex items-center justify-center shadow-lg shadow-rose-950/50 transition-all cursor-pointer group"
        title="Sola Kaydır: Sil / Çöpe At"
      >
        <X className="w-7 h-7 stroke-[3] group-hover:scale-110 transition-transform" />
      </button>

      {/* Swipe Up (Favorite) Button */}
      <button
        onClick={() => onSwipeAction('up')}
        className="w-11 h-11 rounded-full bg-amber-950/50 hover:bg-amber-900/80 active:scale-90 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-md transition-all cursor-pointer group"
        title="Yukarı Kaydır: Favorilere Ekle"
      >
        <Star className="w-5 h-5 fill-amber-400/40 group-hover:scale-110 transition-transform" />
      </button>

      {/* Swipe Right (Keep) Button */}
      <button
        onClick={() => onSwipeAction('right')}
        className="w-14 h-14 rounded-full bg-emerald-950/70 hover:bg-emerald-900 active:scale-90 text-emerald-400 hover:text-emerald-200 border-2 border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-950/50 transition-all cursor-pointer group"
        title="Sağa Kaydır: Sakla"
      >
        <Heart className="w-7 h-7 fill-emerald-500/40 stroke-[2.5] group-hover:scale-110 transition-transform" />
      </button>

      {/* Review Trash Queue Button */}
      <button
        onClick={onOpenTrashModal}
        className="relative w-11 h-11 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white border border-neutral-700 flex items-center justify-center shadow-md transition-all cursor-pointer"
        title="Silinecek fotoğrafları incele"
      >
        <Trash2 className="w-5 h-5 text-rose-400" />
        {trashedCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center animate-bounce shadow-md">
            {trashedCount}
          </span>
        )}
      </button>
    </div>
  );
};
