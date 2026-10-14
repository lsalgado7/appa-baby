import React from 'react';
import { useApp } from '../context/useApp';
import { Moon, Sun, Users } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  onOpenFamilyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFamilyModal }) => {
  const {
    familyId,
    loggedBy,
    setLoggedBy,
    isDarkMode,
    toggleDarkMode,
    isSupabaseConfigured,
    isSyncing,
  } = useApp();

  const handleToggleLoggedBy = () => {
    triggerHaptic('light');
    setLoggedBy(loggedBy === 'Mom' ? 'Dad' : 'Mom');
  };

  return (
    <header className="w-full pt-4 pb-3 px-4 flex items-center justify-between border-b border-[#e6e2da] dark:border-[#27272a] bg-[#f9f8f6] dark:bg-[#09090b] sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-medium tracking-tight text-[#1f1d1a] dark:text-[#f4f4f5]">
          appa baby
        </h1>
        <button
          onClick={onOpenFamilyModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa] hover:opacity-80 transition"
          title="Family Sync Code"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{familyId}</span>
          {isSupabaseConfigured && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
              title={isSyncing ? 'Syncing...' : 'Realtime active'}
            />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Logged By Switch (Mom / Dad) */}
        <button
          onClick={handleToggleLoggedBy}
          className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80 transition"
          title="Switch Logged By"
        >
          <span className="text-[#746f68] dark:text-[#a1a1aa] mr-1">By:</span>
          <span className="font-semibold">{loggedBy}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => {
            triggerHaptic('light');
            toggleDarkMode();
          }}
          className="p-2 rounded-full text-[#746f68] dark:text-[#a1a1aa] hover:bg-[#f3efe9] dark:hover:bg-[#18181b] transition"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
