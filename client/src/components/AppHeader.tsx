import { Menu } from "lucide-react";

interface AppHeaderProps {
  showMenu?: boolean;
  onMenuClick?: () => void;
  centerLabel?: string;
}

export function AppHeader({ showMenu = false, onMenuClick, centerLabel = "HYFIT GAMES 2.1" }: AppHeaderProps) {
  return (
    <div className="h-16 w-full flex items-center justify-between px-4 sm:px-6 bg-black text-white border-b border-[#1A1A1A]">
      <div className="flex items-center gap-2">
        {showMenu ? (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center justify-center"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-8" />
        )}
        <img
          src="/branding/hyfit-logo.png"
          alt="Hyfit Games"
          className="h-9 w-auto object-contain"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-gray-100 text-center whitespace-nowrap">
          {centerLabel}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <img
          src="/branding/wone-logo.png"
          alt="Wone"
          className="h-8 w-auto object-contain"
        />
      </div>
    </div>
  );
}

