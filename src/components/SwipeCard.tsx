import React, { useState, useRef, useEffect } from 'react';
import { PhotoItem, SwipeDirection } from '../types';
import { formatBytes, formatDate } from '../services/photoUtils';
import { Check, X, Star, Maximize2, Image as ImageIcon, Folder } from 'lucide-react';

interface SwipeCardProps {
  photo: PhotoItem;
  isFront: boolean;
  depthIndex: number;
  onSwipe: (direction: SwipeDirection) => void;
  onOpenPreview: (photo: PhotoItem) => void;
}

// Thresholds in pixels
const SWIPE_THRESHOLD = 80;
const UP_THRESHOLD = 100;

export const SwipeCard: React.FC<SwipeCardProps> = ({ photo, isFront, depthIndex, onSwipe, onOpenPreview }) => {
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const [imageSrc, setImageSrc] = useState<string>(photo.url || photo.thumbnailUrl);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    setImageFailed(false);
    setImageSrc(photo.url || photo.thumbnailUrl);
  }, [photo.id, photo.url, photo.thumbnailUrl]);

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

  const handlePointerUp = () => {
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
  const rotation = isFront ? dragOffset.x * 0.06 : 0;
  const scale = isFront ? 1 : Math.max(0.9, 1 - depthIndex * 0.04);
  const translateY = isFront ? dragOffset.y : depthIndex * 12;
  const translateX = isFront ? dragOffset.x : 0;

  // Swipe badge opacity
  const deleteOpacity = Math.min(1, Math.max(0, -dragOffset.x / SWIPE_THRESHOLD));
  const keepOpacity = Math.min(1, Math.max(0, dragOffset.x / SWIPE_THRESHOLD));
  // Only while the drag is mostly upwards, so it does not flash during sideways swipes
  const favOpacity =
    Math.abs(dragOffset.x) < Math.abs(dragOffset.y) ? Math.min(1, Math.max(0, -dragOffset.y / UP_THRESHOLD)) : 0;

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
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
        touchAction: 'none',
      }}
      className="absolute inset-x-3 top-1 bottom-3 select-none cursor-grab active:cursor-grabbing rounded-[28px] overflow-hidden bg-neutral-100 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
    >
      <div className="relative w-full h-full flex flex-col justify-between">
        {/* Photo Display / Fallback */}
        {!imageFailed ? (
          <img
            src={imageSrc}
            alt={photo.name}
            loading="eager"
            draggable={false}
            onError={() => {
              if (imageSrc !== photo.thumbnailUrl && photo.thumbnailUrl) {
                setImageSrc(photo.thumbnailUrl);
              } else {
                setImageFailed(true);
              }
            }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-brand-soft flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-md">
              <ImageIcon className="w-9 h-9 text-brand-deep" />
            </div>
            <p className="text-sm font-bold text-ink">Önizleme yüklenemedi</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-[14rem]">
              Yine de saklamak ya da silmek için kaydırabilirsin.
            </p>
          </div>
        )}

        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Top Row */}
        <div className="relative z-20 p-3.5 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPreview(photo);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-white/90 text-ink flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
            title="Tam Boyut İncele"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Swipe Feedback Badges */}
        {isFront && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Delete (Left Swipe) */}
            <div
              style={{ opacity: deleteOpacity }}
              className="absolute top-16 right-6 rotate-12 flex items-center gap-2 pl-3 pr-5 py-2 rounded-full bg-ink text-white font-black text-xl shadow-xl"
            >
              <span className="w-9 h-9 rounded-full bg-white text-ink flex items-center justify-center">
                <X className="w-5 h-5 stroke-[3.5]" />
              </span>
              <span>SİL</span>
            </div>

            {/* Keep (Right Swipe) */}
            <div
              style={{ opacity: keepOpacity }}
              className="absolute top-16 left-6 -rotate-12 flex items-center gap-2 pl-3 pr-5 py-2 rounded-full bg-brand text-ink font-black text-xl shadow-xl"
            >
              <span className="w-9 h-9 rounded-full bg-white text-ink flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[3.5]" />
              </span>
              <span>SAKLA</span>
            </div>

            {/* Favorite (Up Swipe) */}
            <div
              style={{ opacity: favOpacity }}
              className="absolute bottom-40 inset-x-0 mx-auto w-fit flex items-center gap-2 pl-3 pr-5 py-2 rounded-full bg-white text-ink font-black text-xl shadow-xl"
            >
              <span className="w-9 h-9 rounded-full bg-brand flex items-center justify-center">
                <Star className="w-5 h-5 fill-ink" />
              </span>
              <span>FAVORİ</span>
            </div>
          </div>
        )}

        {/* Bottom Photo Details */}
        <div className="relative z-20 p-5 text-white">
          <h3 className="text-[28px] leading-tight font-black tracking-tight drop-shadow-md">
            {formatDate(photo.createdAt)}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-white/85 truncate">{photo.name}</p>

          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold max-w-[60%]">
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{photo.albumName}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-brand text-ink text-xs font-black">
              {formatBytes(photo.sizeBytes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
