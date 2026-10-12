import React from 'react';
import { FilterState, SORT_OPTIONS, DEFAULT_FILTERS } from '../types';
import { X } from 'lucide-react';

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

const CATEGORY_OPTIONS: { value: FilterState['category']; label: string }[] = [
  { value: 'all', label: 'Hepsi' },
  { value: 'screenshots', label: 'Ekran Görüntüleri' },
  { value: 'large', label: 'Büyük Dosyalar (4 MB+)' },
];

const Chip: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
  selected,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer ${
      selected
        ? 'bg-brand border-brand text-ink'
        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
    }`}
  >
    {children}
  </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-sm font-extrabold text-ink mb-2.5">{title}</h4>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

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

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-[28px] max-h-[88%] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-xl font-black tracking-tight text-ink">Sıralama ve Filtreler</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFilterChange(DEFAULT_FILTERS)}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-neutral-500 hover:text-ink cursor-pointer"
            >
              Sıfırla
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-neutral-100 text-ink flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Options */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6">
          <Section title="Hangi sırayla gösterilsin?">
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={filters.sortBy === option.value}
                onClick={() => onFilterChange({ ...filters, sortBy: option.value })}
              >
                {option.label}
              </Chip>
            ))}
          </Section>

          <Section title="Tür">
            {CATEGORY_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={filters.category === option.value}
                onClick={() => onFilterChange({ ...filters, category: option.value })}
              >
                {option.label}
              </Chip>
            ))}
          </Section>

          <Section title="Yıl">
            <Chip
              selected={filters.selectedYear === 'all'}
              onClick={() => onFilterChange({ ...filters, selectedYear: 'all' })}
            >
              Tüm Yıllar
            </Chip>
            {availableYears.map((yr) => (
              <Chip
                key={yr}
                selected={filters.selectedYear === yr}
                onClick={() =>
                  onFilterChange({ ...filters, selectedYear: filters.selectedYear === yr ? 'all' : yr })
                }
              >
                {yr}
              </Chip>
            ))}
          </Section>

          <Section title="Ay">
            <Chip
              selected={filters.selectedMonth === 'all'}
              onClick={() => onFilterChange({ ...filters, selectedMonth: 'all' })}
            >
              Tüm Aylar
            </Chip>
            {MONTH_NAMES.map((m) => (
              <Chip
                key={m.value}
                selected={filters.selectedMonth === m.value}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    selectedMonth: filters.selectedMonth === m.value ? 'all' : m.value,
                  })
                }
              >
                {m.label}
              </Chip>
            ))}
          </Section>

          <Section title="Albüm / Klasör">
            <Chip
              selected={filters.selectedAlbum === 'all'}
              onClick={() => onFilterChange({ ...filters, selectedAlbum: 'all' })}
            >
              Tüm Albümler
            </Chip>
            {availableAlbums.map((album) => (
              <Chip
                key={album}
                selected={filters.selectedAlbum === album}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    selectedAlbum: filters.selectedAlbum === album ? 'all' : album,
                  })
                }
              >
                {album}
              </Chip>
            ))}
          </Section>
        </div>

        {/* Footer Apply Button */}
        <div className="px-5 py-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-brand hover:bg-brand-deep text-ink font-extrabold text-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            {totalMatchingCount} Fotoğrafı Göster
          </button>
        </div>
      </div>
    </div>
  );
};
