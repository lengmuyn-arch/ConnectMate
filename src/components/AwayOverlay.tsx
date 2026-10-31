import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const AwayOverlay: React.FC = () => {
  const { isAwayModalOpen, setIsAwayModalOpen, addStars } = useApp();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAwayModalOpen) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAwayModalOpen]);

  if (!isAwayModalOpen) return null;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const earnedStars = Math.max(5, Math.floor(minutes / 10) * 10);

  const handleReturn = () => {
    addStars(earnedStars, `vì đã tạm rời màn hình ${minutes > 0 ? `${minutes} phút` : `${seconds} giây`}!`);
    setIsAwayModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2B2118] text-[#F8EFE8] flex flex-col items-center justify-between p-6 sm:p-8 animate-fade-in">
      {/* Top note */}
      <div className="text-center pt-8">
        <span className="inline-block text-5xl mb-4 animate-float-slow">🌱</span>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-white mb-2">
          Đang Tạm Rời Màn Hình
        </h2>
        <p className="text-sm text-stone-300 max-w-xs mx-auto">
          Đặt điện thoại xuống, trò chuyện cùng bạn bè và tận hưởng khoảnh khắc đời thực nhé!
        </p>
      </div>

      {/* Counter */}
      <div className="bg-[#3A2F25] border-[3px] border-[#55B6B2] rounded-3xl p-8 text-center pop-shadow w-full max-w-xs">
        <span className="text-xs uppercase tracking-widest text-[#0ABAB5] font-black block mb-2">
          Thời gian đã buông máy
        </span>
        <div className="font-heading font-black text-6xl text-white tracking-wider font-mono-code mb-2">
          {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
        </div>
        <p className="text-xs text-[#CFE3DC] font-medium">
          Mỗi 10 phút rời máy: <span className="font-black text-amber-300">+10 ⭐</span>
        </p>
      </div>

      {/* Mascot note */}
      <div className="bg-black/30 border border-stone-700/60 rounded-2xl p-4 max-w-xs text-center text-xs text-stone-300">
        🍃 Bé Mầm đang được tiếp thêm năng lượng xanh vì bạn không lướt mạng xã hội!
      </div>

      {/* Return button */}
      <button
        onClick={handleReturn}
        className="w-full max-w-xs py-4 px-6 bg-[#0ABAB5] hover:bg-[#09a09c] text-white font-heading font-black text-lg rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press mb-4 flex items-center justify-center gap-2"
      >
        <span>Quay Lại Ứng Dụng</span>
        <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full font-bold">
          +{earnedStars} ⭐
        </span>
      </button>
    </div>
  );
};
