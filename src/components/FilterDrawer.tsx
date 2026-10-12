import React from 'react';
import { FilterState } from '../types';
import { X, Calendar, Folder, User, Check, RotateCcw, Sparkles } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableYears: number[];
  availableAlbums: string[];
  totalMatchingCount: number;
}

const MONTH_NAMES = [
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' },
];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  availableYears,
  availableAlbums,
  totalMatchingCount,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    onFilterChange({
      selectedYear: 'all',
      selectedMonth: 'all',
      selectedAlbum: 'all',
      category: 'all',
    });
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end p-0 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border-t border-neutral-800 rounded-t-3xl max-h-[88%] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Gelişmiş Filtreleme</h3>
              <p className="text-[11px] text-neutral-400">Tarih, albüm ve kişi seçimi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Options */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* 1. İnsana Göre Filtre (Person / People Filter) */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-neutral-200 mb-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>İçerik & Kişi Filtresi</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    category: filters.category === 'people' ? 'all' : 'people',
                  })
                }
                className={`p-2.5 rounded-xl border flex items-center justify-between font-medium transition-all cursor-pointer ${
                  filters.category === 'people'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                    : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <div className="text-left">
                    <div>Sadece İnsanlar</div>
                    <div className="text-[10px] text-neutral-400 font-normal">Portreler & Selfie'ler</div>
                  </div>
                </div>
                {filters.category === 'people' && <Check className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    category: filters.category === 'non-people' ? 'all' : 'non-people',
                  })
                }
                className={`p-2.5 rounded-xl border flex items-center justify-between font-medium transition-all cursor-pointer ${
                  filters.category === 'non-people'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold shadow-sm'
                    : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🏞️</span>
                  <div className="text-left">
                    <div>İnsan Olmayanlar</div>
                    <div className="text-[10px] text-neutral-400 font-normal">Manzara, Fiş, Nesne</div>
                  </div>
                </div>
                {filters.category === 'non-people' && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* 2. Yıl Seçimi (Year by Year) */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-neutral-200 mb-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>Yıl Seçimi</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => onFilterChange({ ...filters, selectedYear: 'all' })}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filters.selectedYear === 'all'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Tüm Yıllar
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      selectedYear: filters.selectedYear === yr ? 'all' : yr,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    filters.selectedYear === yr
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Ay Seçimi (Month by Month) */}
          <div>
            <div className="flex items-center justify-between font-bold text-neutral-200 mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Ay Seçimi</span>
              </div>
              {filters.selectedMonth !== 'all' && (
                <button
                  onClick={() => onFilterChange({ ...filters, selectedMonth: 'all' })}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  Tüm Ayları Göster
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_NAMES.map((m) => {
                const isSelected = filters.selectedMonth === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        selectedMonth: isSelected ? 'all' : m.value,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl text-center font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-white font-bold shadow-sm'
                        : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Albüm Seçimi (Album Selection) */}
          <div>
            <div className="flex items-center gap-1.5 font-bold text-neutral-200 mb-2">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Albüm / Klasör Seçimi</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onFilterChange({ ...filters, selectedAlbum: 'all' })}
                className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                  filters.selectedAlbum === 'all'
                    ? 'bg-blue-500 text-white font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Tüm Albümler
              </button>
              {availableAlbums.map((album) => (
                <button
                  key={album}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      selectedAlbum: filters.selectedAlbum === album ? 'all' : album,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                    filters.selectedAlbum === album
                      ? 'bg-blue-500 text-white font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {album}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Apply Button */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{totalMatchingCount} Fotoğrafı Filtrele ve Göster</span>
          </button>
        </div>
      </div>
    </div>
  );
};
