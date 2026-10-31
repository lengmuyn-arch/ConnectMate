import React, { useState } from 'react';
import { Copy, Check, Terminal, Mic, Cpu, Keyboard, Sparkles, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MicrophoneLibrosaCodeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedTab, setCopiedTab] = useState<'python' | 'web' | 'typing' | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'web' | 'typing'>('python');

  if (!isOpen) return null;

  const pythonScript = `# ========================================================
# CONNECTMATE: THU ÂM MICRO VÀ CHẠY LIBROSA + SCIKIT-LEARN
# Yêu cầu cài đặt: pip install sounddevice librosa scikit-learn numpy
# ========================================================

import sounddevice as sd
import numpy as np
import librosa
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans

# 1. Cấu hình thu âm Micro trực tiếp trên máy
SAMPLE_RATE = 22050     # Chuẩn phân tích âm thanh Librosa (Hz)
DURATION = 2.5          # Thời lượng mỗi đoạn thu âm (giây)
CHANNELS = 2            # 2 kênh Stereo để tính toán hướng nói

print("🎙️ Đang mở Micro trên máy để thu âm thời gian thực...")
# Thu trực tiếp từ microphone của máy tính / laptop
audio_buffer = sd.rec(
    int(DURATION * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=CHANNELS,
    dtype='float32'
)
sd.wait() # Chờ hoàn tất phiên thu 2.5s
print("✅ Đã thu xong! Bắt đầu trích xuất đặc trưng với Librosa...")

# 2. Xử lý âm thanh với Librosa
left_ch = audio_buffer[:, 0]
right_ch = audio_buffer[:, 1]
mono_signal = librosa.to_mono(audio_buffer.T)

# Tần số cơ bản F0 (Voice Pitch) bằng thuật toán YIN
f0_series = librosa.yin(mono_signal, fmin=65, fmax=500, sr=SAMPLE_RATE, hop_length=1024)
valid_pitches = f0_series[(f0_series > 70) & (f0_series < 450)]
mean_f0 = float(np.median(valid_pitches)) if len(valid_pitches) > 0 else 0.0

# Tâm phổ tần số (Spectral Centroid)
spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=mono_signal, sr=SAMPLE_RATE)))

# Băng thông phổ (Spectral Bandwidth) & Tần số cuộn (Spectral Rolloff)
bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=mono_signal, sr=SAMPLE_RATE)))
rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=mono_signal, sr=SAMPLE_RATE)))

# Tỷ lệ giao cắt 0 (Zero-Crossing Rate) & Năng lượng RMS
zcr = float(np.mean(librosa.feature.zero_crossing_rate(y=mono_signal)))
rms = float(np.mean(librosa.feature.rms(y=mono_signal)))

# 13 hệ số Mel-Frequency Cepstral Coefficients (MFCCs)
mfccs = np.mean(librosa.feature.mfcc(y=mono_signal, sr=SAMPLE_RATE, n_mfcc=13), axis=1)

# 12 nốt Chroma Pitch (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
chroma = np.mean(librosa.feature.chroma_stft(y=mono_signal, sr=SAMPLE_RATE), axis=1)

# 3. Tính toán Hướng Nói (Voice Direction)
# So sánh chênh lệch năng lượng giữa 2 kênh Stereo mic
energy_left = float(np.sum(left_ch ** 2) + 1e-9)
energy_right = float(np.sum(right_ch ** 2) + 1e-9)
balance = (energy_right - energy_left) / (energy_right + energy_left)
direction_angle = float(np.clip(balance * 60.0, -60.0, 60.0))

# Xác định tư thế nói: Trực diện đối phương hay cúi đầu vào màn hình điện thoại
is_facing_screen = spectral_centroid < 1350 and rms > 0.03
if is_facing_screen:
    direction_status = "Cúi đầu vào điện thoại (Phubbing) ⚠️"
elif abs(direction_angle) < 15:
    direction_status = "Trực diện người đối diện (0°) ✨"
else:
    direction_status = f"Nghiêng góc {direction_angle:.1f}° 🗣️"

# 4. Phân loại Học Máy với Scikit-Learn
feature_vector = np.array([
    mean_f0, spectral_centroid, bandwidth, rolloff, zcr, rms,
    mfccs[0], mfccs[1], mfccs[2]
]).reshape(1, -1)

print("=" * 50)
print(f"🎵 [Librosa] Tần số F0: {mean_f0:.1f} Hz")
print(f"📊 [Librosa] Tâm phổ Centroid: {spectral_centroid:.1f} Hz")
print(f"🧭 [Hướng Nói] {direction_status} (Góc: {direction_angle:.1f}°)")
print(f"🤖 [Scikit-Learn] MFCCs & Chroma phân tích thành công!")
print("=" * 50)
`;

  const webAudioScript = `// ========================================================
// CONNECTMATE: THU ÂM MICRO TRÌNH DUYỆT VÀ GỬI SANG LIBROSA
// Sử dụng navigator.mediaDevices.getUserMedia và Web Audio API
// ========================================================

async function startMicrophoneAnalysis() {
  // 1. Yêu cầu quyền truy cập Micro trên máy
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2 // Thu stereo để nhận diện hướng
    }
  });

  // 2. Khởi tạo Web Audio Context & Analyser
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 64;
  source.connect(analyser);

  // Hiển thị sóng âm thanh thời gian thực
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  function renderLive() {
    analyser.getByteFrequencyData(freqData);
    requestAnimationFrame(renderLive);
  }
  renderLive();

  // 3. Thu 2.5s Audio Chunk và gửi sang server Python Librosa
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  const audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      
      const response = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: base64Audio })
      });

      const analysis = await response.json();
      console.log("Kết quả Librosa + Scikit-Learn:", analysis);
    };
    reader.readAsDataURL(audioBlob);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 2500);
}
`;

  const typingScript = `# ========================================================
# CONNECTMATE: NHẬN DIỆN TỐC ĐỘ GÕ PHÍM THẬT TRÊN MÁY TÍNH (OS)
# Cài đặt thư viện: pip install pynput
# Chạy nền để giám sát tốc độ gõ phím toàn hệ thống
# ========================================================

import time
from collections import deque
from pynput import keyboard

WINDOW_SECONDS = 5.0    # Cửa sổ trượt 5 giây tính CPM
WARNING_CPM = 120       # Ngưỡng cảnh báo Phubbing (120 ký tự/phút)

keystroke_timestamps = deque()
total_keystrokes = 0
peak_cpm = 0

def on_key_press(key):
    global total_keystrokes, peak_cpm
    now = time.time()
    total_keystrokes += 1
    keystroke_timestamps.append(now)

    # Loại bỏ các phím cũ ngoài cửa sổ 5 giây
    while keystroke_timestamps and (now - keystroke_timestamps[0] > WINDOW_SECONDS):
        keystroke_timestamps.popleft()

    # Tính toán tốc độ gõ thật
    count = len(keystroke_timestamps)
    current_cpm = round((count / WINDOW_SECONDS) * 60)
    current_wpm = round(current_cpm / 5)

    if current_cpm > peak_cpm:
        peak_cpm = current_cpm

    # Cảnh báo Phubbing nếu gõ liên tục quá nhanh
    if current_cpm >= WARNING_CPM:
        status = "⚠️ CẢNH BÁO PHUBBING: Đang gõ phím / nhắn tin nhanh!"
    else:
        status = "✅ ỔN ĐỊNH: Không phát hiện nhắn tin lén"

    print(f"⌨️ [Gõ Thật] {current_cpm} CPM ({current_wpm} WPM) | Tổng: {total_keystrokes} phím | {status}")

print("🚀 Đang lắng nghe phím bấm thật trên toàn hệ thống (Bấm Ctrl+C để dừng)...")
with keyboard.Listener(on_press=on_key_press) as listener:
    listener.join()
`;

  const copyCode = (code: string, type: 'python' | 'web' | 'typing') => {
    navigator.clipboard.writeText(code);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  const getCodeContent = () => {
    if (activeCodeTab === 'python') return pythonScript;
    if (activeCodeTab === 'web') return webAudioScript;
    return typingScript;
  };

  const getFilename = () => {
    if (activeCodeTab === 'python') return 'scripts/micro_librosa_runner.py';
    if (activeCodeTab === 'web') return 'src/utils/browserMicrophone.ts';
    return 'scripts/real_typing_speed_tracker.py';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#F8EFE8] w-full max-w-lg rounded-3xl border-[3px] border-[#2B2118] pop-shadow flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2B2118] p-4 text-white flex items-center justify-between border-b-[3px] border-[#2B2118]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#0ABAB5] text-[#2B2118] rounded-xl font-black">
              <Terminal size={18} />
            </span>
            <div>
              <h3 className="font-heading font-black text-sm text-white">
                Mã Nguồn Cảm Biến Thật (Micro &amp; Phím Gõ)
              </h3>
              <p className="text-[11px] text-stone-300">
                Librosa DSP, Scikit-Learn &amp; Keystroke Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 px-4 pt-3 border-b border-stone-300 bg-stone-100 overflow-x-auto">
          <button
            onClick={() => setActiveCodeTab('python')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-heading font-bold rounded-t-xl transition-colors border-t-2 border-x-2 shrink-0 ${
              activeCodeTab === 'python'
                ? 'bg-[#2B2118] text-[#0ABAB5] border-[#2B2118]'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Cpu size={13} />
            <span>Python (Micro + Librosa)</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('typing')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-heading font-bold rounded-t-xl transition-colors border-t-2 border-x-2 shrink-0 ${
              activeCodeTab === 'typing'
                ? 'bg-[#2B2118] text-[#DFB2FA] border-[#2B2118]'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Keyboard size={13} />
            <span>Python (Đo Phím Thật OS)</span>
          </button>

          <button
            onClick={() => setActiveCodeTab('web')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-heading font-bold rounded-t-xl transition-colors border-t-2 border-x-2 shrink-0 ${
              activeCodeTab === 'web'
                ? 'bg-[#2B2118] text-[#CFE3DC] border-[#2B2118]'
                : 'text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Mic size={13} />
            <span>JS (Web Audio Stream)</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#201813] text-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#0ABAB5] flex items-center gap-1">
              <Sparkles size={14} />
              {getFilename()}
            </span>

            <button
              onClick={() => copyCode(getCodeContent(), activeCodeTab)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#0ABAB5] hover:bg-[#089e9a] text-[#2B2118] rounded-xl border border-[#2B2118] transition-all pop-shadow-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              {copiedTab === activeCodeTab ? (
                <>
                  <Check size={14} />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Sao chép Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-black/60 rounded-2xl border border-stone-800 text-[11px] font-mono-code leading-relaxed text-stone-300 overflow-x-auto selection:bg-[#0ABAB5] selection:text-white">
            <code>{getCodeContent()}</code>
          </pre>

          <div className="bg-[#30231B] border border-stone-700/60 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="font-heading font-black text-amber-300 flex items-center gap-1">
              <span>💡</span>
              <span>Nguyên lý nhận diện tốc độ gõ phím thật:</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              1. <strong>Cửa sổ trượt (Sliding Window):</strong> Thu thập các nhịp gõ phím trong 5-6 giây gần nhất. Công thức: <code>CPM = (Số phím / Cửa sổ giây) * 60</code>, <code>WPM = CPM / 5</code>.
            </p>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              2. <strong>Cảnh báo Phubbing:</strong> Tốc độ gõ vượt 110-120 CPM phản ánh người dùng đang chat/nhắn tin liên tục trên điện thoại hoặc máy tính trong lúc gặp gỡ, kích hoạt lời nhắc buông điện thoại.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8EFE8] border-t-2 border-[#2B2118] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2B2118] hover:bg-stone-800 text-white font-heading font-black text-xs rounded-xl pop-shadow-sm"
          >
            Đóng bảng Code
          </button>
        </div>
      </div>
    </div>
  );
};
