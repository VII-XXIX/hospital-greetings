import React from 'react';
import { HOSPITAL_LOGO_BASE64 } from '../constants';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="w-full bg-cream/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-orange-100/50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={onLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onLogoClick?.()}
        >
          {/* Logo Section - Uses centralized asset */}
          <div className="flex-shrink-0 filter drop-shadow-sm transition-all duration-300 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <img
              src={HOSPITAL_LOGO_BASE64}
              alt="Sooriya Hospital Logo"
              className="h-12 w-12 sm:h-14 sm:w-14"
            />
          </div>

          <div className="hidden sm:block w-px h-8 bg-orange-200/50"></div>

          <div className="flex flex-col justify-center">
            <h1 className="text-lg sm:text-xl font-bold text-[#E65100] leading-none font-display uppercase tracking-wide group-hover:text-orange-600 transition-colors">
              Sooriya Hospital
            </h1>
            <p className="text-[10px] sm:text-[11px] font-semibold text-orange-800/60 mt-0.5 tracking-[0.15em] uppercase">
              Greetings
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};