import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// Inside the native APK the device draws its own status and navigation bars
const isNativeApp = Capacitor.isNativePlatform();

interface AndroidFrameProps {
  children: React.ReactNode;
  isSimulatedFrame: boolean;
  onToggleFrame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isSimulatedFrame, onToggleFrame }) => {
  const [timeString, setTimeString] = useState('12:49');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-white sm:bg-neutral-100 text-ink flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden selection:bg-brand/40">
      {/* Desktop Mode Toggle Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs text-neutral-500 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span className="font-semibold text-ink">CleanSwipe</span>
        </div>
        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-ink transition-colors cursor-pointer"
          title="Görünüm Modunu Değiştir"
        >
          {isSimulatedFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Genişlet</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Telefon Kasası</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full h-full sm:h-[870px] transition-all duration-300 relative flex flex-col overflow-hidden bg-white ${
          isSimulatedFrame
            ? 'sm:max-w-[430px] sm:rounded-[50px] sm:border-[10px] sm:border-ink sm:shadow-2xl'
            : 'max-w-xl sm:h-[92vh] sm:rounded-3xl sm:border sm:border-neutral-200 sm:shadow-xl'
        }`}
      >
        {/* Simulated status bar (browser preview only) */}
        <div
          className={`h-8 shrink-0 pt-1 px-4 sm:px-6 items-center justify-between text-xs font-semibold text-ink select-none z-40 bg-white ${
            isNativeApp ? 'hidden' : 'flex'
          }`}
        >
          <div className="w-16 text-left tracking-wide text-[12px]">{timeString}</div>
          <div className="flex items-center gap-2 text-neutral-500">
            <span className="text-[10px] font-bold tracking-wider">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* App Content Canvas */}
        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">{children}</div>
      </div>
    </div>
  );
};
