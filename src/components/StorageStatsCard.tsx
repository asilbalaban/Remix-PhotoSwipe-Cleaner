import React from 'react';
import { CleanerStats } from '../types';
import { formatBytes } from '../services/googlePhotosService';
import { Sparkles, Trash2, Heart, Star, HardDrive } from 'lucide-react';

interface StorageStatsCardProps {
  stats: CleanerStats;
  trashedQueueCount: number;
  trashedQueueBytes: number;
  onOpenTrashQueue: () => void;
}

export const StorageStatsCard: React.FC<StorageStatsCardProps> = ({
  stats,
  trashedQueueCount,
  trashedQueueBytes,
  onOpenTrashQueue,
}) => {
  return (
    <div className="mx-4 mt-2 mb-1 p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-md">
      <div className="flex items-center justify-between">
        {/* Freed Space Meter */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Kazanılan Depolama</div>
            <div className="text-sm font-bold text-emerald-400">
              {formatBytes(stats.freedBytes)}
            </div>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 text-[11px] text-emerald-400 font-semibold" title="Saklananlar">
            <Heart className="w-3 h-3 fill-emerald-500/40" />
            <span>{stats.keptCount}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 text-[11px] text-amber-400 font-semibold" title="Favoriler">
            <Star className="w-3 h-3 fill-amber-500/40" />
            <span>{stats.favoritedCount}</span>
          </div>

          <button
            onClick={onOpenTrashQueue}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-[11px] text-rose-300 font-bold transition-colors cursor-pointer"
            title="Silinecekler Kuyruğu"
          >
            <Trash2 className="w-3 h-3" />
            <span>{trashedQueueCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
