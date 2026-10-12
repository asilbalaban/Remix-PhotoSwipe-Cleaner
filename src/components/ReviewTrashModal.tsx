import React, { useState } from 'react';
import { PhotoItem } from '../types';
import { formatBytes, formatDate } from '../services/googlePhotosService';
import { Trash2, AlertTriangle, X, Check, ExternalLink, HardDrive, ShieldAlert, Sparkles } from 'lucide-react';

interface ReviewTrashModalProps {
  trashQueue: PhotoItem[];
  isOpen: boolean;
  onClose: () => void;
  onRestorePhoto: (photoId: string) => void;
  onConfirmTrash: (selectedIds: string[], permanent: boolean) => Promise<void>;
  isProcessing: boolean;
}

export const ReviewTrashModal: React.FC<ReviewTrashModalProps> = ({
  trashQueue,
  isOpen,
  onClose,
  onRestorePhoto,
  onConfirmTrash,
  isProcessing,
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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(trashQueue.map((p) => p.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const totalSelectedBytes = trashQueue
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.sizeBytes, 0);

  const handleExecute = async () => {
    if (selectedIds.length === 0) return;
    await onConfirmTrash(selectedIds, permanentDelete);
    setShowConfirmStep(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92%] sm:max-h-[85%] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-neutral-100">Silinecekler Kuyruğu</h2>
              <p className="text-xs text-neutral-400">
                {trashQueue.length} fotoğraf seçildi • {formatBytes(totalSelectedBytes)} yer açılacak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {trashQueue.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-neutral-200 text-lg">Silinecek Fotoğraf Yok</h3>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              Sola kaydırdığınız fotoğraflar burada toplanır. Henüz hiçbir fotoğraf silinmek üzere işaretlenmedi.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Fotoğrafları İncelemeye Dön
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Action Bar inside modal */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
              <span>{selectedIds.length} / {trashQueue.length} seçili</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={deselectAll}
                  className="text-neutral-400 hover:underline cursor-pointer"
                >
                  Seçimi Kaldır
                </button>
              </div>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {trashQueue.map((photo) => {
                const isChecked = selectedIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => toggleSelect(photo.id)}
                    className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isChecked
                        ? 'border-rose-500 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/30'
                        : 'border-neutral-800 opacity-50 grayscale hover:opacity-80'
                    }`}
                  >
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                      <span className="text-xs font-mono font-bold">IMG</span>
                    </div>
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Checkbox indicator */}
                    <div
                      className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isChecked
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-black/60 border border-white/40 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    {/* Photo Size */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] text-white font-medium truncate">
                      {formatBytes(photo.sizeBytes)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Permanent vs Trash toggle */}
            <div className="p-3.5 rounded-2xl bg-neutral-800/70 border border-neutral-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-neutral-200">
                    {permanentDelete ? 'Kalıcı Olarak Sil' : 'Çöp Kutusuna Taşı (Önerilen)'}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {permanentDelete
                      ? 'Geri getirilemez (korumalı fotoğraflarda çöp kutusu kullanılır)'
                      : 'Güvenle çöp kutusuna taşınır, depolama alanı açılır'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermanentDelete(!permanentDelete)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  permanentDelete ? 'bg-rose-600' : 'bg-neutral-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    permanentDelete ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Footer with Mandatory Explicit Confirmation */}
        {trashQueue.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex flex-col gap-2">
            {!showConfirmStep ? (
              <button
                onClick={() => setShowConfirmStep(true)}
                disabled={selectedIds.length === 0 || isProcessing}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{selectedIds.length} Fotoğrafı Temizle ({formatBytes(totalSelectedBytes)})</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-200 leading-relaxed">
                    <strong>Dikkat:</strong> Seçili {selectedIds.length} adet fotoğraf{' '}
                    {permanentDelete ? 'kalıcı olarak silinecektir.' : 'Google hesabınızın çöp kutusuna taşınacaktır.'}{' '}
                    Devam etmek istiyor musunuz?
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConfirmStep(false)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    {isProcessing ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Evet, Sil</span>
                      </>
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
