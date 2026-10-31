import React, { useEffect, useState } from 'react';
import { useDeviceVoiceInput } from '../hooks/useDeviceVoiceInput';
import { useApp } from '../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  CalendarPlus,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    volume,
    frequencies,
    error,
    startListening,
    stopListening,
    clearTranscript,
    hasSpeechSupport,
  } = useDeviceVoiceInput();

  const { addEvent, journalText, setJournalText, showToast, setCurrentTab } = useApp();
  const [copied, setCopied] = useState(false);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      clearTranscript();
      startListening();
    } else {
      stopListening();
    }
  }, [isOpen, startListening, stopListening, clearTranscript]);

  const fullText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();

  // Action 1: Add as a weekly event
  const handleAddToCalendar = () => {
    if (!fullText) return;
    const title = fullText.length > 35 ? fullText.slice(0, 32) + '...' : fullText;
    addEvent({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      dayTime: 'Lên lịch bằng Giọng nói 🎙️',
      icon: '🎙️',
      type: 'custom',
    });
    showToast('Đã tạo thẻ sự kiện mới từ giọng nói của bạn! 📅✨');
    onClose();
    setCurrentTab('home');
  };

  // Action 2: Add into Journal
  const handleAddToJournal = () => {
    if (!fullText) return;
    const newText = journalText ? `${journalText}\n- ${fullText}` : fullText;
    setJournalText(newText);
    showToast('Đã đưa câu nói vào Trang Nhật Ký! 📓✨');
    onClose();
    setCurrentTab('journal');
  };

  // Action 3: Copy to clipboard
  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Đã sao chép câu nói vào bộ nhớ tạm! 📋');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F8EFE8] w-full max-w-md rounded-3xl border-[3px] border-[#2B2118] pop-shadow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#2B2118] p-4 text-white flex items-center justify-between border-b-[3px] border-[#2B2118]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#0ABAB5] text-[#2B2118] rounded-xl font-black">
              <Mic size={18} />
            </span>
            <div>
              <h3 className="font-heading font-black text-sm text-white flex items-center gap-1.5">
                <span>NÓI VÀO ỨNG DỤNG BẰNG MIC</span>
                <span className="text-amber-300">🎙️</span>
              </h3>
              <p className="text-[11px] text-stone-300">
                Sử dụng Micro thiết bị để trò chuyện hoặc nhập liệu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-[#2B2118]">
          {/* Central Pulsing Microphone Visualizer */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring matching real volume */}
              <div
                style={{
                  transform: `scale(${1 + volume / 100})`,
                  opacity: Math.max(0.15, volume / 100),
                }}
                className="absolute w-24 h-24 rounded-full bg-[#0ABAB5] transition-transform duration-75 pointer-events-none"
              />

              {/* Main Mic Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full border-[3px] border-[#2B2118] pop-shadow flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[#0ABAB5] text-white hover:scale-105'
                }`}
              >
                {isListening ? <Mic size={32} /> : <MicOff size={32} />}
              </button>
            </div>

            {/* Status text */}
            <div className="text-center space-y-0.5">
              <p className="font-heading font-black text-xs sm:text-sm text-[#2B2118]">
                {isListening ? 'Đang lắng nghe giọng của bạn...' : 'Đã tạm dừng nghe'}
              </p>
              <p className="text-[11px] text-stone-500">
                {isListening ? 'Hãy nói một câu rõ ràng vào mic máy tính hoặc điện thoại' : 'Chạm vào micro để tiếp tục nói'}
              </p>
            </div>

            {/* Live Audio Frequency Spectrum Waveform */}
            <div className="w-full bg-[#2B2118] rounded-2xl p-2.5 border-2 border-[#2B2118] pop-shadow-sm flex items-end justify-between gap-1 h-14">
              {frequencies.map((f, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.max(12, f)}%` }}
                  className="flex-1 bg-gradient-to-t from-[#0ABAB5] to-[#DFB2FA] rounded-full transition-all duration-75"
                />
              ))}
            </div>
          </div>

          {/* Error notice if microphone is blocked */}
          {error && (
            <div className="bg-rose-100 border-2 border-rose-300 rounded-2xl p-2.5 flex items-start gap-2 text-rose-800 text-[11px]">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Real-time transcribed text display */}
          <div className="bg-white rounded-2xl border-2 border-[#2B2118] p-3.5 space-y-2 pop-shadow-sm min-h-[90px] flex flex-col justify-between">
            <div>
              <span className="font-heading font-bold text-[10.5px] text-stone-500 uppercase tracking-wider block">
                Văn bản thu được từ Micro:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#2B2118] mt-1 leading-relaxed">
                {fullText || (
                  <span className="text-stone-400 italic font-normal">
                    "Âm thanh từ giọng nói của bạn sẽ xuất hiện ở đây theo thời gian thực..."
                  </span>
                )}
              </p>
            </div>

            {fullText && (
              <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                <span className="text-[10px] text-stone-500 font-mono">
                  {fullText.length} ký tự
                </span>
                <button
                  onClick={clearTranscript}
                  className="text-[10px] text-stone-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Xóa</span>
                </button>
              </div>
            )}
          </div>

          {/* Action buttons with the spoken text */}
          <div className="space-y-1.5 pt-1">
            <span className="font-heading font-bold text-[11px] text-stone-600 block">
              Dùng câu nói này để:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleAddToJournal}
                disabled={!fullText}
                className="p-2.5 bg-[#DFB2FA] hover:bg-[#d49ef5] disabled:opacity-50 text-[#2B2118] font-heading font-black text-xs rounded-xl border-2 border-[#2B2118] pop-shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <BookOpen size={13} />
                <span>Vào Nhật Ký</span>
              </button>

              <button
                onClick={handleAddToCalendar}
                disabled={!fullText}
                className="p-2.5 bg-[#0ABAB5] hover:bg-[#099994] disabled:opacity-50 text-white font-heading font-black text-xs rounded-xl border-2 border-[#2B2118] pop-shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <CalendarPlus size={13} />
                <span>Tạo Sự Kiện</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={!fullText}
                className="p-2.5 bg-[#F9DCC4] hover:bg-[#ffdfc4] disabled:opacity-50 text-[#2B2118] font-heading font-black text-xs rounded-xl border-2 border-[#2B2118] pop-shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                <span>{copied ? 'Đã Chép' : 'Sao Chép'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t-2 border-[#2B2118] flex items-center justify-between text-[11px] text-stone-600">
          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-[#0ABAB5]" />
            <span>Âm lượng mic: <strong>{volume}%</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-[#2B2118] font-bold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
