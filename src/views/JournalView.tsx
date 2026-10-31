import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDeviceVoiceInput } from '../hooks/useDeviceVoiceInput';
import { MeetupMemoryPolaroidModal } from '../components/MeetupMemoryPolaroidModal';
import {
  Mic,
  MicOff,
  Volume2,
  Camera,
  Brain,
  ShieldCheck,
  TrendingDown,
  Award,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  BarChart2,
  UserCheck,
  Activity,
} from 'lucide-react';
import { BehaviorSeverity } from '../types';

export const JournalView: React.FC = () => {
  const {
    journalText,
    setJournalText,
    saveJournalEntry,
    aiReportState,
    toggleAiReportState,
    journalSavedToday,
    myVoiceProfile,
    habitMemory,
    fusionOutput,
    showToast,
  } = useApp();

  const [isPolaroidModalOpen, setIsPolaroidModalOpen] = useState(false);

  // Selected behavior severity level (3 levels: light | moderate | heavy)
  const [userSeverity, setUserSeverity] = useState<BehaviorSeverity>('light');

  const {
    isListening,
    transcript,
    interimTranscript,
    volume,
    startListening,
    stopListening,
    clearTranscript,
  } = useDeviceVoiceInput();

  // Sync spoken transcript into journal text
  useEffect(() => {
    if (transcript) {
      const updated = journalText ? `${journalText} ${transcript}`.trim() : transcript;
      setJournalText(updated);
      clearTranscript();
    }
  }, [transcript, journalText, setJournalText, clearTranscript]);

  // Weekly bar data matching app design
  const weeklyData = [
    { day: 'T2', percent: 85 },
    { day: 'T3', percent: 70 },
    { day: 'T4', percent: 62 },
    { day: 'T5', percent: 88 },
    { day: 'T6', percent: 78 },
    { day: 'T7', percent: 92 },
    { day: 'CN', percent: 80 },
  ];

  const getBarColor = (percent: number) => {
    if (percent >= 75) return '#0ABAB5'; // Teal
    if (percent >= 50) return '#DFB2FA'; // Purple
    return '#F4BAB3'; // Pink
  };

  // 3-Level Behavioral Personalization Config
  const SEVERITY_CONFIG: Record<
    BehaviorSeverity,
    {
      title: string;
      badge: string;
      bgColor: string;
      borderColor: string;
      badgeColor: string;
      phubbingRatioRange: string;
      description: string;
      reductionRate: string;
      recommendations: string[];
      aiAction: string;
    }
  > = {
    light: {
      title: 'Mức Độ 1: Nhẹ (Tập Trung & Kết Nối Tốt 🌟)',
      badge: 'Mức Độ Nhẹ (Low Phubbing)',
      bgColor: 'bg-[#CFE3DC]/40 border-[#0ABAB5]',
      borderColor: 'border-[#0ABAB5]',
      badgeColor: 'bg-[#0ABAB5] text-[#2B2118]',
      phubbingRatioRange: '< 15% thời gian cuộc gọi/gặp mặt',
      description:
        'Bạn giữ tương tác mắt tốt khi bạn bè đối diện phát biểu. Liếc máy chỉ diễn ra ngắn gọn (<6s) để check thông báo khẩn cấp.',
      reductionRate: 'Đã giảm 58% hành vi lướt máy bất chợt!',
      aiAction: 'AI duy trì chế độ "Tự do khám phá" và chỉ nhẹ nhàng nhắc haptic rung siêu nhẹ.',
      recommendations: [
        'Tiếp tục duy trì thói quen úp mặt điện thoại xuống bàn khi bắt đầu cuộc trò chuyện.',
        'Sử dụng các trò chơi nhóm hoặc đố vui trong ứng dụng để khuấy động không khí.',
        'Bật Chế độ "Học nhóm" khi cả nhóm cùng tập trung tra cứu.',
      ],
    },
    moderate: {
      title: 'Mức Độ 2: Trung Bình (Thỉnh Thoảng Xao Nhãng ⚠️)',
      badge: 'Mức Độ Trung Bình (Moderate Phubbing)',
      bgColor: 'bg-[#DFB2FA]/30 border-[#DFB2FA]',
      borderColor: 'border-[#DFB2FA]',
      badgeColor: 'bg-[#DFB2FA] text-[#2B2118]',
      phubbingRatioRange: '15% – 35% thời gian trò chuyện',
      description:
        'Bạn có xu hướng lướt mạng xã hội hoặc trả lời tin nhắn dán mắt vào màn hình trong khi người đối diện đang trò chuyện.',
      reductionRate: 'Đã giảm 32% nhờ AI cảnh báo kịp thời!',
      aiAction: 'AI tự động rung haptic 150ms + gửi gợi ý chủ đề trò chuyện khi bạn lướt máy >7s.',
      recommendations: [
        'Đăng ký Mẫu Giọng Chủ Máy để AI phân biệt chính xác khi bạn nói chuyện vs nghe bạn bè nói.',
        'Bật thông báo hệ thống để AI nhắc nhở ngay khi chuyển sang ứng dụng giải trí.',
        'Đạt mốc 50 Sao thưởng mỗi ngày bằng cách úp máy liên tục 20 phút.',
      ],
    },
    heavy: {
      title: 'Mức Độ 3: Nặng (Phubbing Liên Tục & Dán Mắt Vào Máy 🚨)',
      badge: 'Mức Độ Nặng (Severe Phubbing)',
      bgColor: 'bg-[#F4BAB3]/40 border-[#F4BAB3]',
      borderColor: 'border-[#F4BAB3]',
      badgeColor: 'bg-[#F4BAB3] text-[#2B2118]',
      phubbingRatioRange: '> 40% thời gian hội thoại',
      description:
        'Tần suất thao tác vuốt lướt màn hình kéo dài liên tục ngay cả khi bạn bè đang trực tiếp đối thoại ở cự ly gần (BLE <1.2m).',
      reductionRate: 'Mục tiêu AI: Giảm 60% Phubbing nặng trong 7 ngày tới!',
      aiAction: 'AI bật chế độ giám sát chặt chẽ: Cảnh báo tức thì 7–10s + Pop-up nhắc nhở ưu tiên.',
      recommendations: [
        'Tận dụng tính năng "Ghi Nhớ Thói Quen AI" để nới lỏng đúng lúc khi học tập/khẩn cấp.',
        'Tạm thời khóa ứng dụng giải trí trong các cuộc họp mặt bạn bè.',
        'Rủ bạn bè cùng tham gia Mạng Cục Bộ BLE để cùng thi đua buông điện thoại.',
      ],
    },
  };

  const currentConfig = SEVERITY_CONFIG[userSeverity];

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* Title & Polaroid Action */}
      <div className="px-1 flex items-center justify-between gap-2 flex-wrap">
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2118] flex items-center gap-2">
          <span>Trang Nhật Ký &amp; Báo Cáo AI</span>
          <span className="text-2xl">📓</span>
        </h1>

        <button
          onClick={() => setIsPolaroidModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9DCC4] text-[#2B2118] border-2 border-[#2B2118] font-heading font-black text-xs hover:bg-[#ffe3cc] transition-all pop-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
          title="Tạo và lưu thẻ kỷ niệm gặp gỡ không điện thoại"
        >
          <Camera size={14} />
          <span>📸 Thẻ Kỷ Niệm Offline</span>
        </button>
      </div>

      {/* 1. Card: Tần Suất Không Phubbing Trong Tuần */}
      <div className="bg-white rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-heading font-black text-base text-[#2B2118] flex items-center gap-2">
            <span>📊</span> Tần Suất Giao Tiếp Không Phubbing
          </h3>
          <span className="text-xs font-mono font-bold bg-[#0ABAB5]/20 text-[#0ABAB5] px-2.5 py-0.5 rounded-full border border-[#0ABAB5]/40">
            Trung bình tuần: 79%
          </span>
        </div>

        {/* 7 Bars chart */}
        <div className="flex items-end justify-between gap-2 h-44 pt-6 px-1">
          {weeklyData.map((item) => {
            const barColor = getBarColor(item.percent);
            return (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                {/* Percentage label */}
                <span className="text-[11px] font-heading font-black text-stone-600">
                  {item.percent}%
                </span>

                {/* Vertical Bar */}
                <div
                  style={{
                    height: `${item.percent}%`,
                    backgroundColor: barColor,
                  }}
                  className="w-full max-w-[38px] rounded-xl border-2 border-[#2B2118] transition-all duration-700 pop-shadow-sm hover:scale-105"
                />

                {/* Day label */}
                <span className="text-xs font-heading font-black text-stone-700 mt-1">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Card: Gratitude Journal Notebook (Placed right after weekly chart) */}
      <div className="bg-white rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-semibold text-stone-700 italic leading-relaxed">
            "Hãy viết nhanh vài khoảnh khắc làm bạn bật cười hôm nay nhé... Cảm giác rời xa màn hình để chạm vào thực tế tuyệt ra sao?"
          </p>

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`shrink-0 px-3 py-1.5 rounded-xl border-2 border-[#2B2118] font-heading font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-[#DFB2FA] text-[#2B2118] hover:bg-[#d59cf5] pop-shadow-sm'
            }`}
            title="Dùng mic của thiết bị để nói nhật ký"
          >
            {isListening ? <Mic size={14} /> : <MicOff size={14} />}
            <span>{isListening ? 'Đang Nghe...' : 'Nói vào Mic'}</span>
          </button>
        </div>

        {/* Live Speaking Indicator when Mic is recording */}
        {isListening && (
          <div className="bg-[#2B2118] text-white p-2.5 rounded-xl border-2 border-[#2B2118] flex items-center justify-between gap-2 animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="text-[11px] font-bold text-stone-200">
                {interimTranscript ? `"...${interimTranscript}"` : 'Đang lắng nghe mic thiết bị của bạn...'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Volume2 size={12} className="text-[#0ABAB5]" />
              <span className="text-[10px] font-mono text-stone-300">{volume}%</span>
            </div>
          </div>
        )}

        {/* Textarea container */}
        <div className="relative">
          <textarea
            rows={4}
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Hãy viết nhanh vài khoảnh khắc làm bạn bật cười hôm nay nhé... 💖"
            className="w-full bg-[#EBF7F5] border-2 border-stone-300 focus:border-[#0ABAB5] rounded-2xl p-3.5 text-xs sm:text-sm text-[#2B2118] font-medium leading-relaxed resize-none focus:outline-hidden focus:ring-1 focus:ring-[#0ABAB5]"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-bold text-stone-500">
              {journalText.length}/500 ký tự
            </span>

            <button
              onClick={saveJournalEntry}
              className={`py-2 px-4 font-heading font-black text-xs sm:text-sm rounded-xl border-2 border-[#2B2118] transition-all btn-press flex items-center gap-1.5 ${
                journalSavedToday
                  ? 'bg-[#CFE3DC] text-[#2B2118] pop-shadow-sm'
                  : 'bg-[#0ABAB5] text-white pop-shadow'
              }`}
            >
              <span>{journalSavedToday ? '✓ Đã Lưu Nhật Ký' : 'Lưu Nhật Ký'}</span>
              {!journalSavedToday && <span>(+20 ⭐)</span>}
            </button>
          </div>
        </div>
      </div>

      {/* 3. CRITICAL SECTION: AI Báo Cáo Phân Loại Hành Vi Tự Động (Single Level) */}
      <div className="bg-white rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#2B2118] text-amber-300 flex items-center justify-center font-black pop-shadow-sm">
              <Brain size={22} />
            </div>
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg text-[#2B2118] flex items-center gap-2">
                <span>BÁO CÁO PHÂN LOẠI HÀNH VI CỦA AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0ABAB5] text-[#2B2118] font-bold">
                  Tự Động 100%
                </span>
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                Hệ thống tự phân loại mức độ thực tế dựa trên hoạt động giao tiếp và lướt máy của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Automated AI Classification Single Card */}
        <div className="p-4 rounded-2xl border-2 bg-[#DFB2FA]/30 border-[#DFB2FA] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-heading font-black text-sm sm:text-base text-[#2B2118]">
              <span>Mức Độ Đánh Giá: Trung Bình (Thỉnh Thoảng Xao Nhãng ⚠️)</span>
            </h4>
            <span className="text-xs font-heading font-black px-3 py-1 rounded-full border border-[#2B2118] bg-[#DFB2FA] text-[#2B2118]">
              AI Tự Phân Loại
            </span>
          </div>

          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
            Bạn có xu hướng lướt mạng xã hội hoặc trả lời tin nhắn dán mắt vào màn hình trong khi người đối diện đang trò chuyện (tỷ lệ 15% – 35% thời gian).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 font-mono">
            <div className="bg-white/80 p-2.5 rounded-xl border border-stone-400/60 flex items-center gap-2">
              <Activity size={16} className="text-[#0ABAB5] shrink-0" />
              <div>
                <span className="text-stone-500 block text-[10px]">Tỷ lệ lướt máy:</span>
                <strong className="text-[#2B2118]">15% – 35% hội thoại</strong>
              </div>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-stone-400/60 flex items-center gap-2">
              <TrendingDown size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-stone-500 block text-[10px]">Kết quả giảm thải AI:</span>
                <strong className="text-emerald-700">Đã giảm 32% nhờ AI!</strong>
              </div>
            </div>
          </div>

          {/* AI Strategy for this level */}
          <div className="bg-[#2B2118] text-white p-3 rounded-xl space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-heading font-black text-amber-300">
              <Zap size={14} />
              <span>Cơ chế ứng phó cá nhân hóa của AI:</span>
            </div>
            <p className="text-stone-200 text-[11.5px] leading-relaxed font-sans">
              AI tự động rung haptic 150ms + gửi gợi ý chủ đề trò chuyện khi bạn lướt máy &gt;7s.
            </p>
          </div>
        </div>

        {/* AI Behavioral Learning & Recommendations */}
        <div className="bg-[#EBF7F5] border-2 border-[#0ABAB5] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-black text-xs sm:text-sm text-[#2B2118] flex items-center gap-2">
              <UserCheck size={16} className="text-[#0ABAB5]" />
              <span>DỮ LIỆU CÁ NHÂN HÓA &amp; KHUYẾN NGHỊ</span>
            </h4>
            <span className="text-[10px] font-mono text-[#0ABAB5] font-bold">Tự Học Thích Ứng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-stone-300">
              <span className="text-[10px] text-stone-500 block font-mono">1. Giọng Chủ Máy:</span>
              <strong className="text-[#0ABAB5] block font-heading">
                {myVoiceProfile.calibrated ? `Đã lưu (${myVoiceProfile.pitchHz} Hz)` : ' Mức chuẩn'}
              </strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-stone-300">
              <span className="text-[10px] text-stone-500 block font-mono">2. Thói quen:</span>
              <strong className="text-[#DFB2FA] block font-heading">
                {habitMemory.learnedStudyHours.length > 0 ? `Khung giờ ${habitMemory.learnedStudyHours[0]}h` : 'Học nhóm'}
              </strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-stone-300">
              <span className="text-[10px] text-stone-500 block font-mono">3. Độ nhạy:</span>
              <strong className="text-emerald-600 block font-heading">
                {(habitMemory.adaptiveSensitivity * 100).toFixed(0)}%
              </strong>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-heading font-black text-[#2B2118] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#0ABAB5]" />
              <span>Khuyến nghị bám sát để giảm thải Phubbing:</span>
            </span>

            <ul className="space-y-1 text-xs text-stone-800 font-medium">
              <li className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-stone-300/80">
                <CheckCircle2 size={14} className="text-[#0ABAB5] shrink-0 mt-0.5" />
                <span>Đăng ký Mẫu Giọng Chủ Máy để AI phân biệt chính xác khi bạn nói chuyện vs nghe bạn bè nói.</span>
              </li>
              <li className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-stone-300/80">
                <CheckCircle2 size={14} className="text-[#0ABAB5] shrink-0 mt-0.5" />
                <span>Bật thông báo hệ thống để AI nhắc nhở ngay khi chuyển sang ứng dụng giải trí.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Meetup Memory Polaroid Card Modal */}
      <MeetupMemoryPolaroidModal
        isOpen={isPolaroidModalOpen}
        onClose={() => setIsPolaroidModalOpen(false)}
      />
    </div>
  );
};
