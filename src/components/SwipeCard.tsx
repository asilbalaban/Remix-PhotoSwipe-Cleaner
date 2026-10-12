import React, { useState, useRef, useEffect } from 'react';
import { PhotoItem, SwipeDirection } from '../types';
import { formatBytes, formatDate, getAuthenticatedBlobUrl } from '../services/googlePhotosService';
import { Trash2, Heart, Star, ZoomIn, Info, HardDrive, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface SwipeCardProps {
  photo: PhotoItem;
  isFront: boolean;
  depthIndex: number;
  accessToken: string | null;
  onSwipe: (direction: SwipeDirection) => void;
  onOpenPreview: (photo: PhotoItem) => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  photo,
  isFront,
  depthIndex,
  accessToken,
  onSwipe,
  onOpenPreview,
}) => {
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Dynamic Image Source state
  const [imageSrc, setImageSrc] = useState<string>(photo.url || photo.thumbnailUrl);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // Load authenticated blob for Google Drive photos
  useEffect(() => {
    let isCancelled = false;
    setImageFailed(false);

    if (photo.source === 'google-drive' && accessToken) {
      setIsLoadingImage(true);
      getAuthenticatedBlobUrl(photo.id, accessToken).then((blobUrl) => {
        if (!isCancelled) {
          if (blobUrl) {
            setImageSrc(blobUrl);
          } else {
            setImageSrc(photo.thumbnailUrl || photo.url);
          }
          setIsLoadingImage(false);
        }
      });
    } else {
      setImageSrc(photo.url || photo.thumbnailUrl);
      setIsLoadingImage(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [photo.id, photo.source, photo.url, photo.thumbnailUrl, accessToken]);

  // Thresholds in pixels
  const SWIPE_THRESHOLD = 80;
  const UP_THRESHOLD = 100;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isFront) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isFront) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !isFront) return;
    setIsDragging(false);

    const { x, y } = dragOffset;

    if (x > SWIPE_THRESHOLD) {
      triggerHaptic();
      onSwipe('right');
    } else if (x < -SWIPE_THRESHOLD) {
      triggerHaptic();
      onSwipe('left');
    } else if (y < -UP_THRESHOLD && Math.abs(x) < 70) {
      triggerHaptic();
      onSwipe('up');
    } else {
      // Snap back smoothly
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Compute rotation and transforms
  const rotation = isFront ? dragOffset.x * 0.08 : 0;
  const scale = isFront ? 1 : Math.max(0.9, 1 - depthIndex * 0.04);
  const translateY = isFront ? dragOffset.y : depthIndex * 10;
  const translateX = isFront ? dragOffset.x : 0;
  const opacity = isFront ? 1 : Math.max(0.4, 1 - depthIndex * 0.22);

  // Swipe Stamp Opacity
  const deleteOpacity = Math.min(1, Math.max(0, -dragOffset.x / SWIPE_THRESHOLD));
  const keepOpacity = Math.min(1, Math.max(0, dragOffset.x / SWIPE_THRESHOLD));
  const favOpacity = Math.min(1, Math.max(0, -dragOffset.y / UP_THRESHOLD));

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotation}deg) scale(${scale})`,
        zIndex: 30 - depthIndex,
        opacity,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease',
        touchAction: 'none',
      }}
      className={`absolute inset-x-2 inset-y-1 sm:inset-x-3 sm:inset-y-2 select-none cursor-grab active:cursor-grabbing rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border ${
        isFront && dragOffset.x < -30
          ? 'border-rose-500/80 shadow-rose-950/40'
          : isFront && dragOffset.x > 30
          ? 'border-emerald-500/80 shadow-emerald-950/40'
          : 'border-neutral-800 shadow-black/80'
      }`}
    >
      <div className="relative w-full h-full flex flex-col justify-between">
        {/* Photo Display / Fallback */}
        {!imageFailed ? (
          <img
            src={imageSrc}
            alt={photo.name}
            loading="eager"
            onLoad={() => setIsLoadingImage(false)}
            onError={() => {
              if (imageSrc !== photo.thumbnailUrl && photo.thumbnailUrl) {
                setImageSrc(photo.thumbnailUrl);
              } else {
                setImageFailed(true);
                setIsLoadingImage(false);
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-300 ${
              isLoadingImage ? 'opacity-30' : 'opacity-100'
            }`}
          />
        ) : (
          /* Graceful Fallback Card if raw file cannot be rendered as image */
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center text-neutral-400 mb-4 shadow-xl">
              <ImageIcon className="w-10 h-10 text-amber-400/80" />
            </div>
            <h4 className="font-bold text-white text-base max-w-xs truncate mb-1">{photo.name}</h4>
            <p className="text-xs text-neutral-400 mb-2">{formatBytes(photo.sizeBytes)} • {photo.mimeType}</p>
            <div className="text-[11px] text-neutral-500 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              Görsel önizlemesi yüklenemedi, ancak silmek veya saklamak için kaydırabilirsiniz.
            </div>
          </div>
        )}

        {/* Loading Shimmer Spinner */}
        {isLoadingImage && !imageFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/60 border border-white/10 shadow-lg">
              <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
              <span className="text-[11px] text-neutral-300 font-medium">Yükleniyor...</span>
            </div>
          </div>
        )}

        {/* Top Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none z-10" />

        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none z-10" />

        {/* Top Badges */}
        <div className="relative z-20 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-lg">
            {photo.source === 'google-drive' ? (
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{photo.source === 'google-drive' ? 'Google Drive' : photo.source === 'google-photos' ? 'Google Fotoğraflar' : 'Örnek Galeri'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-xs font-semibold text-rose-300">
              {formatBytes(photo.sizeBytes)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPreview({ ...photo, url: imageSrc });
              }}
              className="p-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Tam Boyut İncele"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Swipe Feedback Stamps */}
        {isFront && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-30">
            {/* Delete Stamp (Left Swipe) */}
            <div
              style={{ opacity: deleteOpacity }}
              className="absolute top-12 right-6 transform rotate-12 flex items-center gap-2 px-5 py-2 rounded-2xl border-4 border-rose-500 bg-rose-600/35 backdrop-blur-md text-rose-400 font-black text-2xl tracking-wider shadow-2xl"
            >
              <Trash2 className="w-8 h-8 stroke-[3]" />
              <span>SİL</span>
            </div>

            {/* Keep Stamp (Right Swipe) */}
            <div
              style={{ opacity: keepOpacity }}
              className="absolute top-12 left-6 transform -rotate-12 flex items-center gap-2 px-5 py-2 rounded-2xl border-4 border-emerald-500 bg-emerald-600/35 backdrop-blur-md text-emerald-400 font-black text-2xl tracking-wider shadow-2xl"
            >
              <Heart className="w-8 h-8 fill-emerald-400 stroke-[2.5]" />
              <span>SAKLA</span>
            </div>

            {/* Favorite Stamp (Up Swipe) */}
            <div
              style={{ opacity: favOpacity }}
              className="absolute bottom-28 transform flex items-center gap-2 px-5 py-2 rounded-2xl border-4 border-amber-400 bg-amber-500/35 backdrop-blur-md text-amber-300 font-black text-xl tracking-wider shadow-2xl"
            >
              <Star className="w-7 h-7 fill-amber-300 stroke-[2]" />
              <span>FAVORİ</span>
            </div>
          </div>
        )}

        {/* Bottom Photo Metadata */}
        <div className="relative z-20 p-4 text-white">
          <div className="flex items-center gap-2 text-xs text-neutral-300 mb-1">
            <span>{formatDate(photo.createdAt)}</span>
            <span>•</span>
            <span className="truncate max-w-[170px]">{photo.description || 'Kamera Fotoğrafı'}</span>
          </div>

          <h3 className="font-bold text-base tracking-tight truncate drop-shadow-md text-neutral-100">
            {photo.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
              <Info className="w-3 h-3 text-neutral-300" />
              Sola: Sil • Sağa: Sakla
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
