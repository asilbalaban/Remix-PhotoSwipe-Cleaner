import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
  hasShadow?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  size = 40,
  className = '',
  hasShadow = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-[26%] ${
        hasShadow ? 'shadow-lg shadow-rose-950/40' : ''
      } ${className}`}
    >
      <img
        src="/app-icon.svg"
        alt="CleanSwipe App Icon"
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );
};
