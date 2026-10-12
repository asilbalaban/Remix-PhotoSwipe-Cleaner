import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, RefreshCw, HardDrive, Smartphone, Sparkles } from 'lucide-react';

import { AppIcon } from './AppIcon';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  onReload: () => void;
  isReloading: boolean;
  isDemoMode: boolean;
  onSwitchToDemo: () => void;
  pendingCount: number;
  onOpenAppInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  onReload,
  isReloading,
  isDemoMode,
  onSwitchToDemo,
  pendingCount,
  onOpenAppInfo,
}) => {
  return (
    <header className="px-4 py-3 flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/70 backdrop-blur-md z-30">
      {/* Brand & Stats */}
      <div
        onClick={onOpenAppInfo}
        className="flex items-center gap-2.5 cursor-pointer group select-none"
        title="Uygulama ve İkon Bilgisi"
      >
        <div className="transform group-hover:scale-105 transition-transform duration-200">
          <AppIcon size={34} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm tracking-tight text-white group-hover:text-rose-300 transition-colors">
              CleanSwipe
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {pendingCount} Kalan
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
            <span>{isDemoMode ? 'Örnek Fotoğraflar' : 'Google Fotoğraflar'}</span>
          </div>
        </div>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReload}
          disabled={isReloading}
          className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin text-rose-400' : ''}`} />
        </button>

        {user ? (
          <div className="flex items-center gap-1.5 bg-neutral-800/80 border border-neutral-700/60 pl-1.5 pr-2 py-1 rounded-full">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Kullanıcı'}
                className="w-6 h-6 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-neutral-200 max-w-[80px] truncate">
              {user.displayName?.split(' ')[0] || 'Kullanıcı'}
            </span>
            <button
              onClick={onLogout}
              className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {isLoggingIn ? (
              <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Giriş Yap</span>
          </button>
        )}
      </div>
    </header>
  );
};
