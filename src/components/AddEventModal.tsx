import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDeviceVoiceInput } from '../hooks/useDeviceVoiceInput';
import { Mic, MicOff } from 'lucide-react';

export const AddEventModal: React.FC = () => {
  const { isAddEventModalOpen, setIsAddEventModalOpen, addEvent } = useApp();

  const [title, setTitle] = useState('');
  const [day, setDay] = useState('Thứ Hai');
  const [time, setTime] = useState('09:00 AM');
  const [type, setType] = useState<'exam' | 'tea' | 'report' | 'custom'>('exam');
  const [isDeadline, setIsDeadline] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript,
  } = useDeviceVoiceInput();

  useEffect(() => {
    if (transcript) {
      setTitle(transcript.slice(0, 40));
      clearTranscript();
      stopListening();
    }
  }, [transcript, clearTranscript, stopListening]);

  if (!isAddEventModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const iconMap = {
      exam: '📝',
      tea: '🍿',
      report: '📚',
      custom: '✨',
    };

    const dayTime = isDeadline
      ? `${day} · Deadline ${time}`
      : `${day} · ${time}`;

    addEvent({
      title: title.slice(0, 40),
      dayTime,
      type,
      icon: iconMap[type],
      isDeadline,
    });

    setTitle('');
    setIsAddEventModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F8EFE8] w-full max-w-sm rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-6 text-[#2B2118] animate-pop-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-black text-xl flex items-center gap-2">
            <span>📌</span> Dán Thẻ Mới
          </h3>
          <button
            onClick={() => setIsAddEventModalOpen(false)}
            className="w-8 h-8 rounded-full border-2 border-[#2B2118] bg-white font-black hover:bg-stone-100 flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-600">
                Tên bài tập / sự kiện
              </label>
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`px-2 py-0.5 rounded-lg border border-[#2B2118] text-[10.5px] font-heading font-black flex items-center gap-1 transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[#DFB2FA] text-[#2B2118] hover:bg-[#d59cf5]'
                }`}
              >
                {isListening ? <Mic size={11} /> : <MicOff size={11} />}
                <span>{isListening ? 'Đang nghe...' : 'Nói vào Mic'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={40}
              placeholder={isListening ? 'Đang lắng nghe giọng của bạn...' : 'VD: Ôn tập môn Hóa học...'}
              value={isListening && interimTranscript ? interimTranscript : title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border-2 border-[#2B2118] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0ABAB5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-600 mb-1">
                Thứ trong tuần
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full bg-white border-2 border-[#2B2118] rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-hidden"
              >
                <option value="Thứ Hai">Thứ Hai</option>
                <option value="Thứ Ba">Thứ Ba</option>
                <option value="Thứ Tư">Thứ Tư</option>
                <option value="Thứ Năm">Thứ Năm</option>
                <option value="Thứ Sáu">Thứ Sáu</option>
                <option value="Thứ Bảy">Thứ Bảy</option>
                <option value="Chủ Nhật">Chủ Nhật</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-600 mb-1">
                Thời gian (12h)
              </label>
              <input
                type="text"
                placeholder="09:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white border-2 border-[#2B2118] rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-600 mb-1">
              Phân loại sticker
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('exam')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border-2 border-[#2B2118] ${
                  type === 'exam' ? 'bg-[#F4BAB3] pop-shadow-sm font-black' : 'bg-white'
                }`}
              >
                📝 Thi cử
              </button>
              <button
                type="button"
                onClick={() => setType('tea')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border-2 border-[#2B2118] ${
                  type === 'tea' ? 'bg-[#DFB2FA] pop-shadow-sm font-black' : 'bg-white'
                }`}
              >
                🍿 Đi chơi
              </button>
              <button
                type="button"
                onClick={() => setType('report')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border-2 border-[#2B2118] ${
                  type === 'report' ? 'bg-[#CFE3DC] pop-shadow-sm font-black' : 'bg-white'
                }`}
              >
                📚 Bài tập
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="deadlineCheck"
              checked={isDeadline}
              onChange={(e) => setIsDeadline(e.target.checked)}
              className="w-4 h-4 accent-[#0ABAB5] rounded-md border-2 border-[#2B2118]"
            />
            <label htmlFor="deadlineCheck" className="text-xs font-bold text-stone-800">
              Đánh dấu là mốc Deadline gấp
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0ABAB5] text-white font-heading font-black text-sm rounded-xl border-2 border-[#2B2118] pop-shadow btn-press mt-2"
          >
            + Dán Lên Bảng Công Việc
          </button>
        </form>
      </div>
    </div>
  );
};
