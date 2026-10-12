import React from 'react';
import { User, Layers, LayoutGrid, Trash2 } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  trashedCount: number;
  onOpenTrash: () => void;
}

const TABS: { tab: AppTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { tab: 'profile', label: 'Profil', Icon: User },
  { tab: 'swipe', label: 'Kaydır', Icon: Layers },
  { tab: 'gallery', label: 'Galeri', Icon: LayoutGrid },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, trashedCount, onOpenTrash }) => {
  return (
    <nav className="h-16 px-2 flex items-stretch justify-around bg-white border-t border-neutral-100 shrink-0 z-30">
      {TABS.map(({ tab, label, Icon }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              isActive ? 'text-ink' : 'text-neutral-300 hover:text-neutral-500'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        );
      })}

      {/* Photos queued for deletion */}
      <button
        onClick={onOpenTrash}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
          trashedCount > 0 ? 'text-ink' : 'text-neutral-300 hover:text-neutral-500'
        }`}
      >
        <span className="relative">
          <Trash2 className="w-6 h-6" />
          {trashedCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-ink text-[10px] font-black flex items-center justify-center border-2 border-white">
              {trashedCount}
            </span>
          )}
        </span>
        <span className="text-[10px] font-bold">Silinecekler</span>
      </button>
    </nav>
  );
};
