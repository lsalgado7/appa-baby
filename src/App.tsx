import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/useApp';
import { Header } from './components/Header';
import { LastFedBanner } from './components/LastFedBanner';
import { NursingTimer } from './components/NursingTimer';
import { PumpingTimer } from './components/PumpingTimer';
import { BottleLogger } from './components/BottleLogger';
import { DailyStats } from './components/DailyStats';
import { SessionTimeline } from './components/SessionTimeline';
import { ManualEntryModal } from './components/ManualEntryModal';
import { EditSessionModal } from './components/EditSessionModal';
import { FamilyPairingModal } from './components/FamilyPairingModal';
import type { TimelineItem, SessionType } from './types';
import { PlusCircle, Heart, Droplets, Milk } from 'lucide-react';
import { triggerHaptic } from './utils/haptics';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);

  const handleTabChange = (tab: SessionType) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#f9f8f6] dark:bg-[#09090b] text-[#1f1d1a] dark:text-[#f4f4f5] flex flex-col items-center safe-bottom pb-12 transition-colors">
      {/* Max-width container matching mobile screen ratio */}
      <div className="w-full max-w-md flex flex-col min-h-screen px-4">
        {/* App Header with safe-top padding for iOS notch/Dynamic Island */}
        <Header onOpenFamilyModal={() => setIsFamilyModalOpen(true)} />

        <main className="flex-1 flex flex-col gap-5 pt-4">
          {/* Status & Guide Banner */}
          <LastFedBanner />

          {/* Mode Switcher Tabs + Manual Log Action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-[#f3efe9] dark:bg-[#18181b] p-1 rounded-2xl border border-[#e6e2da] dark:border-[#27272a] flex-1">
              <button
                type="button"
                onClick={() => handleTabChange('nursing')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
                  activeTab === 'nursing'
                    ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] shadow-xs'
                    : 'text-[#746f68] dark:text-[#a1a1aa]'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Nursing</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('bottle')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
                  activeTab === 'bottle'
                    ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] shadow-xs'
                    : 'text-[#746f68] dark:text-[#a1a1aa]'
                }`}
              >
                <Milk className="w-3.5 h-3.5" />
                <span>Bottle</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('pumping')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
                  activeTab === 'pumping'
                    ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] shadow-xs'
                    : 'text-[#746f68] dark:text-[#a1a1aa]'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Pumping</span>
              </button>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsManualModalOpen(true);
              }}
              className="py-2.5 px-3 rounded-2xl bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 active:scale-[0.98] transition"
              title="Manual log entry"
            >
              <PlusCircle className="w-4 h-4 text-[#746f68] dark:text-[#a1a1aa]" />
              <span>Manual</span>
            </button>
          </div>

          {/* Active Tracker View */}
          {activeTab === 'nursing' && <NursingTimer />}
          {activeTab === 'bottle' && <BottleLogger />}
          {activeTab === 'pumping' && <PumpingTimer />}

          {/* Today's Daily Stats */}
          <DailyStats />

          {/* Timeline of Past Feeds and Pumps */}
          <section className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-3 px-2">
              Recent Activity
            </h3>
            <SessionTimeline onEditSession={(item) => setEditingItem(item)} />
          </section>
        </main>
      </div>

      {/* Modals */}
      <FamilyPairingModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
      />

      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      <EditSessionModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
