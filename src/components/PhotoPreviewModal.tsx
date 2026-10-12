import React from 'react';
import { PhotoItem } from '../types';
import { formatBytes, formatDate } from '../services/photoUtils';
import { X, Calendar, HardDrive, Folder, Ruler } from 'lucide-react';

interface PhotoPreviewModalProps {
  photo: PhotoItem | null;
  onClose: () => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-end z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white text-ink flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image */}
      <div className="flex-1 min-h-0 my-3 relative flex items-center justify-center overflow-hidden">
        <img
          src={photo.url}
          alt={photo.name}
          className="max-h-full max-w-full object-contain rounded-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src = photo.thumbnailUrl;
          }}
        />
      </div>

      {/* Bottom Details Panel */}
      <div className="p-4 rounded-3xl bg-white text-ink z-10">
        <div className="font-extrabold text-sm truncate">{photo.name}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-deep" />
            <span>{formatDate(photo.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-brand-deep" />
            <span>{formatBytes(photo.sizeBytes)}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Folder className="w-3.5 h-3.5 text-brand-deep shrink-0" />
            <span className="truncate">{photo.albumName}</span>
          </div>
          {photo.width && photo.height && (
            <div className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-brand-deep" />
              <span>
                {photo.width} × {photo.height}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
