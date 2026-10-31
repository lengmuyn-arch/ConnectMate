import React, { useState } from 'react';
import {
  X,
  Camera,
  Share2,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  Download,
  Heart,
  Award,
  Users,
  Calendar,
  Clock,
  MapPin,
  Smile,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MeetupMemoryPolaroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionDurationMinutes?: number;
  locationName?: string;
  focusScore?: number;
  starsEarned?: number;
  friendsList?: string[];
}

export const MeetupMemoryPolaroidModal: React.FC<MeetupMemoryPolaroidModalProps> = ({
  isOpen,
  onClose,
  sessionDurationMinutes = 45,
  locationName = 'Quán Cà Phê (Highlands Coffee)',
  focusScore = 95,
  starsEarned = 35,
  friendsList = ['Linh 🌸', 'Hoàng 🦖', 'Phương ✨', 'Bạn 🌟'],
}) => {
  const { addStars, showToast, saveJournalEntry, setJournalText, journalText } = useApp();

  const [personalQuote, setPersonalQuote] = useState('Buổi gặp mặt không điện thoại ấm áp và nhiều tiếng cười nhất tuần!');
  const [copied, setCopied] = useState(false);
  const [isSavedToJournal, setIsSavedToJournal] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState('✨');

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedCardText = `📸 [CONNECTMATE - THẺ KỶ NIỆM BUỔI HẸN GẮN KẾT]
------------------------------------------------
📍 Địa điểm: ${locationName}
⏱️ Thời gian trò chuyện chất lượng: ${sessionDurationMinutes} phút
🗣️ Điểm tập trung mặt đối mặt: ${focusScore}% (0 lần bấm máy)
👥 Bạn bè cùng bàn: ${friendsList.join(', ')}
⭐ Sao thưởng gặt hái: +${starsEarned} Sao
💭 Cảm nghĩ: "${personalQuote}"
📅 Ngày ghi nhận: ${todayStr}
------------------------------------------------
🌿 Cùng buông điện thoại, gắn kết đời thực với ConnectMate!`;

  const handleCopyCard = () => {
    navigator.clipboard.writeText(formattedCardText);
    setCopied(true);
    showToast('Đã sao chép tấm thẻ kỷ niệm vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToJournal = () => {
    const entry = `📸 [Kỷ Niệm Buổi Hẹn Offline - ${locationName}]\n- Thời gian: ${sessionDurationMinutes} phút\n- Cùng với: ${friendsList.join(', ')}\n- "${personalQuote}"`;
    setJournalText(journalText ? `${journalText}\n\n${entry}` : entry);
    saveJournalEntry();
    setIsSavedToJournal(true);
    addStars(10, 'Lưu kỷ niệm buổi gặp gỡ vào nhật ký');
    showToast('Đã lưu kỷ niệm vào Nhật Ký & nhận +10 ⭐!', 'success');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kỷ Niệm Buổi Hẹn ConnectMate',
          text: formattedCardText,
        });
      } catch (err) {
        handleCopyCard();
      }
    } else {
      handleCopyCard();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FAF8F5] border-[3px] border-[#2B2118] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col pop-shadow overflow-hidden text-[#2B2118]">
        {/* Header */}
        <div className="bg-[#2B2118] text-white p-3.5 sm:p-4 flex items-center justify-between border-b-[3px] border-[#2B2118]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <h3 className="font-heading font-black text-sm sm:text-base leading-tight">
                Tấm Thẻ Kỷ Niệm Buổi Hẹn Offline
              </h3>
              <p className="text-[11px] text-stone-300 font-medium">
                Ghi lại khoảnh khắc kết nối đời thực cùng bạn bè
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold"
          >
            <X size={18} />
          </button>
        </div>

        {/* Polaroid Card Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Retro Polaroid Container */}
          <div className="bg-white border-[3px] border-[#2B2118] rounded-3xl p-4 sm:p-5 pop-shadow space-y-3 relative overflow-hidden">
            {/* Top Pin Sticker */}
            <div className="flex items-center justify-between">
              <span className="bg-[#DFB2FA] text-[#2B2118] font-heading font-black text-[10.5px] px-2.5 py-0.5 rounded-full border border-[#2B2118] pop-shadow-sm flex items-center gap-1">
                <span>{selectedSticker}</span>
                <span>REAL-LIFE MEMORY</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500 font-bold">
                {todayStr}
              </span>
            </div>

            {/* Polaroid Photo Frame (Avatars + Sparkles) */}
            <div className="bg-gradient-to-br from-amber-100 via-rose-50 to-teal-100 border-2 border-[#2B2118] rounded-2xl p-4 text-center space-y-2 relative">
              <div className="flex items-center justify-center -space-x-2 py-2">
                {friendsList.map((f, idx) => (
                  <div
                    key={idx}
                    className="w-11 h-11 rounded-full bg-white border-2 border-[#2B2118] pop-shadow-sm flex items-center justify-center text-xl"
                    title={f}
                  >
                    {f.split(' ')[1] || '😊'}
                  </div>
                ))}
              </div>

              <div className="space-y-0.5">
                <h4 className="font-heading font-black text-base text-[#2B2118]">
                  Buổi Gặp Gỡ Không Điện Thoại ✨
                </h4>
                <p className="text-xs text-stone-700 font-bold flex items-center justify-center gap-1">
                  <MapPin size={13} className="text-[#0ABAB5]" />
                  <span>{locationName}</span>
                </p>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px] font-mono">
                <div className="bg-white/90 p-1.5 rounded-xl border border-stone-300">
                  <span className="text-stone-500 block text-[9px]">Thời gian:</span>
                  <span className="font-black text-[#2B2118]">{sessionDurationMinutes} phút</span>
                </div>
                <div className="bg-white/90 p-1.5 rounded-xl border border-stone-300">
                  <span className="text-stone-500 block text-[9px]">Tập trung:</span>
                  <span className="font-black text-emerald-700">{focusScore}%</span>
                </div>
                <div className="bg-white/90 p-1.5 rounded-xl border border-stone-300">
                  <span className="text-stone-500 block text-[9px]">Thưởng:</span>
                  <span className="font-black text-amber-600">+{starsEarned} ⭐</span>
                </div>
              </div>
            </div>

            {/* Editable Quote / Message */}
            <div className="space-y-1">
              <label className="text-[11px] font-heading font-bold text-stone-700 flex items-center gap-1">
                <span>✍️</span> Lời nhắn hoặc kỷ niệm của buổi hẹn:
              </label>
              <textarea
                value={personalQuote}
                onChange={(e) => setPersonalQuote(e.target.value)}
                rows={2}
                className="w-full text-xs font-medium p-2.5 bg-stone-50 rounded-xl border-2 border-stone-300 focus:border-[#2B2118] focus:outline-none transition-colors"
                placeholder="Ghi lại một câu nói vui hoặc cảm xúc của bạn..."
              />
            </div>

            {/* Sticker selector */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200">
              <span className="text-stone-500 font-bold text-[11px]">Chọn sticker:</span>
              <div className="flex gap-1.5">
                {['✨', '☕', '🥐', '🏆', '❤️', '🎉'].map((stk) => (
                  <button
                    key={stk}
                    onClick={() => setSelectedSticker(stk)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      selectedSticker === stk
                        ? 'bg-[#0ABAB5] text-white font-black scale-110'
                        : 'bg-stone-100 hover:bg-stone-200'
                    }`}
                  >
                    {stk}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#FAF8F5] border-t-2 border-stone-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSaveToJournal}
              disabled={isSavedToJournal}
              className={`px-3 py-2 rounded-xl text-xs font-heading font-black border-2 border-[#2B2118] transition-all pop-shadow-sm flex items-center gap-1.5 ${
                isSavedToJournal
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-[#CFE3DC] hover:bg-[#b8ded3] text-[#2B2118]'
              }`}
            >
              <BookOpen size={14} />
              <span>{isSavedToJournal ? 'Đã Lưu Nhật Ký ✓' : 'Lưu Vào Nhật Ký (+10 ⭐)'}</span>
            </button>

            <button
              onClick={handleCopyCard}
              className="px-3 py-2 bg-white hover:bg-stone-100 text-[#2B2118] font-heading font-bold text-xs rounded-xl border-2 border-[#2B2118] pop-shadow-sm transition-all flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Đã Sao Chép!' : 'Copy Thẻ'}</span>
            </button>
          </div>

          <button
            onClick={handleNativeShare}
            className="px-4 py-2 bg-[#2B2118] hover:bg-stone-800 text-white font-heading font-black text-xs rounded-xl pop-shadow-sm flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Share2 size={14} className="text-[#0ABAB5]" />
            <span>Chia Sẻ Kỷ Niệm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
