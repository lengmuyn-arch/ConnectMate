import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { AwayOverlay } from './components/AwayOverlay';
import { AddEventModal } from './components/AddEventModal';
import { VoucherModal } from './components/VoucherModal';
import { HomeView } from './views/HomeView';
import { SyncView } from './views/SyncView';
import { ActivitiesView } from './views/ActivitiesView';
import { BakeryView } from './views/BakeryView';
import { RewardsView } from './views/RewardsView';
import { JournalView } from './views/JournalView';

const MainAppContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <div className="min-h-screen bg-[#F8EFE8] flex flex-col items-center justify-start text-[#2B2118]">
      {/* Mobile container centered on screen */}
      <div className="w-full max-w-[440px] min-h-screen bg-[#F8EFE8] flex flex-col relative sm:border-x-[3px] sm:border-[#2B2118] sm:shadow-2xl">
        <Header />

        <main className="flex-1 px-4 pt-3 overflow-y-auto">
          {currentTab === 'home' && <HomeView />}
          {currentTab === 'sync' && <SyncView />}
          {currentTab === 'activities' && <ActivitiesView />}
          {currentTab === 'bakery' && <BakeryView />}
          {currentTab === 'rewards' && <RewardsView />}
          {currentTab === 'journal' && <JournalView />}
        </main>

        <BottomNav />
        <Toast />
        <AwayOverlay />
        <AddEventModal />
        <VoucherModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
