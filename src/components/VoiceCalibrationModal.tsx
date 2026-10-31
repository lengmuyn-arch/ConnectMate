import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, CheckCircle2, RefreshCw, Volume2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { triggerHapticVibration } from '../services/nativeBridge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCalibrationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { myVoiceProfile, calibrateMyVoiceProfile, resetMyVoiceProfile, showToast } = useApp();

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [livePitch, setLivePitch] = useState<number | null>(null);
  const [volume, setVolume] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const startCalibration = async () => {
    setIsRecording(true);
    setCountdown(3);
    setLivePitch(null);
    triggerHapticVibration('gentle');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const timeData = new Uint8Array(analyser.fftSize);
      const collectedPitches: number[] = [];

      const sampleRate = ctx.sampleRate || 44100;

      const analyzeFrame = () => {
        analyser.getByteTimeDomainData(timeData);

        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const val = (timeData[i] - 128) / 128;
          sumSq += val * val;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        const vol = Math.min(100, Math.round(rms * 400));
        setVolume(vol);

        if (vol > 15) {
          // Autocorrelation pitch calculation
          let bestOffset = -1;
          let maxCorr = 0;
          const minPeriod = Math.floor(sampleRate / 400);
          const maxPeriod = Math.floor(sampleRate / 80);

          for (let offset = minPeriod; offset <= maxPeriod; offset += 2) {
            let corr = 0;
            for (let i = 0; i < 256; i++) {
              corr += Math.abs((timeData[i] - 128) - (timeData[i + offset] - 128));
            }
            if (bestOffset === -1 || corr < maxCorr) {
              maxCorr = corr;
              bestOffset = offset;
            }
          }

          if (bestOffset > 0) {
            const f0 = Math.round((sampleRate / bestOffset) * 10) / 10;
            if (f0 >= 80 && f0 <= 380) {
              collectedPitches.push(f0);
              setLivePitch(f0);
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(analyzeFrame);
      };

      analyzeFrame();

      // Countdown timer
      let remaining = 3;
      const timer = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(timer);
          stopRecordingAndSave(collectedPitches);
        }
      }, 1000);
    } catch (err) {
      console.warn('Calibration mic error:', err);
      showToast('Không thể mở Micro để thu mẫu giọng. Vui lòng cho phép quyền Mic!', 'error');
      setIsRecording(false);
    }
  };

  const stopRecordingAndSave = (pitches: number[]) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsRecording(false);

    if (pitches.length > 0) {
      // Average pitch calculation
      const sum = pitches.reduce((a, b) => a + b, 0);
      const avgPitch = Math.round((sum / pitches.length) * 10) / 10;
      calibrateMyVoiceProfile(avgPitch, 'Chủ máy');
      triggerHapticVibration('warning');
    } else {
      // Fallback baseline pitch if quiet
      calibrateMyVoiceProfile(185.0, 'Chủ máy');
      triggerHapticVibration('gentle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFDF9] w-full max-w-md rounded-3xl border-[3px] border-[#2B2118] pop-shadow flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2B2118] p-3.5 text-white flex items-center justify-between border-b-[3px] border-[#2B2118]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#0ABAB5] text-[#2B2118] font-black">
              <Mic size={18} />
            </span>
            <div>
              <h3 className="font-heading font-black text-sm text-white">
                🎤 Đăng Ký Mẫu Giọng Chủ Máy
              </h3>
              <p className="text-[11px] text-stone-300">
                Phân biệt Giọng Bạn (Self-Talk) vs Giọng Người Khác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center font-bold text-sm"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-[#2B2118]">
          <div className="bg-[#F8EFE8] border border-[#2B2118]/20 rounded-2xl p-3.5 space-y-2">
            <h4 className="font-heading font-black text-xs text-[#2B2118] flex items-center gap-1.5">
              <Sparkles size={15} className="text-[#0ABAB5]" />
              <span>Giải quyết triệt để cảnh báo sai khi nói một mình!</span>
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Khi bạn tự đọc bài hoặc nói một mình trong lúc cầm điện thoại, AI sẽ đo tần số giọng nói và so sánh với Mẫu Giọng đã lưu để <strong>không bao giờ vô tình bắn cảnh báo Phubbing</strong>!
            </p>
          </div>

          {/* Current Calibration Status */}
          <div className={`p-4 rounded-2xl border-2 space-y-2 text-center transition-all ${
            myVoiceProfile.calibrated
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
              : 'bg-amber-50 border-amber-400 text-amber-900'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {myVoiceProfile.calibrated ? (
                <CheckCircle2 size={22} className="text-emerald-600" />
              ) : (
                <Mic size={22} className="text-amber-600 animate-bounce" />
              )}
              <h5 className="font-heading font-black text-sm">
                {myVoiceProfile.calibrated
                  ? `Đã Lưu Mẫu Giọng: ${myVoiceProfile.pitchHz} Hz`
                  : 'Chưa có Mẫu Giọng Chủ Máy'}
              </h5>
            </div>

            <p className="text-xs text-stone-600">
              {myVoiceProfile.calibrated
                ? `Tần số cao độ F0 được ghi nhớ ở mức ~${myVoiceProfile.pitchHz} Hz (Dung sai ±${myVoiceProfile.variance} Hz).`
                : 'Nhấn nút thu âm 3s bên dưới và nói 1 câu tự nhiên để hệ thống phân tích.'}
            </p>
          </div>

          {/* Recording interface */}
          {isRecording ? (
            <div className="bg-[#1C2623] border-2 border-[#0ABAB5] rounded-2xl p-4 text-center text-white space-y-3 animate-pulse">
              <div className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-heading font-black text-sm text-[#0ABAB5]">
                  Đang phân tích dải cao độ F0... ({countdown}s)
                </span>
              </div>

              <div className="text-3xl font-heading font-black text-amber-300">
                {livePitch ? `${livePitch} Hz` : 'Đang lắng nghe...'}
              </div>

              <p className="text-xs text-stone-300 italic">
                Hãy nói: &quot;ConnectMind ghi nhớ giọng tôi&quot;
              </p>

              {/* Volume bar */}
              <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700">
                <div
                  style={{ width: `${volume}%` }}
                  className="h-full bg-[#0ABAB5] transition-all duration-75"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={startCalibration}
                className="w-full py-3 px-4 bg-[#0ABAB5] hover:bg-[#089a96] text-[#2B2118] font-heading font-black text-sm rounded-2xl border-2 border-[#2B2118] pop-shadow transition-all flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5"
              >
                <Mic size={18} />
                <span>{myVoiceProfile.calibrated ? 'Thu Lại Mẫu Giọng (3 Giây)' : 'Bắt Đầu Thu Mẫu Giọng (3 Giây)'}</span>
              </button>

              {myVoiceProfile.calibrated && (
                <button
                  type="button"
                  onClick={resetMyVoiceProfile}
                  className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-heading font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Xóa Mẫu Giọng Đã Lưu</span>
                </button>
              )}
            </div>
          )}

          {/* Privacy info */}
          <div className="bg-[#1C2623] border border-[#0ABAB5]/40 rounded-xl p-2.5 flex items-center gap-2 text-white">
            <ShieldCheck size={16} className="text-[#0ABAB5] shrink-0" />
            <p className="text-[10.5px] text-stone-300 leading-snug">
              <strong className="text-[#0ABAB5]">Bảo mật tuyệt đối:</strong> Ứng dụng chỉ trích xuất tần số cao độ toán học (F0 Hz). <span className="text-amber-300">KHÔNG lưu file âm thanh hay ghi âm lời nói.</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8EFE8] border-t-2 border-[#2B2118] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#2B2118] hover:bg-stone-800 text-white font-heading font-black text-xs rounded-xl pop-shadow-sm"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
};
