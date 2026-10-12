import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Sparkles } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeScreenTitle?: string;
  isSimulatedFrame: boolean;
  onToggleFrame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isSimulatedFrame,
  onToggleFrame,
}) => {
  const [timeString, setTimeString] = useState('12:49');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden selection:bg-rose-500/30 selection:text-rose-200">
      {/* Desktop Mode Toggle Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-2 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-neutral-300">Android CleanSwipe</span>
        </div>
        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
          title="Görünüm Modunu Değiştir"
        >
          {isSimulatedFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Genişlet</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Telefon Kasası</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full h-full sm:h-[870px] transition-all duration-300 relative flex flex-col overflow-hidden ${
          isSimulatedFrame
            ? 'sm:max-w-[430px] sm:rounded-[50px] sm:border-[10px] sm:border-neutral-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] bg-neutral-900'
            : 'max-w-xl sm:h-[92vh] sm:rounded-3xl sm:border sm:border-neutral-800 bg-neutral-900'
        }`}
      >
        {/* Android Punch Hole Camera (Only when on desktop simulated frame) */}
        <div className="hidden sm:flex absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-black border border-neutral-800/80 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900/60" />
          </div>
        </div>

        {/* Android Status Bar */}
        <div className="h-8 shrink-0 pt-1 px-4 sm:px-6 flex items-center justify-between text-xs font-semibold text-neutral-300 select-none z-40 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800/40">
          <div className="w-16 text-left tracking-wide font-mono text-[12px]">{timeString}</div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-[10px] font-bold text-neutral-300 tracking-wider">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-sans">94%</span>
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
            </div>
          </div>
        </div>

        {/* App Content Canvas */}
        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">{children}</div>

        {/* Android Navigation Indicator */}
        <div className="h-4 shrink-0 flex items-center justify-center bg-neutral-900 select-none z-40 border-t border-neutral-800/20">
          <div className="w-28 h-1 bg-neutral-600/70 rounded-full hover:bg-neutral-400 transition-colors cursor-pointer" />
        </div>
      </div>
    </div>
  );
};
