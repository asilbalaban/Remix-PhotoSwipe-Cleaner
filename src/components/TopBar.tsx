import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface TopBarProps {
  pendingCount: number;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ pendingCount, onOpenFilters, hasActiveFilters }) => {
  return (
    <header className="h-14 px-4 flex items-center justify-between bg-white shrink-0 z-30">
      {/* Remaining photos */}
      <div className="w-20 flex items-center">
        <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-600 whitespace-nowrap">
          {pendingCount} kalan
        </span>
      </div>

      {/* Wordmark */}
      <h1 className="text-[26px] leading-none font-black tracking-tight text-brand lowercase select-none">
        cleanswipe
      </h1>

      {/* Sort & filter */}
      <div className="w-20 flex items-center justify-end">
        <button
          onClick={onOpenFilters}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
          title="Sıralama ve filtreler"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white" />
          )}
        </button>
      </div>
    </header>
  );
};
