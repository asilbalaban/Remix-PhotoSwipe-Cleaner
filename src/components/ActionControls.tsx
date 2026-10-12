import React from 'react';
import { RotateCcw, X, Check, Star } from 'lucide-react';
import { SwipeDirection } from '../types';

interface ActionControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onSwipeAction: (direction: SwipeDirection) => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({ canUndo, onUndo, onSwipeAction }) => {
  return (
    <div className="w-full px-6 pt-1 pb-3 flex items-center justify-center gap-5 shrink-0 z-20">
      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-11 h-11 rounded-full flex items-center justify-center bg-white border border-neutral-200 transition-all ${
          canUndo ? 'text-ink shadow-md active:scale-90 cursor-pointer' : 'text-neutral-300 cursor-not-allowed'
        }`}
        title="Son hareketi geri al (Z)"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {/* Swipe Left (Delete) */}
      <button
        onClick={() => onSwipeAction('left')}
        className="w-16 h-16 rounded-full bg-white border border-neutral-200 text-ink flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
        title="Sola Kaydır: Sil"
      >
        <X className="w-8 h-8 stroke-[3]" />
      </button>

      {/* Swipe Up (Favorite) */}
      <button
        onClick={() => onSwipeAction('up')}
        className="w-11 h-11 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
        title="Yukarı Kaydır: Favori"
      >
        <Star className="w-5 h-5 text-brand-deep fill-brand" />
      </button>

      {/* Swipe Right (Keep) */}
      <button
        onClick={() => onSwipeAction('right')}
        className="w-16 h-16 rounded-full bg-brand text-ink flex items-center justify-center shadow-lg shadow-brand/50 active:scale-90 transition-transform cursor-pointer"
        title="Sağa Kaydır: Sakla"
      >
        <Check className="w-8 h-8 stroke-[3]" />
      </button>
    </div>
  );
};
