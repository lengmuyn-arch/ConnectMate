import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab } = useApp();

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'home', label: 'Trang Chủ', icon: '🏠' },
    { key: 'activities', label: 'Hoạt Động', icon: '🎯' },
    { key: 'bakery', label: 'Pomodoro', icon: '⏱️' },
    { key: 'rewards', label: 'Đổi Thưởng', icon: '🛍️' },
    { key: 'sync', label: 'Môi Trường', icon: '🍽️' },
    { key: 'journal', label: 'Nhật Ký', icon: '📓' },
  ];

  return (
    <nav
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
      }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-[#2B2118] max-w-[440px] mx-auto flex items-stretch select-none"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setCurrentTab(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center transition-colors relative active:scale-95 ${
              isActive
                ? 'bg-[#0ABAB5] text-white border-x-[2px] border-[#2B2118]'
                : 'bg-white text-[#2B2118] hover:bg-[#F8EFE8]'
            }`}
          >
            <span className="text-xl leading-none mb-1 select-none">{tab.icon}</span>
            <span
              className={`text-[10px] sm:text-[10.5px] font-heading font-black tracking-tight leading-tight ${
                isActive ? 'text-white' : 'text-[#2B2118]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
