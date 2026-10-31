import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ContextualIcebreakerCardDeck } from '../components/ContextualIcebreakerCardDeck';

export const ActivitiesView: React.FC = () => {
  const {
    activityTab,
    setActivityTab,
    activeActivityDetail,
    setActiveActivityDetail,
    familyTasks,
    verifyFamilyTask,
    isHideAndSeekActive,
    hideAndSeekPhase,
    startHideAndSeek,
    stopHideAndSeek,
    addStars,
  } = useApp();

  // PIN inputs for Family tasks
  const [pinValues, setPinValues] = useState<{ [key: string]: string[] }>({
    task_1: ['', '', '', ''],
    task_2: ['', '', '', ''],
    task_3: ['', '', '', ''],
  });

  const pinInputRefs = useRef<{ [key: string]: (HTMLInputElement | null)[] }>({});

  const handlePinChange = (taskId: string, index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const char = val.slice(-1);
    const newPins = { ...pinValues };
    const taskPins = [...(newPins[taskId] || ['', '', '', ''])];
    taskPins[index] = char;
    newPins[taskId] = taskPins;
    setPinValues(newPins);

    // Auto advance
    if (char && index < 3) {
      pinInputRefs.current[taskId]?.[index + 1]?.focus();
    }

    // Auto verify when 4 digits entered
    if (taskPins.every((p) => p !== '')) {
      const fullPin = taskPins.join('');
      const success = verifyFamilyTask(taskId, fullPin);
      if (!success) {
        setTimeout(() => {
          newPins[taskId] = ['', '', '', ''];
          setPinValues({ ...newPins });
          pinInputRefs.current[taskId]?.[0]?.focus();
        }, 600);
      }
    }
  };

  const handlePinKeyDown = (taskId: string, index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinValues[taskId]?.[index] && index > 0) {
      pinInputRefs.current[taskId]?.[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Top Toggle: Bạn Bè vs Gia Đình */}
      <div className="bg-[#CFE3DC] rounded-full border-[3px] border-[#2B2118] p-1.5 flex items-center pop-shadow">
        <button
          onClick={() => {
            setActivityTab('friends');
            setActiveActivityDetail('none');
          }}
          className={`flex-1 py-2 rounded-full font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activityTab === 'friends'
              ? 'bg-[#0ABAB5] text-white border-2 border-[#2B2118] pop-shadow-sm'
              : 'text-[#2B2118] hover:text-black'
          }`}
        >
          <span>🧑‍🤝‍🧑</span> Bạn Bè
        </button>
        <button
          onClick={() => {
            setActivityTab('family');
            setActiveActivityDetail('none');
          }}
          className={`flex-1 py-2 rounded-full font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
            activityTab === 'family'
              ? 'bg-[#0ABAB5] text-white border-2 border-[#2B2118] pop-shadow-sm'
              : 'text-[#2B2118] hover:text-black'
          }`}
        >
          <span>🏡</span> Gia Đình
        </button>
      </div>

      {/* VIEW 1: BẠN BÈ */}
      {activityTab === 'friends' && (
        <>
          {/* Sub-view: Mood Selection (Default) */}
          {activeActivityDetail === 'none' && (
            <div className="space-y-4 animate-fade-in">
              <div className="px-1">
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2118]">
                  Tâm trạng của bạn lúc này thế nào?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-stone-600 mt-1">
                  Bạn đang không biết làm gì hả? Để tụi mình giúp nha!
                </p>
              </div>

              {/* Card 1: Hướng Nội (Purple) */}
              <div
                onClick={() => setActiveActivityDetail('picture_guess')}
                className="bg-[#DFB2FA] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/70 border-2 border-[#2B2118] flex items-center justify-center text-3xl mb-3 pop-shadow-sm">
                  🛋️
                </div>
                <h3 className="font-heading font-black text-xl text-[#2B2118]">
                  Hướng Nội
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1 mb-4 leading-relaxed">
                  Ở trong nhà · Bộ thẻ gợi ý chủ đề trò chuyện sâu sắc, ấm cúng và câu hỏi khơi mở theo từng bối cảnh.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white text-[#2B2118] text-xs font-black px-3 py-1.5 rounded-full border-2 border-[#2B2118] pop-shadow-sm flex items-center gap-1">
                    💡 Thẻ Gợi Ý Hội Thoại
                  </span>
                  <span className="bg-white text-[#2B2118] text-xs font-black px-3 py-1.5 rounded-full border-2 border-[#2B2118] pop-shadow-sm flex items-center gap-1">
                    ☕ 4 Bối Cảnh
                  </span>
                </div>
              </div>

              {/* Card 2: Hướng Ngoại (Teal) */}
              <div
                onClick={() => setActiveActivityDetail('extrovert_explore')}
                className="bg-[#0ABAB5] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 text-white cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/30 border-2 border-[#2B2118] flex items-center justify-center text-3xl mb-3 pop-shadow-sm">
                  🚀
                </div>
                <h3 className="font-heading font-black text-xl text-white">
                  Hướng Ngoại
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-white/95 mt-1 mb-4 leading-relaxed">
                  Ra ngoài · Khám phá thế giới thực với dữ liệu vùng mạng cục bộ.
                </p>
                <div className="flex items-center gap-2">
                  <span className="bg-white text-[#2B2118] text-xs font-black px-3 py-1.5 rounded-full border-2 border-[#2B2118] pop-shadow-sm flex items-center gap-1">
                    🌳 Dạo Công Viên
                  </span>
                  <span className="bg-white text-[#2B2118] text-xs font-black px-3 py-1.5 rounded-full border-2 border-[#2B2118] pop-shadow-sm flex items-center gap-1">
                    🏃 Trốn Tìm
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Introvert Detail (Contextual Icebreaker Card Deck inside Introvert) */}
          {activeActivityDetail === 'picture_guess' && (
            <div className="space-y-4 animate-fade-in">
              {/* Top controls: Back button & Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveActivityDetail('none')}
                  className="w-10 h-10 rounded-full bg-white border-[3px] border-[#2B2118] flex items-center justify-center font-black pop-shadow-sm transition-transform active:scale-95"
                >
                  ←
                </button>
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2118] flex items-center gap-2">
                    <span>🛋️</span>
                    <span>Chủ Đề Trò Chuyện (Hướng Nội)</span>
                  </h2>
                  <p className="text-xs text-stone-600 font-medium">
                    Bộ thẻ khơi gợi hội thoại thông minh theo 4 địa điểm gặp gỡ
                  </p>
                </div>
              </div>

              {/* Contextual Icebreaker Card Deck */}
              <ContextualIcebreakerCardDeck />
            </div>
          )}

          {/* Sub-view: Extrovert Detail (Image 23-9-26 at 22.23) */}
          {activeActivityDetail === 'extrovert_explore' && (
            <div className="space-y-4 animate-fade-in">
              {/* Back header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveActivityDetail('none')}
                  className="w-10 h-10 rounded-full bg-white border-[3px] border-[#2B2118] flex items-center justify-center font-black pop-shadow-sm"
                >
                  ←
                </button>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-[#2B2118] flex items-center gap-2">
                  <span>🚀</span> Hướng Ngoại
                </h2>
              </div>

              {/* Wi-Fi router card */}
              <div className="bg-[#0ABAB5] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 text-white flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-[#2B2118] flex items-center justify-center text-2xl shrink-0">
                  📡
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white leading-tight">
                    Kết Nối Qua Bộ Định Tuyến Wi-Fi Cục Bộ
                  </h3>
                  <p className="text-xs font-semibold text-white/90 mt-0.5">
                    Cafe Everyday
                  </p>
                </div>
              </div>

              {/* Section: Gần Đây Lúc Này */}
              <div className="space-y-2.5">
                <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-2">
                  <span>🌍</span> Gần Đây Lúc Này
                </h3>

                {/* Place 1: Dạo công viên Eco Park */}
                <div className="bg-[#CFE3DC] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 sm:p-4 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 border-2 border-[#2B2118] flex items-center justify-center text-2xl shrink-0 pop-shadow-sm">
                    🌳
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm text-[#2B2118]">
                      Dạo công viên Eco Park
                    </h4>
                    <p className="text-xs font-semibold text-stone-700 mt-0.5">
                      Cách 2 phút — Hít thở không khí trong lành nào!
                    </p>
                  </div>
                </div>

                {/* Place 2: Photobooth ABC */}
                <div className="bg-[#DFB2FA] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 sm:p-4 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 border-2 border-[#2B2118] flex items-center justify-center text-2xl shrink-0 pop-shadow-sm">
                    📸
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm text-[#2B2118]">
                      Photobooth ABC
                    </h4>
                    <p className="text-xs font-semibold text-stone-700 mt-0.5">
                      Ngay góc kia — Chụp kỷ niệm cùng cả nhóm thôi!
                    </p>
                  </div>
                </div>

                {/* Place 3: Săn bánh Croissant */}
                <div className="bg-[#F9DCC4] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 sm:p-4 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 border-2 border-[#2B2118] flex items-center justify-center text-2xl shrink-0 pop-shadow-sm">
                    🥐
                  </div>
                  <div>
                    <h4 className="font-heading font-black text-sm text-[#2B2118]">
                      Săn bánh Croissant
                    </h4>
                    <p className="text-xs font-semibold text-stone-700 mt-0.5">
                      Qua đường kia — Thử ngay món bánh đang hot nhé!
                    </p>
                  </div>
                </div>
              </div>

              {/* Game: Trò Chơi Trốn Tìm */}
              <div className="bg-[#F4BAB3] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗺️</span>
                  <h3 className="font-heading font-black text-base text-[#2B2118]">
                    Trò Chơi Trốn Tìm
                  </h3>
                </div>

                <p className="text-xs font-semibold text-stone-800 leading-relaxed">
                  Bản đồ sẽ hiện vị trí của bạn bè bạn trong 45 giây. Sau đó bạn sẽ phải thực hiện phi vụ tìm kiếm trong vòng 15 Phút.
                </p>

                {isHideAndSeekActive ? (
                  <div className="bg-white/95 rounded-2xl border-2 border-[#2B2118] p-4 text-center space-y-2">
                    <p className="text-xs font-black text-[#0ABAB5]">
                      {hideAndSeekPhase === 'map'
                        ? '📡 Đang đồng bộ vị trí radar bạn bè (45s)'
                        : '🏃 Màn hình đã khóa! Mau đi tìm đồng đội thôi!'}
                    </p>
                    <div className="flex justify-center gap-4 text-2xl py-2">
                      <span className="animate-bounce">🧑‍🤝‍🧑 Tiên (Gần cây đa)</span>
                      <span className="animate-bounce delay-100">Minh (Quầy kem)</span>
                    </div>
                    <button
                      onClick={stopHideAndSeek}
                      className="px-4 py-2 bg-[#2B2118] text-white text-xs font-bold rounded-xl border border-black"
                    >
                      Kết thúc trò chơi
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startHideAndSeek}
                    className="w-full py-3.5 bg-[#2B2118] hover:bg-[#3d3023] text-white font-heading font-black text-sm rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press flex items-center justify-center gap-2"
                  >
                    <span>🏃</span>
                    <span>Bắt Đầu 15 Phút Trốn Tìm!</span>
                    <span>💨</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: GIA ĐÌNH (Image 23-9-26 at 22.26) */}
      {activityTab === 'family' && (
        <div className="space-y-4 animate-fade-in">
          <div className="px-1">
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2118] flex items-center gap-2">
              Góc Gắn Kết <span>🏡</span>
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-stone-600 mt-1">
              AI gợi ý những khoảnh khắc ấm áp cùng bố mẹ ✨
            </p>
          </div>

          <div className="space-y-3.5">
            {familyTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#F9DCC4] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/80 border-2 border-[#2B2118] flex items-center justify-center text-2xl shrink-0 pop-shadow-sm">
                    {task.icon}
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base text-[#2B2118] leading-tight">
                      {task.title}
                    </h3>
                    <p className="text-xs font-semibold text-stone-700 mt-0.5">
                      {task.description}
                    </p>
                  </div>
                </div>

                {task.isCompleted ? (
                  <div className="bg-[#CFE3DC] text-[#2B2118] rounded-2xl border-2 border-[#2B2118] py-2.5 px-4 text-center font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-1.5">
                    <span>✅ Đã xác nhận hoàn thành!</span>
                    <span className="text-amber-700">(+50 ⭐)</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      Ông / Bà nhập mã xác nhận (PIN 4 số):
                    </label>

                    {/* 4 square pin boxes */}
                    <div className="flex items-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            if (!pinInputRefs.current[task.id]) {
                              pinInputRefs.current[task.id] = [];
                            }
                            pinInputRefs.current[task.id][idx] = el;
                          }}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={pinValues[task.id]?.[idx] || ''}
                          onChange={(e) => handlePinChange(task.id, idx, e.target.value)}
                          onKeyDown={(e) => handlePinKeyDown(task.id, idx, e)}
                          className="w-14 h-14 bg-white rounded-2xl border-2 border-[#2B2118] text-center font-heading font-black text-xl text-[#2B2118] pop-shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#0ABAB5]"
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5 italic">
                      (Mã PIN mặc định: 1234)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
