import React, { useState } from 'react';
import { PhotoItem } from '../types';
import { formatBytes } from '../services/photoUtils';
import { Trash2, AlertTriangle, X, Check } from 'lucide-react';

interface ReviewTrashModalProps {
  trashQueue: PhotoItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmTrash: (selectedIds: string[], permanent: boolean) => Promise<void>;
  isProcessing: boolean;
  /** False in the browser, where the files behind the photos cannot be deleted */
  canDeleteFiles: boolean;
}

export const ReviewTrashModal: React.FC<ReviewTrashModalProps> = ({
  trashQueue,
  isOpen,
  onClose,
  onConfirmTrash,
  isProcessing,
  canDeleteFiles,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => trashQueue.map((p) => p.id));
  const [permanentDelete, setPermanentDelete] = useState<boolean>(false);
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);

  // Sync selectedIds when trashQueue changes
  React.useEffect(() => {
    setSelectedIds(trashQueue.map((p) => p.id));
  }, [trashQueue]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const totalSelectedBytes = trashQueue
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.sizeBytes, 0);

  const handleExecute = async () => {
    if (selectedIds.length === 0) return;
    await onConfirmTrash(selectedIds, permanentDelete);
    setShowConfirmStep(false);
  };

  const confirmText = !canDeleteFiles
    ? 'listeden kaldırılacak. Tarayıcı sürümü cihazındaki dosyaları silemez.'
    : permanentDelete
    ? 'telefonundan kalıcı olarak silinecek. Bu işlem geri alınamaz.'
    : 'telefonun çöp kutusuna taşınacak ve 30 gün sonra kendiliğinden silinecek.';

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end" onClick={isProcessing ? undefined : onClose}>
      <div
        className="bg-white rounded-t-[28px] max-h-[92%] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-ink">Silinecekler</h2>
            <p className="text-xs text-neutral-500">
              {selectedIds.length} / {trashQueue.length} seçili · {formatBytes(totalSelectedBytes)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-9 h-9 rounded-full bg-neutral-100 text-ink flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {trashQueue.length === 0 ? (
          <div className="px-8 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center mb-3">
              <Trash2 className="w-7 h-7 text-brand-deep" />
            </div>
            <h3 className="text-base font-extrabold text-ink">Silinecek fotoğraf yok</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-xs">
              Sola kaydırdığın fotoğraflar burada toplanır.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-3 rounded-full bg-brand text-ink text-sm font-extrabold cursor-pointer"
            >
              Kaydırmaya Dön
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            <div className="flex items-center justify-end gap-4 text-xs font-bold">
              <button
                onClick={() => setSelectedIds(trashQueue.map((p) => p.id))}
                className="text-ink underline decoration-brand decoration-2 underline-offset-2 cursor-pointer"
              >
                Tümünü Seç
              </button>
              <button onClick={() => setSelectedIds([])} className="text-neutral-500 cursor-pointer">
                Seçimi Kaldır
              </button>
            </div>

            {/* Photo Grid: unchecked photos are kept */}
            <div className="grid grid-cols-3 gap-1.5">
              {trashQueue.map((photo) => {
                const isChecked = selectedIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => toggleSelect(photo.id)}
                    className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-neutral-100 transition-all ${
                      isChecked ? 'ring-4 ring-brand ring-inset' : 'opacity-45 grayscale'
                    }`}
                  >
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div
                      className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isChecked ? 'bg-brand text-ink shadow-md' : 'bg-white/70 border border-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </div>

                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/55 text-[10px] text-white font-bold">
                      {formatBytes(photo.sizeBytes)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Permanent vs Trash toggle */}
            {canDeleteFiles && (
              <div className="p-4 rounded-2xl bg-neutral-100 flex items-center justify-between gap-3">
                <div className="text-left">
                  <div className="text-sm font-extrabold text-ink">Kalıcı olarak sil</div>
                  <div className="text-xs text-neutral-500">
                    {permanentDelete
                      ? 'Açık: fotoğraflar geri getirilemez'
                      : 'Kapalı: fotoğraflar çöp kutusuna taşınır (önerilen)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPermanentDelete(!permanentDelete)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                    permanentDelete ? 'bg-ink' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                      permanentDelete ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer with explicit confirmation */}
        {trashQueue.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-100">
            {!showConfirmStep ? (
              <button
                onClick={() => setShowConfirmStep(true)}
                disabled={selectedIds.length === 0 || isProcessing}
                className="w-full py-3.5 rounded-full bg-brand hover:bg-brand-deep disabled:opacity-50 text-ink font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {selectedIds.length} Fotoğrafı Temizle ({formatBytes(totalSelectedBytes)})
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-brand-soft flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-ink shrink-0 mt-0.5" />
                  <p className="text-xs text-ink leading-relaxed">
                    Seçili <strong>{selectedIds.length} fotoğraf</strong> {confirmText} Devam edilsin mi?
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowConfirmStep(false)}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-full bg-white border border-neutral-200 text-ink font-extrabold text-sm cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={isProcessing}
                    className="flex-1 py-3 rounded-full bg-ink text-white font-extrabold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isProcessing ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{canDeleteFiles ? 'Evet, Sil' : 'Listeden Kaldır'}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
