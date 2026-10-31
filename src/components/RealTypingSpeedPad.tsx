import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useRealTypingDetector } from '../hooks/useRealTypingDetector';
import {
  Keyboard,
  Gauge,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Sparkles,
  Flame,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const RealTypingSpeedPad: React.FC = () => {
  const {
    typingDetectorMode,
    setTypingDetectorMode,
    setTypingSpeed,
    setIsWarning,
    setAppInUse,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('Cùng buông điện thoại, kết nối đời thực!');

  const {
    stats,
    recentKeys,
    soundEnabled,
    setSoundEnabled,
    recordKeystroke,
    resetStats,
  } = useRealTypingDetector({
    enableGlobalListener: typingDetectorMode === 'real',
  });

  // Sync real typing stats to AppContext
  useEffect(() => {
    if (typingDetectorMode === 'real') {
      setTypingSpeed(stats.cpm);
      const isPhubbingWarning = stats.cpm >= 110;
      setIsWarning(isPhubbingWarning);
      if (stats.cpm > 140) {
        setAppInUse('Nhắn tin / Mạng Xã Hội');
      } else if (stats.cpm > 40) {
        setAppInUse('Soạn thảo ghi chú');
      } else {
        setAppInUse('Đang lắng nghe đối thoại');
      }
    }
  }, [stats.cpm, typingDetectorMode, setTypingSpeed, setIsWarning, setAppInUse]);

  const samplePrompts = [
    'Cùng buông điện thoại, kết nối đời thực!',
    'Hôm nay bạn cảm thấy thế nào? Kể mình nghe với!',
    'Không lướt mạng xã hội khi đang ngồi với bạn bè nhé!',
  ];

  // Visual speedometer calculation (0 to 300 CPM)
  const speedPercent = Math.min(100, Math.round((stats.cpm / 250) * 100));
  const isHighVelocity = stats.cpm >= 110;

  return (
    <div className="bg-[#1C1612] border-2 border-stone-700/80 rounded-2xl p-3.5 space-y-3 font-mono-code text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Keyboard size={16} className="text-[#0ABAB5]" />
          <span className="font-heading font-black text-xs text-white uppercase tracking-wider">
            Bộ Đo Tốc Độ Gõ Phím Thật
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0ABAB5]/20 text-[#0ABAB5] border border-[#0ABAB5]/40">
            Realtime Keystroke
          </span>
        </div>

        {/* Mode switch & sound toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Tắt âm thanh phím cơ' : 'Bật âm thanh gõ phím cơ'}
            className={`p-1.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-amber-400 text-stone-900 border-amber-300 font-bold'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          <div className="flex items-center bg-stone-900 rounded-xl p-0.5 border border-stone-700 text-[10px]">
            <button
              onClick={() => setTypingDetectorMode('real')}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                typingDetectorMode === 'real'
                  ? 'bg-[#0ABAB5] text-[#2B2118]'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Đo Thật
            </button>
            <button
              onClick={() => setTypingDetectorMode('simulation')}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                typingDetectorMode === 'simulation'
                  ? 'bg-amber-400 text-[#2B2118]'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Mô Phỏng
            </button>
          </div>
        </div>
      </div>

      {/* Main Meter Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metric 1: CPM (Ký tự / phút) */}
        <div className="bg-black/60 border border-stone-800 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-stone-400 text-[10px] flex items-center gap-1">
            <Gauge size={12} className="text-[#0ABAB5]" />
            <span>Tốc Độ Thật:</span>
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span
              className={`text-xl font-heading font-black transition-all ${
                isHighVelocity ? 'text-[#F4BAB3]' : 'text-[#0ABAB5]'
              }`}
            >
              {stats.cpm}
            </span>
            <span className="text-[10px] text-stone-400">CPM</span>
          </div>
          <span className="text-[10px] text-stone-300 font-bold">
            ~{stats.wpm} Từ/phút
          </span>
        </div>

        {/* Metric 2: Đỉnh cao Peak Speed */}
        <div className="bg-black/60 border border-stone-800 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-stone-400 text-[10px] flex items-center gap-1">
            <Flame size={12} className="text-amber-400" />
            <span>Đỉnh Cao Nhất:</span>
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-xl font-heading font-black text-amber-300">
              {stats.peakCpm}
            </span>
            <span className="text-[10px] text-stone-400">CPM</span>
          </div>
          <span className="text-[10px] text-stone-400">
            {stats.peakCpm > 180 ? '⚡ Siêu nhanh' : 'Ổn định'}
          </span>
        </div>

        {/* Metric 3: Phubbing status */}
        <div
          className={`border rounded-xl p-2.5 flex flex-col justify-between transition-colors ${
            isHighVelocity
              ? 'bg-[#401C1A] border-[#F4BAB3]/60 text-[#F4BAB3]'
              : 'bg-[#152B28] border-[#0ABAB5]/50 text-[#0ABAB5]'
          }`}
        >
          <span className="text-[10px] flex items-center gap-1 font-bold">
            {isHighVelocity ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
            <span>Đánh Giá:</span>
          </span>
          <div className="text-[11px] font-heading font-black leading-tight my-1">
            {isHighVelocity ? '⚠️ Lướt / Nhắn Tin' : '✅ Đang Tập Trung'}
          </div>
          <span className="text-[9px] opacity-80">
            {isHighVelocity ? '>110 CPM Phubbing' : 'Không bấm phím'}
          </span>
        </div>
      </div>

      {/* Speedometer Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-stone-400">Nhịp độ gõ thời gian thực:</span>
          <span
            className={`font-bold ${
              isHighVelocity ? 'text-[#F4BAB3]' : 'text-[#0ABAB5]'
            }`}
          >
            {speedPercent}% Công suất
          </span>
        </div>
        <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
          <div
            style={{ width: `${speedPercent}%` }}
            className={`h-full rounded-full transition-all duration-150 ${
              isHighVelocity ? 'bg-[#F4BAB3]' : 'bg-[#0ABAB5]'
            }`}
          />
        </div>
      </div>

      {/* Interactive Typing Test Box */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-stone-300 font-bold flex items-center gap-1">
            <Sparkles size={12} className="text-[#0ABAB5]" />
            <span>Gõ phím thật vào ô này (hoặc bất kỳ đâu trên màn hình):</span>
          </label>
          <button
            onClick={() => {
              setInputVal('');
              resetStats();
            }}
            className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} />
            <span>Làm mới</span>
          </button>
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            // Also trigger keystroke
            if (e.target.value.length > inputVal.length) {
              const lastChar = e.target.value.slice(-1);
              recordKeystroke(lastChar);
            }
          }}
          placeholder="Thử gõ nhanh một câu xem kim đo tốc độ thật giật nảy..."
          className="w-full px-3 py-2 bg-black/70 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0ABAB5] focus:ring-1 focus:ring-[#0ABAB5] transition-all font-mono"
        />

        {/* Quick prompt suggestions */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[10px] text-stone-500 shrink-0">Mẫu:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedPrompt(p);
                setInputVal(p);
                // Simulate quick typing batch
                p.split('').forEach((ch) => recordKeystroke(ch));
              }}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 shrink-0 transition-colors"
            >
              {p.slice(0, 18)}...
            </button>
          ))}
        </div>
      </div>

      {/* Live Keystroke Ribbon (Phím vừa gõ) */}
      <div className="pt-1 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 text-stone-400">
          <Zap size={11} className="text-[#0ABAB5]" />
          <span>Phím vừa bấm:</span>
        </div>

        <div className="flex items-center gap-1 overflow-hidden h-5">
          {recentKeys.length > 0 ? (
            recentKeys.map((k, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-600 text-white font-mono text-[9px] animate-in fade-in zoom-in duration-100"
              >
                {k.key}
              </span>
            ))
          ) : (
            <span className="text-stone-500 italic text-[10px]">Chờ phím bấm...</span>
          )}
        </div>
      </div>
    </div>
  );
};
