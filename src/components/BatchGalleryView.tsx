import React from 'react';
import { PhotoItem } from '../types';
import { formatBytes } from '../services/photoUtils';
import { Check, Trash2, Maximize2, Images } from 'lucide-react';

interface BatchGalleryViewProps {
  photos: PhotoItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenPreview: (photo: PhotoItem) => void;
  onQueueSelectedForTrash: () => void;
}

export const BatchGalleryView: React.FC<BatchGalleryViewProps> = ({
  photos,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onOpenPreview,
  onQueueSelectedForTrash,
}) => {
  const selectedSet = new Set(selectedIds);
  const totalSelectedBytes = photos.reduce((acc, p) => (selectedSet.has(p.id) ? acc + p.sizeBytes : acc), 0);

  return (
    <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
      {/* Selection Toolbar */}
      <div className="px-4 pb-2.5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight text-ink leading-tight">Toplu Seç</h2>
          <p className="text-xs text-neutral-500">
            {photos.length} fotoğraf · <span className="font-bold text-ink">{selectedIds.length} seçili</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-ink text-xs font-bold transition-colors cursor-pointer"
          >
            Tümünü Seç
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={onDeselectAll}
              className="px-3 py-1.5 rounded-full text-neutral-500 hover:text-ink text-xs font-bold transition-colors cursor-pointer"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Grid of Photos */}
      <div className="flex-1 overflow-y-auto px-3">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center mb-3">
              <Images className="w-7 h-7 text-brand-deep" />
            </div>
            <p className="text-sm font-extrabold text-ink">Bu filtrede fotoğraf yok</p>
            <p className="text-xs text-neutral-500 mt-1">Sağ üstteki filtrelerden tarih veya albümü değiştir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 pb-4">
            {photos.map((photo) => {
              const isSelected = selectedSet.has(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => onToggleSelect(photo.id)}
                  className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer select-none bg-neutral-100 transition-all ${
                    isSelected ? 'ring-4 ring-brand ring-inset' : ''
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.name}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform ${isSelected ? 'scale-90 rounded-xl' : ''}`}
                  />

                  {/* Checkbox */}
                  <div
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-brand text-ink shadow-md' : 'bg-white/70 border border-white text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                  </div>

                  {/* Preview */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPreview(photo);
                    }}
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white/85 text-ink flex items-center justify-center cursor-pointer"
                    title="Büyüt"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>

                  {/* File Size */}
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/55 text-[10px] text-white font-bold">
                    {formatBytes(photo.sizeBytes)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-neutral-100 shrink-0">
          <button
            onClick={onQueueSelectedForTrash}
            className="w-full h-13 py-3.5 rounded-full bg-brand hover:bg-brand-deep text-ink font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {selectedIds.length} Fotoğrafı Silineceklere Ekle ({formatBytes(totalSelectedBytes)})
            </span>
          </button>
        </div>
      )}
    </main>
  );
};
