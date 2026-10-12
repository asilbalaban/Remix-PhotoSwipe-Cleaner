import React from 'react';
import { PhotoItem } from '../types';
import { formatBytes, formatDate } from '../services/googlePhotosService';
import { X, ExternalLink, Calendar, HardDrive, FileText, Download } from 'lucide-react';

interface PhotoPreviewModalProps {
  photo: PhotoItem | null;
  onClose: () => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
            {photo.source === 'google-drive' ? 'Google Drive' : photo.source === 'google-photos' ? 'Google Fotoğraflar' : 'Örnek Fotoğraf'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image */}
      <div className="flex-1 my-3 relative flex items-center justify-center overflow-hidden rounded-2xl">
        <img
          src={photo.url}
          alt={photo.name}
          className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src = photo.thumbnailUrl;
          }}
        />
      </div>

      {/* Bottom Metadata Panel */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 space-y-2 z-10">
        <div className="font-bold text-sm text-white truncate">{photo.name}</div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <span>{formatDate(photo.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
            <span>{formatBytes(photo.sizeBytes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-500" />
            <span className="truncate">{photo.mimeType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="truncate">{photo.description || 'Ekstra detay yok'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
