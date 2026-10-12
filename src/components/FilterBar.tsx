import React, { useRef } from 'react';
import { FilterState, ViewMode } from '../types';
import { SlidersHorizontal, LayoutGrid, Layers, Plus, User, Sparkles } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onOpenFilterDrawer: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onLocalPhotosAdded: (files: FileList) => void;
  isDemo: boolean;
  onSwitchToDemo: () => void;
  activeFilterSummary: string | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onOpenFilterDrawer,
  viewMode,
  onViewModeChange,
  onLocalPhotosAdded,
  isDemo,
  onSwitchToDemo,
  activeFilterSummary,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLocalPhotosAdded(e.target.files);
    }
  };

  const isPeopleFilter = filters.category === 'people';
  const isNonPeopleFilter = filters.category === 'non-people';

  return (
    <div className="px-3 py-1.5 flex items-center justify-between gap-1.5 bg-neutral-900/60 border-b border-neutral-800/60 shrink-0 text-xs">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Left Scrollable Filter Pills */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Open Detailed Filter Drawer (Year, Month, Album, Person) */}
        <button
          onClick={onOpenFilterDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
            activeFilterSummary
              ? 'bg-rose-600 text-white shadow-rose-950/40 ring-1 ring-rose-400/50'
              : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'
          }`}
          title="Tarih, ay, yıl ve albüm seçimi"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{activeFilterSummary || 'Tarih & Albüm'}</span>
        </button>

        {/* Quick Toggle: People / Portreler */}
        <button
          onClick={() =>
            onFilterChange({
              ...filters,
              category: isPeopleFilter ? 'all' : 'people',
            })
          }
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
            isPeopleFilter
              ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-950/40'
              : 'bg-neutral-800/80 text-amber-300 hover:bg-neutral-700'
          }`}
          title="İnsan ve portre fotoğraflarını filtrele"
        >
          <span>👤</span>
          <span>İnsanlar</span>
        </button>

        {/* Quick Toggle: Non-people / İnsan Olmayanlar */}
        <button
          onClick={() =>
            onFilterChange({
              ...filters,
              category: isNonPeopleFilter ? 'all' : 'non-people',
            })
          }
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer ${
            isNonPeopleFilter
              ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-950/40'
              : 'bg-neutral-800/80 text-blue-300 hover:bg-neutral-700'
          }`}
          title="İnsan olmayan nesne, manzara ve fişleri filtrele"
        >
          <span>🏞️</span>
          <span>İnsan Olmayanlar</span>
        </button>

        {/* Add photos from phone or computer */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-neutral-800/60 hover:bg-neutral-700 text-neutral-300 whitespace-nowrap transition-colors cursor-pointer"
          title="Cihazdan fotoğraf seç"
        >
          <Plus className="w-3.5 h-3.5 text-rose-400" />
          <span>Ekle</span>
        </button>
      </div>

      {/* Right: View Mode Toggle (Swipe vs Grid) */}
      <div className="flex items-center bg-neutral-800 p-0.5 rounded-full border border-neutral-700/60 shrink-0">
        <button
          onClick={() => onViewModeChange('swipe')}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            viewMode === 'swipe'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Kaydırarak Temizle (Swipe Modu)"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Toplu Seç ve Sil (Galeri Modu)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
