import React, { useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

import { AppIcon } from './AppIcon';

interface WelcomeViewProps {
  /** Native app: read the device gallery directly */
  onUseDeviceGallery: () => void;
  /** Browser: the user picks files instead, since the gallery is not reachable */
  onLocalFilesPicked: (files: FileList) => void;
  useFilePicker: boolean;
  isLoading: boolean;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onUseDeviceGallery,
  onLocalFilesPicked,
  useFilePicker,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-between px-7 py-10 text-center bg-white">
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

      <div className="flex-1 flex flex-col items-center justify-center">
        <AppIcon size={96} />
        <h1 className="mt-6 text-4xl font-black tracking-tight text-brand lowercase">cleanswipe</h1>
        <p className="mt-4 text-xl font-extrabold text-ink leading-snug max-w-[16rem]">
          Galerini kaydırarak temizle.
        </p>
        <p className="mt-2 text-sm text-neutral-500 max-w-[17rem] leading-relaxed">
          Sağa kaydır sakla, sola kaydır sil. Fotoğrafların telefonundan çıkmaz.
        </p>
      </div>

      <div className="w-full max-w-xs">
        <button
          onClick={() => (useFilePicker ? fileInputRef.current?.click() : onUseDeviceGallery())}
          disabled={isLoading}
          className="w-full h-14 rounded-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-ink text-base font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          {isLoading && (
            <span className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          )}
          <span>{useFilePicker ? 'Fotoğraf Seç' : 'Galerime Eriş'}</span>
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>Sen onaylamadan hiçbir fotoğraf silinmez.</span>
        </div>
      </div>
    </div>
  );
};
