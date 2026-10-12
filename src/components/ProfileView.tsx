import React, { useRef } from 'react';
import { Check, Star, Trash2, RefreshCw, Plus, ChevronRight, RotateCcw } from 'lucide-react';
import { CleanerStats } from '../types';
import { formatBytes } from '../services/photoUtils';
import { AppIcon } from './AppIcon';

interface ProfileViewProps {
  stats: CleanerStats;
  totalPhotos: number;
  trashedCount: number;
  trashedBytes: number;
  onOpenTrash: () => void;
  /** Native app: read the gallery again */
  onReloadGallery: () => void;
  /** Browser: add more picked files */
  onLocalFilesPicked: (files: FileList) => void;
  useFilePicker: boolean;
  isLoading: boolean;
  /** Photos kept in earlier sessions that are no longer suggested */
  hiddenReviewedCount: number;
  onResetReviewed: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  totalPhotos,
  trashedCount,
  trashedBytes,
  onOpenTrash,
  onReloadGallery,
  onLocalFilesPicked,
  useFilePicker,
  isLoading,
  hiddenReviewedCount,
  onResetReviewed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="flex-1 min-h-0 overflow-y-auto bg-white px-5 pt-2 pb-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onLocalFilesPicked(e.target.files);
        }}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Freed space */}
      <div className="flex flex-col items-center text-center">
        <div className="w-36 h-36 rounded-full border-[6px] border-brand flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-ink leading-none">{formatBytes(stats.freedBytes)}</span>
          <span className="mt-1 text-[11px] font-bold text-neutral-400">temizlendi</span>
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-ink">Galerin</h2>
        <p className="text-sm text-neutral-500">
          {totalPhotos} fotoğraf · {stats.totalReviewed} incelendi
        </p>
      </div>

      {/* Counters */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-neutral-100 text-center">
          <Check className="w-5 h-5 mx-auto text-ink stroke-[3]" />
          <div className="mt-1 text-xl font-black text-ink">{stats.keptCount}</div>
          <div className="text-[11px] font-bold text-neutral-500">Saklanan</div>
        </div>
        <div className="p-3 rounded-2xl bg-neutral-100 text-center">
          <Star className="w-5 h-5 mx-auto text-brand-deep fill-brand" />
          <div className="mt-1 text-xl font-black text-ink">{stats.favoritedCount}</div>
          <div className="text-[11px] font-bold text-neutral-500">Favori</div>
        </div>
        <div className="p-3 rounded-2xl bg-brand-soft text-center">
          <Trash2 className="w-5 h-5 mx-auto text-ink" />
          <div className="mt-1 text-xl font-black text-ink">{trashedCount}</div>
          <div className="text-[11px] font-bold text-neutral-500">Silinecek</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 space-y-2.5">
        <button
          onClick={onOpenTrash}
          className="w-full p-4 rounded-2xl bg-brand text-ink flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
        >
          <div className="text-left">
            <div className="text-sm font-extrabold">Silinecekleri İncele</div>
            <div className="text-xs font-medium text-ink/70">
              {trashedCount > 0
                ? `${trashedCount} fotoğraf · ${formatBytes(trashedBytes)}`
                : 'Sola kaydırdıkların burada toplanır'}
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => (useFilePicker ? fileInputRef.current?.click() : onReloadGallery())}
          disabled={isLoading}
          className="w-full p-4 rounded-2xl bg-white border border-neutral-200 text-ink flex items-center justify-between disabled:opacity-60 active:scale-[0.99] transition-transform cursor-pointer"
        >
          <div className="text-left">
            <div className="text-sm font-extrabold">{useFilePicker ? 'Fotoğraf Ekle' : 'Galeriyi Yenile'}</div>
            <div className="text-xs font-medium text-neutral-500">
              {useFilePicker ? 'İncelemek için başka dosyalar seç' : 'Yeni çekilen fotoğrafları da getir'}
            </div>
          </div>
          {useFilePicker ? (
            <Plus className="w-5 h-5" />
          ) : (
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          )}
        </button>

        {hiddenReviewedCount > 0 && (
          <button
            onClick={onResetReviewed}
            className="w-full p-4 rounded-2xl bg-white border border-neutral-200 text-ink flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="text-left">
              <div className="text-sm font-extrabold">İnceleme Geçmişini Sıfırla</div>
              <div className="text-xs font-medium text-neutral-500">
                Sakladığın {hiddenReviewedCount} fotoğraf tekrar gösterilmiyor
              </div>
            </div>
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* How it works */}
      <div className="mt-6 p-4 rounded-2xl bg-neutral-100">
        <div className="flex items-center gap-2.5">
          <AppIcon size={36} />
          <div>
            <div className="text-sm font-extrabold text-ink">Nasıl çalışır?</div>
            <div className="text-[11px] text-neutral-500">Her şey telefonunda kalır</div>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 text-xs text-neutral-600">
          <li>
            <strong className="text-ink">Sağa kaydır:</strong> fotoğrafı sakla
          </li>
          <li>
            <strong className="text-ink">Sola kaydır:</strong> silinecekler listesine ekle
          </li>
          <li>
            <strong className="text-ink">Yukarı kaydır:</strong> favori olarak say
          </li>
          <li>Silme, sen "Silinecekler"de onaylayana kadar yapılmaz.</li>
        </ul>
      </div>
    </main>
  );
};
