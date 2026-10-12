import React, { useState } from 'react';
import { PhotoItem } from '../types';
import { formatBytes } from '../services/googlePhotosService';
import { Check, Trash2, ZoomIn, User, Sparkles, CheckSquare, Square, HardDrive } from 'lucide-react';

interface BatchGalleryViewProps {
  photos: PhotoItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectPeopleOnly: () => void;
  onSelectNonPeopleOnly: () => void;
  onOpenPreview: (photo: PhotoItem) => void;
  onQueueSelectedForTrash: () => void;
}

export const BatchGalleryView: React.FC<BatchGalleryViewProps> = ({
  photos,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSelectPeopleOnly,
  onSelectNonPeopleOnly,
  onOpenPreview,
  onQueueSelectedForTrash,
}) => {
  const selectedPhotos = photos.filter((p) => selectedIds.includes(p.id));
  const totalSelectedBytes = selectedPhotos.reduce((acc, p) => acc + p.sizeBytes, 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
      {/* Quick Selection Toolbar */}
      <div className="p-3 bg-neutral-900/90 border-b border-neutral-800/80 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-neutral-200">
            {photos.length} Fotoğraf <span className="text-neutral-500">•</span>{' '}
            <span className="text-rose-400 font-bold">{selectedIds.length} Seçili</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Tümünü Seç
            </button>
            <button
              onClick={onDeselectAll}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-[11px] transition-colors cursor-pointer"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* Smart Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
          <button
            onClick={onSelectPeopleOnly}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium whitespace-nowrap hover:bg-amber-500/25 transition-colors cursor-pointer"
          >
            <span>👤</span>
            <span>İnsanları Seç</span>
          </button>
          <button
            onClick={onSelectNonPeopleOnly}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium whitespace-nowrap hover:bg-blue-500/25 transition-colors cursor-pointer"
          >
            <span>🏞️</span>
            <span>İnsan Olmayanları Seç</span>
          </button>
        </div>
      </div>

      {/* Grid of Photos */}
      <div className="flex-1 overflow-y-auto p-2.5">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-neutral-500" />
            </div>
            <p className="text-sm font-medium text-neutral-300">Bu filtrede fotoğraf bulunamadı</p>
            <p className="text-xs text-neutral-500 mt-1">Filtre ayarlarından tarih veya albümü değiştirin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 pb-24">
            {photos.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => onToggleSelect(photo.id)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all select-none ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/30'
                      : 'border-neutral-800/80 hover:border-neutral-600'
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />

                  {/* Top Checkbox */}
                  <div
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-black/60 border border-white/40 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  {/* Person Badge */}
                  {photo.hasPerson && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/80 text-black text-[9px] font-bold shadow-sm">
                      👤 İnsan
                    </div>
                  )}

                  {/* Zoom Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPreview(photo);
                    }}
                    className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title="Büyüt"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  {/* File Size */}
                  <div className="absolute bottom-1.5 left-1.5 text-[10px] text-neutral-300 font-medium">
                    {formatBytes(photo.sizeBytes)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-neutral-900/95 border-t border-neutral-800 shadow-2xl shrink-0">
          <button
            onClick={onQueueSelectedForTrash}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {selectedIds.length} Fotoğrafı Sil ({formatBytes(totalSelectedBytes)})
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
