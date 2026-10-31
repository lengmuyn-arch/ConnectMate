import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RewardsSubTab, MenuItem, CharityPin } from '../types';

export const RewardsView: React.FC = () => {
  const {
    stars,
    rewardsSubTab,
    setRewardsSubTab,
    gardenPlots,
    waterPlant,
    fertilizePlant,
    menuItems,
    redeemFoodItem,
    selectedPetIndex,
    setSelectedPetIndex,
    petsList,
    feedCurrentPet,
    playCurrentPet,
    adoptPet,
    adoptablePets,
    charityPins,
    selectedPin,
    setSelectedPin,
    donateToPin,
    userDonationCount,
    familyFundStars,
    familyRewards,
    redeemFamilyReward,
  } = useApp();

  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);

  // Sub-tabs list
  const subTabs: { key: RewardsSubTab; label: string; icon: string }[] = [
    { key: 'garden', label: 'Khu Vườn', icon: '🪴' },
    { key: 'menu', label: 'Thực Đơn', icon: '🍱' },
    { key: 'pets', label: 'Thú Cưng', icon: '🐹' },
    { key: 'charity', label: 'Từ Thiện', icon: '🍲' },
    { key: 'family', label: 'Đặc quyền GĐ', icon: '💝' },
  ];

  // Garden calculations
  const bloomingCount = gardenPlots.filter((p) => p.stage === 100).length;
  const totalStages = gardenPlots.reduce((sum, p) => sum + p.stage, 0);
  const gardenAvgProgress = Math.round(totalStages / (gardenPlots.length * 100) * 100);

  const getStageEmoji = (stage: number) => {
    switch (stage) {
      case 0:
        return '🫘';
      case 25:
        return '🌱';
      case 50:
        return '🌿';
      case 75:
        return '🌸';
      case 100:
      default:
        return '🌺';
    }
  };

  const currentPet = petsList[selectedPetIndex] || petsList[0];

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* 1. Header with Stars Badge */}
      <div className="flex items-center justify-between px-1">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2118] flex items-center gap-2">
          <span>🛍️</span> Trạm Đổi Thưởng
        </h1>

        <div className="bg-[#0ABAB5] text-white px-3.5 py-1.5 rounded-full border-[3px] border-[#2B2118] pop-shadow flex items-center gap-1">
          <span className="text-sm">✨</span>
          <span className="font-heading font-black text-xs sm:text-sm">
            {stars.toLocaleString('vi-VN')} Sao
          </span>
        </div>
      </div>

      {/* 2. Sub-tab Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        {subTabs.map((tab) => {
          const isSelected = rewardsSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRewardsSubTab(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-2xl font-heading font-black text-xs sm:text-sm border-[3px] border-[#2B2118] transition-all btn-press flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#0ABAB5] text-white pop-shadow'
                  : 'bg-white text-[#2B2118]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KHU VƯỜN */}
      {rewardsSubTab === 'garden' && (
        <div className="space-y-4 animate-fade-in">
          {/* Garden sky canvas */}
          <div className="rounded-3xl border-[3px] border-[#2B2118] pop-shadow overflow-hidden bg-gradient-to-b from-[#87CEEB] via-[#BFE5E1] to-[#7FA478] p-4 relative">
            {/* Sky decor: Sun & insects */}
            <div className="flex justify-between items-start mb-2 px-1 relative z-10">
              <div className="flex items-center gap-3 text-lg animate-float-slow">
                <span>🐝</span>
                <span>🦋</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg animate-float-fast">🦋</span>
                <span className="text-base animate-bounce">🐛</span>
                <span className="text-2xl animate-spin-slow">☀️</span>
              </div>
            </div>

            {/* 3x4 soil grid matching image */}
            <div className="bg-[#5C3D2E] rounded-2xl border-[3px] border-[#2B2118] p-3 grid grid-cols-4 gap-2.5 shadow-inner">
              {gardenPlots.map((plot, idx) => (
                <div
                  key={plot.id}
                  onClick={() => setActiveCellIndex(activeCellIndex === idx ? null : idx)}
                  className={`bg-[#432A1F] hover:bg-[#4d3125] rounded-xl border-2 border-[#2B2118] p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all aspect-square relative ${
                    activeCellIndex === idx ? 'ring-2 ring-amber-300 scale-105' : ''
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center text-2xl sm:text-3xl select-none animate-float-slow">
                    {getStageEmoji(plot.stage)}
                  </div>

                  {/* Teal progress underline matching image */}
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-black/30">
                    <div
                      style={{ width: `${plot.stage}%` }}
                      className="h-full bg-[#0ABAB5] rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action bar for selected cell */}
            {activeCellIndex !== null && (
              <div className="mt-3 bg-white/95 rounded-2xl border-2 border-[#2B2118] p-3 flex items-center justify-between pop-shadow-sm animate-pop-in">
                <div className="text-xs font-bold text-[#2B2118]">
                  <span>Ô đất #{activeCellIndex + 1}: </span>
                  <span className="text-[#0ABAB5] font-black">
                    {gardenPlots[activeCellIndex].stage}% ({getStageEmoji(gardenPlots[activeCellIndex].stage)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => waterPlant(activeCellIndex)}
                    className="px-2.5 py-1 bg-[#0ABAB5] text-white text-xs font-black rounded-xl border border-[#2B2118] btn-press"
                  >
                    💧 Tưới (20⭐)
                  </button>
                  <button
                    onClick={() => fertilizePlant(activeCellIndex)}
                    className="px-2.5 py-1 bg-[#DFB2FA] text-[#2B2118] text-xs font-black rounded-xl border border-[#2B2118] btn-press"
                  >
                    ✨ Bón (40⭐)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tiến Trình Phủ Xanh Trái Đất */}
          <div className="bg-[#CFE3DC] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-sm sm:text-base text-[#2B2118] flex items-center gap-1.5">
                <span>🌏</span> Tiến Trình Phủ Xanh Trái Đất
              </h3>
              <span className="font-heading font-black text-xs sm:text-sm text-[#0ABAB5]">
                {bloomingCount}/12 nở rộ
              </span>
            </div>

            {/* Overall Progress */}
            <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden border border-[#2B2118]/20">
              <div
                style={{ width: `${gardenAvgProgress}%` }}
                className="h-full bg-[#0ABAB5] rounded-full transition-all duration-500"
              />
            </div>

            <p className="text-[11.5px] font-semibold text-stone-700 flex items-center gap-1 pt-0.5">
              <span>Mỗi ô nở rộ = 1 cây thật được trồng ngoài đời</span>
              <span>🌳</span>
            </p>
          </div>

          {/* Section: Nâng Cấp Cây Trồng */}
          <div className="space-y-2 pt-1">
            <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-1.5">
              <span>✨</span> Nâng Cấp Cây Trồng
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  gardenPlots.forEach((_, i) => {
                    if (gardenPlots[i].stage < 100) waterPlant(i);
                  });
                }}
                className="bg-white p-3.5 rounded-2xl border-2 border-[#2B2118] pop-shadow-sm text-left btn-press"
              >
                <span className="text-2xl block mb-1">🚿</span>
                <p className="font-heading font-black text-xs text-[#2B2118]">
                  Tưới Nước Toàn Vườn
                </p>
                <p className="text-[11px] text-stone-500">
                  Tăng 1 nấc cho các ô
                </p>
              </button>

              <button
                onClick={() => {
                  gardenPlots.forEach((_, i) => fertilizePlant(i));
                }}
                className="bg-white p-3.5 rounded-2xl border-2 border-[#2B2118] pop-shadow-sm text-left btn-press"
              >
                <span className="text-2xl block mb-1">🌟</span>
                <p className="font-heading font-black text-xs text-[#2B2118]">
                  Phân Bón Thần Kỳ
                </p>
                <p className="text-[11px] text-stone-500">
                  Nở rộ ngay lập tức
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THỰC ĐƠN */}
      {rewardsSubTab === 'menu' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs sm:text-sm font-semibold text-stone-600 italic px-1">
            "Đổi sao tập trung của bạn lấy đồ ăn thật ngay căng-tin trường!"
          </p>

          <div className="grid grid-cols-2 gap-3.5">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 sm:p-4 flex flex-col items-center justify-between text-center space-y-2.5 transition-transform hover:-translate-y-0.5"
              >
                {/* Food Icon */}
                <div className="text-5xl sm:text-6xl py-1 select-none animate-float-slow">
                  {item.icon}
                </div>

                {/* Name */}
                <h4 className="font-heading font-black text-xs sm:text-sm text-[#2B2118] leading-tight min-h-[32px] flex items-center justify-center">
                  {item.name}
                </h4>

                {/* Price Pill */}
                <div className="bg-[#F9DCC4] text-[#2B2118] text-xs font-black px-3 py-1 rounded-full border-2 border-[#2B2118] flex items-center gap-1">
                  <span>⭐</span>
                  <span>{item.cost} Sao</span>
                </div>

                {/* Redeem Button */}
                <button
                  onClick={() => redeemFoodItem(item)}
                  disabled={stars < item.cost}
                  className={`w-full py-2 rounded-2xl font-heading font-black text-xs sm:text-sm border-2 border-[#2B2118] transition-all btn-press ${
                    stars >= item.cost
                      ? 'bg-[#0ABAB5] text-white pop-shadow-sm'
                      : 'bg-stone-200 text-stone-400 border-stone-400 cursor-not-allowed'
                  }`}
                >
                  Đổi Ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: THÚ CƯNG */}
      {rewardsSubTab === 'pets' && (
        <div className="space-y-4 animate-fade-in">
          {/* Subtitle */}
          <div className="flex items-center gap-1.5 px-1">
            <span>🐾</span>
            <h3 className="font-heading font-black text-base text-[#2B2118]">
              Chọn Thú Cưng
            </h3>
          </div>

          {/* 6 Pets Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {petsList.map((pet, idx) => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetIndex(idx)}
                className={`shrink-0 w-16 sm:w-20 py-2.5 rounded-2xl border-[3px] border-[#2B2118] flex flex-col items-center justify-center gap-1 transition-all btn-press ${
                  selectedPetIndex === idx
                    ? 'bg-[#0ABAB5] text-white pop-shadow'
                    : 'bg-white text-[#2B2118]'
                }`}
              >
                <span className="text-2xl">{pet.avatar}</span>
                <span className="font-heading font-black text-[11px] truncate max-w-[60px]">
                  {pet.species}
                </span>
              </button>
            ))}
          </div>

          {/* Current Pet Main Card (Pink) */}
          <div className="bg-[#F4BAB3] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/80 border-[3px] border-[#2B2118] flex items-center justify-center text-5xl shrink-0 pop-shadow-sm animate-float-slow">
                {currentPet.avatar}
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="font-heading font-black text-xl text-[#2B2118]">
                  {currentPet.name}
                </h3>

                {/* Hunger */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-black text-[#2B2118]">
                    <span>🍔 Độ Đói</span>
                    <span>{currentPet.hunger}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/50 rounded-full overflow-hidden border border-[#2B2118]/30">
                    <div
                      style={{ width: `${currentPet.hunger}%` }}
                      className="h-full bg-[#0ABAB5] rounded-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Happiness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-black text-[#2B2118]">
                    <span>💖 Hạnh Phúc</span>
                    <span>{currentPet.happiness}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/50 rounded-full overflow-hidden border border-[#2B2118]/30">
                    <div
                      style={{ width: `${currentPet.happiness}%` }}
                      className="h-full bg-[#DFB2FA] rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={feedCurrentPet}
                className="py-3 px-3 bg-[#0ABAB5] hover:bg-[#099b97] text-white font-heading font-black text-xs sm:text-sm rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press flex items-center justify-center gap-1.5"
              >
                <span>🌟</span>
                <span>Cho Ăn (50 Sao)</span>
              </button>

              <button
                onClick={playCurrentPet}
                className="py-3 px-3 bg-[#DFB2FA] hover:bg-[#d09ff3] text-[#2B2118] font-heading font-black text-xs sm:text-sm rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press flex items-center justify-center gap-1.5"
              >
                <span>🎮</span>
                <span>Chơi (30 Sao)</span>
              </button>
            </div>
          </div>

          {/* Section: Thú Cưng Cần Bạn */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-2">
                <span>🏠</span> Thú Cưng Cần Bạn
              </h3>
              <span className="bg-[#F4BAB3] text-[#2B2118] text-xs font-black px-3 py-1 rounded-full border-2 border-[#2B2118] pop-shadow-sm">
                Cần Nhận Nuôi
              </span>
            </div>

            {adoptablePets.length === 0 ? (
              <div className="bg-white/80 rounded-2xl border-2 border-[#2B2118] p-4 text-center text-xs font-bold text-stone-600">
                🎉 Bạn đã giải cứu và nhận nuôi tất cả các bé thú hoang!
              </div>
            ) : (
              adoptablePets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-[#F9DCC4] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{pet.avatar}</span>
                    <div>
                      <h4 className="font-heading font-black text-sm text-[#2B2118]">
                        {pet.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">🍔</span>
                        <div className="w-12 h-1.5 bg-stone-300 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pet.hunger}%` }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                        <span className="text-xs ml-1">💖</span>
                        <div className="w-12 h-1.5 bg-stone-300 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pet.happiness}%` }}
                            className="h-full bg-pink-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => adoptPet(pet.id)}
                    className="py-2.5 px-3 bg-[#F4BAB3] text-[#2B2118] font-heading font-black text-xs rounded-2xl border-2 border-[#2B2118] pop-shadow-sm btn-press whitespace-nowrap"
                  >
                    💖 Nhận Nuôi (200 ⭐)
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TỪ THIỆN */}
      {rewardsSubTab === 'charity' && (
        <div className="space-y-4 animate-fade-in">
          {/* Card 1: Tác Động Toàn Cầu */}
          <div className="bg-[#0ABAB5] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 text-white flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg flex items-center gap-2">
                <span>🌏</span> Tác Động Toàn Cầu
              </h3>
              <p className="text-xs font-semibold text-white/95 mt-1">
                {userDonationCount} quỹ đã nhận quyên góp từ bạn
              </p>
            </div>
            <span className="text-4xl filter drop-shadow">
              {userDonationCount > 0 ? '❤️' : '🤍'}
            </span>
          </div>

          {/* Card 2: Bản Đồ Quyên Góp Thế Giới */}
          <div className="bg-[#1A2332] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 text-white space-y-3">
            <h3 className="font-heading font-black text-sm sm:text-base flex items-center justify-center gap-2">
              <span>🗺️</span> Bản Đồ Quyên Góp Thế Giới
            </h3>

            {/* SVG Globe with continent polygons and grid lines */}
            <div className="relative w-full aspect-square max-w-[280px] mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                {/* Globe circle background */}
                <circle cx="100" cy="100" r="90" fill="#154360" stroke="#0ABAB5" strokeWidth="2.5" />

                {/* Globe grid latitude and longitude lines */}
                <ellipse cx="100" cy="100" rx="90" ry="40" fill="none" stroke="#1B4F72" strokeWidth="1" strokeDasharray="3 3" />
                <ellipse cx="100" cy="100" rx="40" ry="90" fill="none" stroke="#1B4F72" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="10" y1="100" x2="190" y2="100" stroke="#1B4F72" strokeWidth="1.5" />
                <line x1="100" y1="10" x2="100" y2="190" stroke="#1B4F72" strokeWidth="1.5" />

                {/* Stylized continent polygons */}
                {/* Americas */}
                <polygon
                  points="25,55 45,45 60,60 55,95 40,115 35,80"
                  fill="#2E7D32"
                  stroke="#1E5222"
                  strokeWidth="1.5"
                />
                <polygon
                  points="40,115 55,120 50,155 35,145"
                  fill="#2E7D32"
                  stroke="#1E5222"
                  strokeWidth="1.5"
                />

                {/* Europe & Africa */}
                <polygon
                  points="75,40 100,35 110,60 85,65"
                  fill="#2E7D32"
                  stroke="#1E5222"
                  strokeWidth="1.5"
                />
                <polygon
                  points="80,75 110,70 120,110 95,140 85,115"
                  fill="#2E7D32"
                  stroke="#1E5222"
                  strokeWidth="1.5"
                />

                {/* Asia & Pacific */}
                <polygon
                  points="110,40 170,45 180,85 145,100 120,70"
                  fill="#2E7D32"
                  stroke="#1E5222"
                  strokeWidth="1.5"
                />
                <polygon
                  points="140,120 175,125 165,155 135,145"
                  fill="#2E7D32"
                  stroke="#1E5222"
                  strokeWidth="1.5"
                />
              </svg>

              {/* 6 Donation pins matching image */}
              {charityPins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => setSelectedPin(pin)}
                  style={{ left: `${pin.coords.x}%`, top: `${pin.coords.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-[#2B2118] flex items-center justify-center text-sm transition-transform hover:scale-125 pop-shadow-sm ${
                    pin.donated
                      ? 'bg-[#0ABAB5] text-white ring-2 ring-white animate-pulse'
                      : 'bg-[#F4BAB3] text-[#2B2118]'
                  }`}
                  title={pin.name}
                >
                  {pin.icon}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-stone-400 text-center font-medium">
              Bấm ghim để xem • Ghim xanh = đã ủng hộ
            </p>

            {/* Donation Pin Details Popup */}
            {selectedPin && (
              <div className="bg-[#2B2118] rounded-2xl border-2 border-[#0ABAB5] p-3.5 space-y-2 animate-pop-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedPin.icon}</span>
                    <h4 className="font-heading font-black text-sm text-white">
                      {selectedPin.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedPin(null)}
                    className="text-stone-400 hover:text-white font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-stone-300">
                  {selectedPin.description}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-amber-300">
                    ⭐ {selectedPin.cost} Sao
                  </span>
                  <button
                    onClick={() => donateToPin(selectedPin.id)}
                    disabled={selectedPin.donated}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border border-[#2B2118] ${
                      selectedPin.donated
                        ? 'bg-[#0ABAB5] text-white cursor-default'
                        : 'bg-[#DFB2FA] text-[#2B2118] hover:bg-[#d09ff3]'
                    }`}
                  >
                    {selectedPin.donated ? '✓ Đã Quyên Góp' : 'Ủng Hộ Ngay'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Bảng Xếp Hạng Tháng Này */}
          <div className="bg-[#F9DCC4] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-3">
            <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-2">
              <span>🏆</span> Bảng Xếp Hạng Tháng Này
            </h3>

            <div className="space-y-2">
              {/* Row 1: Phương ✨ (matching image) */}
              <div className="bg-white rounded-2xl border-2 border-[#2B2118] p-3 flex items-center justify-between pop-shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-black text-base text-[#2B2118] w-4">
                    1
                  </span>
                  <span className="font-heading font-black text-sm text-[#2B2118]">
                    Phương ✨
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-sm text-[#0ABAB5] flex items-center gap-1">
                    7 🍲
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">
                    3,500 sao
                  </span>
                </div>
              </div>

              {/* Row 2: Bạn (user) */}
              <div className="bg-[#CFE3DC] rounded-2xl border-2 border-[#2B2118] p-3 flex items-center justify-between pop-shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-black text-base text-[#2B2118] w-4">
                    2
                  </span>
                  <span className="font-heading font-black text-sm text-[#2B2118]">
                    Bạn (Tôi) 🌟
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-sm text-[#0ABAB5] flex items-center gap-1">
                    {userDonationCount} 🍲
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">
                    {(userDonationCount * 200).toLocaleString('vi-VN')} sao
                  </span>
                </div>
              </div>

              {/* Row 3: Minh 🦖 */}
              <div className="bg-white rounded-2xl border-2 border-[#2B2118] p-3 flex items-center justify-between pop-shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-black text-base text-[#2B2118] w-4">
                    3
                  </span>
                  <span className="font-heading font-black text-sm text-[#2B2118]">
                    Minh 🦖
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-sm text-[#0ABAB5] flex items-center gap-1">
                    5 🍲
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">
                    2,400 sao
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ĐẶC QUYỀN GIA ĐÌNH */}
      {rewardsSubTab === 'family' && (
        <div className="space-y-4 animate-fade-in">
          {/* Card 1: Quỹ Sao Gia Đình */}
          <div className="bg-white rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-2">
                <span>💝</span> Quỹ Sao Gia Đình
              </h3>
              <span className="font-heading font-black text-lg text-[#DFB2FA]">
                {familyFundStars} / 800 ⭐
              </span>
            </div>

            <p className="text-xs font-semibold text-stone-500">
              Tổng tích lũy
            </p>

            {/* Gradient progress bar matching image */}
            <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden border border-stone-300">
              <div
                style={{ width: `${Math.min(100, (familyFundStars / 800) * 100)}%` }}
                className="h-full bg-gradient-to-r from-[#DFB2FA] to-[#0ABAB5] rounded-full transition-all duration-500"
              />
            </div>

            {/* Milestone labels */}
            <div className="flex items-center justify-between text-xs font-heading font-black pt-0.5">
              <span className={familyFundStars >= 300 ? 'text-[#0ABAB5]' : 'text-stone-400'}>
                300 ⭐
              </span>
              <span className={familyFundStars >= 500 ? 'text-[#0ABAB5]' : 'text-stone-400'}>
                500 ⭐
              </span>
              <span className={familyFundStars >= 800 ? 'text-[#0ABAB5]' : 'text-stone-400'}>
                800 ⭐
              </span>
            </div>
          </div>

          {/* Reward 1: Mốc 300 Sao (Unlocked) */}
          <div className="bg-[#DFB2FA] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/70 border-2 border-[#2B2118] flex items-center justify-center text-3xl shrink-0 pop-shadow-sm">
                🏺
              </div>
              <div>
                <span className="text-xs font-bold text-stone-700 block">
                  Mốc 300 Sao
                </span>
                <h4 className="font-heading font-black text-base text-[#2B2118]">
                  Đi làm gốm / uống cà phê cùng con
                </h4>
              </div>
            </div>

            <button
              onClick={() => redeemFamilyReward(300)}
              className="w-full py-3.5 bg-[#0ABAB5] hover:bg-[#099b97] text-white font-heading font-black text-sm rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press flex items-center justify-center gap-2"
            >
              <span>🎁</span>
              <span>Đổi Thưởng Ngay!</span>
            </button>
          </div>

          {/* Reward 2: Mốc 500 Sao (Locked) */}
          <div className="bg-[#EBE7E3] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 opacity-90 space-y-1">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/50 border-2 border-stone-400 flex items-center justify-center text-3xl shrink-0">
                🍕
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block">
                  Mốc 500 Sao
                </span>
                <h4 className="font-heading font-black text-base text-stone-700">
                  Cả nhà cùng đi ăn Pizza cuối tuần
                </h4>
                <p className="text-xs font-bold text-stone-500 mt-1 flex items-center gap-1">
                  <span>🔒</span> Cần thêm {Math.max(0, 500 - familyFundStars)} sao nữa
                </p>
              </div>
            </div>
          </div>

          {/* Reward 3: Mốc 800 Sao (Locked) */}
          <div className="bg-[#EBE7E3] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 opacity-90 space-y-1">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/50 border-2 border-stone-400 flex items-center justify-center text-3xl shrink-0">
                🎡
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block">
                  Mốc 800 Sao
                </span>
                <h4 className="font-heading font-black text-base text-stone-700">
                  Một chuyến dã ngoại ngoại ô cùng gia đình
                </h4>
                <p className="text-xs font-bold text-stone-500 mt-1 flex items-center gap-1">
                  <span>🔒</span> Cần thêm {Math.max(0, 800 - familyFundStars)} sao nữa
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
