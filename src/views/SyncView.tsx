import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useMicrophoneLibrosa } from '../hooks/useMicrophoneLibrosa';
import { HomePhubbingPromptModal } from '../components/HomePhubbingPromptModal';
import { triggerHapticVibration } from '../services/nativeBridge';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export const SyncView: React.FC = () => {
  const {
    isWarning,
    syncPeers,
    phubbingPromptCount,
    maxReminderCount,
    incrementPromptCount,
    isExploreModeActive,
    pConv,
    setPConv,
    phoneState,
    isExemptStudyMode,
    fusionOutput,
    fusionConfig,
    showToast,
  } = useApp();

  const [isVoicePromptOpen, setIsVoicePromptOpen] = useState(false);
  const lastVoiceAlertTimeRef = useRef<number>(0);

  const {
    isMicActive,
    voiceDetected,
    liveVolumeDb,
    liveFrequencies,
    startMicrophone,
    stopMicrophone,
    error: micError,
  } = useMicrophoneLibrosa();

  // Feed live voice detection into Conversation probability (pConv)
  useEffect(() => {
    if (voiceDetected) {
      setPConv(0.92);
    } else {
      setPConv((prev) => Math.max(0.04, Math.round((prev * 0.96) * 100) / 100));
    }
  }, [voiceDetected, setPConv]);

  // Intelligently trigger alert modal ONLY when FusionEngine fires a HIGH level alert
  useEffect(() => {
    if (fusionOutput?.alert && fusionOutput?.level === 'high' && !isExploreModeActive) {
      const now = Date.now();
      if (now - lastVoiceAlertTimeRef.current > (fusionConfig.cooldown_s * 1000 || 60000)) {
        lastVoiceAlertTimeRef.current = now;
        triggerHapticVibration('warning');
        incrementPromptCount();
        setIsVoicePromptOpen(true);
      }
    }
  }, [fusionOutput, isExploreModeActive, incrementPromptCount, fusionConfig.cooldown_s]);

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* 1. TOP HEADER - TRUNG TÂM KẾT NỐI BẠN BÈ */}
      <div className="bg-[#2B2118] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 text-white space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0ABAB5] animate-ping" />
          <h2 className="font-heading font-black text-base uppercase tracking-wider text-white flex items-center gap-2">
            <span>TRUNG TÂM KẾT NỐI BẠN BÈ</span>
            <span className="text-xl">👥</span>
          </h2>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed font-medium">
          Mô hình YAMNet AI tự động phân tích tần số âm thanh hội thoại xung quanh để bảo vệ cự ly tương tác mặt-đối-mặt.
        </p>
      </div>

      {/* 2. TRẠNG THÁI HIỆN DIỆN VÀ TRÒ CHUYỆN */}
      <div className="bg-[#2B2118] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 text-white space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className="font-heading font-black text-sm sm:text-base text-white">
              Trạng Thái Hội Thoại Nhóm
            </h3>
          </div>
          <span
            className={`text-xs font-heading font-black px-3 py-1 rounded-full border ${
              isExemptStudyMode
                ? 'bg-[#CFE3DC] text-[#2B2118] border-[#2B2118]'
                : pConv < 0.70
                ? 'bg-stone-700 text-stone-200 border-stone-600'
                : isWarning
                ? 'bg-[#F4BAB3] text-[#2B2118] border-[#2B2118] animate-pulse'
                : 'bg-[#0ABAB5] text-[#2B2118] border-[#2B2118]'
            }`}
          >
            {isExemptStudyMode
              ? '📚 Đang Học Nhóm (Miễn Trừ)'
              : pConv < 0.70
              ? '🍃 Không Gian Yên Tĩnh'
              : isWarning
              ? '⚠️ Cần Tương Tác Mắt Về Bạn Bè'
              : '✅ Đang Gắn Kết Trực Tiếp'}
          </span>
        </div>

        {/* 4 Summary Tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Tile 1: YAMNet Acoustic Detection */}
          <div className="bg-black/40 border border-stone-800 rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base">{pConv >= 0.70 ? '🗣️' : '🍃'}</span>
              <span className="text-[10px] font-mono font-bold text-[#0ABAB5]">AI YAMNet</span>
            </div>
            <div className="text-[11px] text-stone-400 font-medium">Cuộc hội thoại xung quanh:</div>
            <div className="font-heading font-black text-xs text-white">
              {pConv >= 0.70
                ? `Có đối thoại (${Math.round(pConv * 100)}%)`
                : `Yên tĩnh (${Math.round(pConv * 100)}%)`}
            </div>
          </div>

          {/* Tile 2: Nearby Friends */}
          <div className="bg-black/40 border border-stone-800 rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base">👥</span>
              <span className="text-[10px] font-mono font-bold text-[#DFB2FA]">Cùng Bàn</span>
            </div>
            <div className="text-[11px] text-stone-400 font-medium">Bạn bè ở gần:</div>
            <div className="font-heading font-black text-xs text-white">
              {syncPeers.length} người đang ngồi cạnh
            </div>
          </div>

          {/* Tile 3: Environment Context */}
          <div className="bg-black/40 border border-stone-800 rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base">☕</span>
              <span className="text-[10px] font-mono font-bold text-amber-300">Bối Cảnh</span>
            </div>
            <div className="text-[11px] text-stone-400 font-medium">Không gian:</div>
            <div className="font-heading font-black text-xs text-white truncate">
              Quán Cà Phê / Trường Học
            </div>
          </div>

          {/* Tile 4: Phone Activity */}
          <div className="bg-black/40 border border-stone-800 rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base">{phoneState === 'active' ? '📱' : '✨'}</span>
              <span className="text-[10px] font-mono font-bold text-[#CFE3DC]">Thao Tác</span>
            </div>
            <div className="text-[11px] text-stone-400 font-medium">Sử dụng thiết bị:</div>
            <div className="font-heading font-black text-xs text-white">
              {isExemptStudyMode
                ? '🛡️ Đang Tra Cứu Bài'
                : phoneState === 'active'
                ? 'Đang bấm máy'
                : 'Đang để máy trên bàn ✨'}
            </div>
          </div>
        </div>

        {/* Microphone Auto-Listen Toggle Bar */}
        <div className="bg-[#1C1612] border-2 border-stone-700/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={isMicActive ? stopMicrophone : startMicrophone}
              className={`flex items-center gap-2 text-xs font-heading font-black px-4 py-2.5 rounded-xl border-2 border-[#2B2118] transition-all pop-shadow-sm ${
                isMicActive
                  ? 'bg-[#0ABAB5] text-[#2B2118]'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Mic size={16} className={isMicActive ? 'text-[#2B2118] animate-pulse' : ''} />
              <span>{isMicActive ? '🎙️ Micro Đang Tự Động Lắng Nghe (Bật)' : '🎙️ Bật Tự Động Nhận Diện Âm Thanh'}</span>
            </button>

            {isMicActive && (
              <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-xl border border-stone-800 text-xs font-mono">
                <Volume2 size={13} className="text-[#0ABAB5]" />
                <span className="font-bold text-[#0ABAB5]">{liveVolumeDb.toFixed(1)} dB</span>
                {voiceDetected && (
                  <span className="ml-1 text-[10px] font-bold text-[#DFB2FA] animate-pulse">
                    • Có tiếng nói 🗣️
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sound wave visualizer when active */}
          {isMicActive && (
            <div className="bg-black/60 border border-stone-800 rounded-xl p-2 flex items-end justify-between h-10 gap-[2px] overflow-hidden">
              {liveFrequencies.slice(0, 20).map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.max(12, h)}%` }}
                  className={`w-full rounded-full transition-all duration-75 ${
                    h > 65 ? 'bg-[#F4BAB3]' : 'bg-[#0ABAB5]'
                  }`}
                />
              ))}
            </div>
          )}

          {micError && (
            <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl p-2">
              👉 Hãy cấp quyền Microphone trên trình duyệt để tự động nhận diện đối thoại nhé!
            </div>
          )}
        </div>
      </div>

      {/* 3. DANH SÁCH BẠN BÈ ĐANG CÙNG BÀN */}
      <div className="bg-white rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5">
        <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-2 mb-3">
          <span>👥</span> Danh Sách Bạn Bè Đang Cùng Ngồi Trò Chuyện
        </h3>

        <div className="space-y-2.5">
          {syncPeers.map((peer) => (
            <div
              key={peer.id}
              className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{peer.emoji}</span>
                <div>
                  <span className="font-heading font-black text-sm text-[#2B2118] block leading-tight">
                    {peer.name}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Cự ly cản sóng ~1.2m
                  </span>
                </div>
              </div>

              {peer.status === 'focused' ? (
                <div className="bg-[#CFE3DC] text-[#2B2118] text-xs font-black px-3 py-1.5 rounded-2xl border-2 border-[#2B2118] flex items-center gap-1 pop-shadow-sm">
                  <CheckCircle2 size={13} className="text-emerald-700" />
                  <span>Đã cất máy ✓</span>
                </div>
              ) : (
                <div className="bg-[#F4BAB3] text-[#2B2118] text-xs font-black px-3 py-1.5 rounded-2xl border-2 border-[#2B2118] flex items-center gap-1 pop-shadow-sm animate-pulse">
                  <span>📱</span>
                  <span>Đang lướt máy...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Watchdog Modal */}
      <HomePhubbingPromptModal
        isOpen={isVoicePromptOpen}
        onClose={() => setIsVoicePromptOpen(false)}
        triggerType="voice"
      />
    </div>
  );
};
