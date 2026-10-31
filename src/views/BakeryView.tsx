import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, RotateCcw, Clock, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

export const BakeryView: React.FC = () => {
  const {
    pomodoroMinutes,
    pomodoroSeconds,
    isPomodoroRunning,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    bakeryTaskTitle,
    setBakeryTaskTitle,
    showToast,
  } = useApp();

  const [isEditingTask, setIsEditingTask] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<25 | 50 | 5>(25);

  // Total session seconds based on selected preset
  const totalSeconds = selectedDuration * 60;
  const currentTotalSeconds = pomodoroMinutes * 60 + pomodoroSeconds;
  const elapsedSeconds = totalSeconds - currentTotalSeconds;
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSeconds) * 100)));

  const handleSelectPreset = (mins: 25 | 50 | 5) => {
    setSelectedDuration(mins);
    resetPomodoro();
    showToast(`⏱️ Đã chọn phiên Pomodoro ${mins} phút!`, 'info');
  };

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* 1. Header Title */}
      <div className="px-1 space-y-1">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2118] flex items-center gap-2">
          <span>Đồng Hồ Tập Trung Pomodoro</span>
          <span className="text-2xl">⏱️</span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-stone-600 leading-relaxed">
          Tập trung học bài không xao nhãng để tích Sao thưởng &amp; duy trì thói quen học tập đỉnh cao ✨
        </p>
      </div>

      {/* 2. Quick Duration Presets */}
      <div className="grid grid-cols-3 gap-2 font-heading font-black text-xs">
        <button
          onClick={() => handleSelectPreset(25)}
          className={`py-2.5 px-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
            selectedDuration === 25
              ? 'bg-[#0ABAB5] text-[#2B2118] border-[#2B2118] pop-shadow-sm scale-102 font-black'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          <span className="text-sm">📚 25 Phút</span>
          <span className="text-[10px] font-mono opacity-80">Chuẩn Pomodoro</span>
        </button>

        <button
          onClick={() => handleSelectPreset(50)}
          className={`py-2.5 px-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
            selectedDuration === 50
              ? 'bg-[#DFB2FA] text-[#2B2118] border-[#2B2118] pop-shadow-sm scale-102 font-black'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          <span className="text-sm">🎯 50 Phút</span>
          <span className="text-[10px] font-mono opacity-80">Tập Trung Sâu</span>
        </button>

        <button
          onClick={() => handleSelectPreset(5)}
          className={`py-2.5 px-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-0.5 ${
            selectedDuration === 5
              ? 'bg-[#CFE3DC] text-[#2B2118] border-[#2B2118] pop-shadow-sm scale-102 font-black'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
          }`}
        >
          <span className="text-sm">☕ 5 Phút</span>
          <span className="text-[10px] font-mono opacity-80">Nghỉ Giải Trí</span>
        </button>
      </div>

      {/* 3. Main Teal Pomodoro Oven/Timer Card */}
      <div className="bg-[#0ABAB5] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 text-white text-center space-y-4">
        {/* Active Task / Subject Title */}
        <div className="bg-black/20 p-2.5 rounded-2xl border border-white/30 max-w-sm mx-auto">
          {isEditingTask ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bakeryTaskTitle}
                onChange={(e) => setBakeryTaskTitle(e.target.value)}
                placeholder="Nhập môn học / nhiệm vụ (ví dụ: Ôn Toán HK1)..."
                className="w-full bg-white text-[#2B2118] px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#2B2118] focus:outline-hidden"
              />
              <button
                onClick={() => setIsEditingTask(false)}
                className="bg-[#2B2118] text-white text-xs px-3 py-1.5 rounded-xl font-black shrink-0"
              >
                Lưu
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTask(true)}
              className="flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
              title="Bấm để chỉnh sửa tên bài học"
            >
              <BookOpen size={14} className="text-amber-300 shrink-0" />
              <span className="text-xs sm:text-sm font-heading font-black text-white truncate">
                Môn học: {bakeryTaskTitle || 'Ôn tập học kỳ (Bấm để đổi)'}
              </span>
            </div>
          )}
        </div>

        {/* Big Crisp Countdown Timer */}
        <div className="space-y-1 py-1">
          <div className="font-heading font-black text-6xl sm:text-7xl tracking-tight text-white leading-none font-mono drop-shadow-sm">
            {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
          </div>
          <p className="text-xs font-bold text-white/90">
            {isPomodoroRunning ? '⚡ Đang trong phiên tập trung!' : '⏸️ Nhấn Bắt đầu để bắt đầu đếm ngược'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden border border-white/40 p-0.5">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-white rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono font-bold text-white/90 px-1">
            <span>Tiến độ: {progressPercent}%</span>
            <span>{selectedDuration} Phút</span>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {isPomodoroRunning ? (
            <button
              onClick={pausePomodoro}
              className="py-3 px-4 bg-white hover:bg-stone-100 text-[#0ABAB5] font-heading font-black text-sm rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press flex items-center justify-center gap-2 transition-all"
            >
              <Pause size={18} />
              <span>Tạm Dừng</span>
            </button>
          ) : (
            <button
              onClick={startPomodoro}
              className="py-3 px-4 bg-[#2B2118] hover:bg-[#3d3023] text-white font-heading font-black text-sm rounded-2xl border-[3px] border-[#2B2118] pop-shadow btn-press flex items-center justify-center gap-2 transition-all"
            >
              <Play size={18} className="text-amber-300" />
              <span>Bắt Đầu Tập Trung</span>
            </button>
          )}

          <button
            onClick={resetPomodoro}
            className="py-3 px-4 bg-white/20 hover:bg-white/30 text-white font-heading font-black text-sm rounded-2xl border-2 border-white/40 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw size={16} />
            <span>Đặt Lại</span>
          </button>
        </div>
      </div>

      {/* 4. Reward Callout Card */}
      <div className="bg-[#DFB2FA]/30 border-2 border-[#DFB2FA] rounded-3xl p-4 space-y-2 text-[#2B2118]">
        <div className="flex items-center gap-2 font-heading font-black text-sm text-[#2B2118]">
          <Sparkles size={18} className="text-[#2B2118]" />
          <span>Phần Thưởng Học Tập Pomodoro:</span>
        </div>
        <ul className="space-y-1.5 text-xs font-semibold text-stone-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-[#0ABAB5] shrink-0 mt-0.5" />
            <span>Hoàn thành phiên 25 phút nhận ngay <strong>+30 ⭐ Sao thưởng</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-[#0ABAB5] shrink-0 mt-0.5" />
            <span>Dùng Sao thưởng để đổi voucher trà sữa &amp; quà tặng ở trang Đổi Thưởng!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
