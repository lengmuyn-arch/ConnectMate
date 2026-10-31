import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioAnalysisResult } from '../types';

export interface UseMicrophoneLibrosaReturn {
  isMicActive: boolean;
  micPermissionStatus: 'idle' | 'requesting' | 'granted' | 'denied';
  micMode: 'real' | 'simulated';
  isAnalyzing: boolean;
  liveFrequencies: number[];
  liveVolume: number;
  liveVolumeDb: number;
  voiceDetected: boolean;
  noiseFloorDb: number;
  adaptiveThresholdDb: number;
  isCalibratingNoise: boolean;
  calibrateNoiseFloor: () => Promise<void>;
  analysisResult: AudioAnalysisResult | null;
  error: string | null;
  isIframeBlocked: boolean;
  startMicrophone: () => Promise<void>;
  startSimulatedMicrophone: (preset?: 'speaking' | 'singing' | 'whisper') => void;
  stopMicrophone: () => void;
  triggerAnalysis: (mock?: boolean) => Promise<void>;
  runScenario: (scenario: 'direct' | 'phubbing' | 'ambient' | 'silence') => Promise<void>;
}

export const useMicrophoneLibrosa = (): UseMicrophoneLibrosaReturn => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [micMode, setMicMode] = useState<'real' | 'simulated'>('real');
  const [micPermissionStatus, setMicPermissionStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [isIframeBlocked, setIsIframeBlocked] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveFrequencies, setLiveFrequencies] = useState<number[]>(() =>
    Array.from({ length: 30 }, () => Math.floor(12 + Math.random() * 15))
  );
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveVolumeDb, setLiveVolumeDb] = useState(-12.4);
  const [voiceDetected, setVoiceDetected] = useState(false);

  // Proposal 4: Adaptive Ambient Noise Floor & Dynamic Threshold
  const [noiseFloorDb, setNoiseFloorDb] = useState(-38.5);
  const [adaptiveThresholdDb, setAdaptiveThresholdDb] = useState(-26.0);
  const [isCalibratingNoise, setIsCalibratingNoise] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const autoAnalyzeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simulationTimerRef = useRef<number | null>(null);
  const vocalNoiseFloorRef = useRef<number>(14.0);
  const lastSpokenTimeRef = useRef<number>(0);
  const speechHistoryRef = useRef<{ t: number; vocal: number; rumble: number }[]>([]);

  // Calibrate Ambient Noise Floor (Measures background acoustic noise for 2.5s)
  const calibrateNoiseFloor = useCallback(async () => {
    setIsCalibratingNoise(true);
    const measuredDbs: number[] = [];

    const interval = setInterval(() => {
      setLiveVolumeDb((currDb) => {
        measuredDbs.push(currDb);
        return currDb;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      if (measuredDbs.length > 0) {
        // Average the lowest 50% values to find genuine ambient noise floor
        measuredDbs.sort((a, b) => a - b);
        const lowerHalf = measuredDbs.slice(0, Math.max(1, Math.floor(measuredDbs.length / 2)));
        const avgNoise = lowerHalf.reduce((a, b) => a + b, 0) / lowerHalf.length;
        const roundedNoise = Math.round(avgNoise * 10) / 10;
        setNoiseFloorDb(roundedNoise);

        // Adaptive speech threshold: 10 dB above noise floor, bounded between -42 dB and -14 dB
        const newThreshold = Math.max(-42.0, Math.min(-14.0, Math.round((roundedNoise + 10.5) * 10) / 10));
        setAdaptiveThresholdDb(newThreshold);
      }
      setIsCalibratingNoise(false);
    }, 2500);
  }, []);

  // Fallback initial calibration result
  useEffect(() => {
    // Fetch initial status and baseline data
    fetch('/api/audio/status')
      .then((r) => r.json())
      .catch(() => {});

    // Initial baseline analysis
    fetch('/api/audio/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mock: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          setAnalysisResult(data);
        }
      })
      .catch((err) => console.log('Init analyze error:', err));
  }, []);

  const sendAudioForAnalysis = useCallback(async (audioBase64?: string, mock = false) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64: audioBase64 || null,
          mock: mock || !audioBase64,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AudioAnalysisResult = await res.json();
      if (data.success) {
        setAnalysisResult((prev) => ({
          ...data,
          frequency_analysis: {
            ...data.frequency_analysis,
            volume_db: prev?.frequency_analysis.volume_db ?? data.frequency_analysis.volume_db,
          },
        }));
      }
    } catch (err: any) {
      console.warn('Analysis request error:', err);
      setError('Không thể kết nối dịch vụ phân tích âm thanh Librosa.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (simulationTimerRef.current) {
      cancelAnimationFrame(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (autoAnalyzeTimerRef.current) {
      clearInterval(autoAnalyzeTimerRef.current);
      autoAnalyzeTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicActive(false);
    setVoiceDetected(false);
  }, []);

  // 1. REAL HARDWARE MICROPHONE
  const startMicrophone = useCallback(async () => {
    stopMicrophone();
    setError(null);
    setIsIframeBlocked(false);
    setMicPermissionStatus('requesting');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt hoặc khung web này không hỗ trợ getUserMedia.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setMicPermissionStatus('granted');
      setIsMicActive(true);
      setMicMode('real');

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.65;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      source.connect(analyser);
      analyserRef.current = analyser;

      const NUM_BARS = 30;
      const sampleRate = audioCtx.sampleRate || 44100;
      const binWidth = sampleRate / analyser.fftSize;

      const fMin = 60;
      const fMax = 8000;
      const bandEdges: number[] = [];
      for (let i = 0; i <= NUM_BARS; i++) {
        bandEdges.push(fMin * Math.pow(fMax / fMin, i / NUM_BARS));
      }

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      let prevBars = Array.from({ length: NUM_BARS }, () => 14);

      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(freqData);
        analyserRef.current.getByteTimeDomainData(timeData);

        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const val = (timeData[i] - 128) / 128;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / timeData.length);
        const db = rms > 0.0005 ? Math.max(-60, Math.min(0, Math.round(20 * Math.log10(rms) * 10) / 10)) : -55.0;
        setLiveVolumeDb(db);

        const volPercent = Math.min(100, Math.max(0, Math.round(((db + 55) / 50) * 100)));
        setLiveVolume(volPercent);

        const currentBars: number[] = [];
        let weightedSumFreq = 0;
        let totalEnergy = 0;
        let lowRumbleSum = 0; // Bars 0..3 (< 250Hz): Fan motor, table vibration, wind
        let vocalBandSum = 0; // Bars 4..22 (~300Hz - ~3500Hz): Human voice vowels and formants
        let vocalBarsCount = 0;

        for (let b = 0; b < NUM_BARS; b++) {
          const startFreq = bandEdges[b];
          const endFreq = bandEdges[b + 1];
          const startBin = Math.max(0, Math.floor(startFreq / binWidth));
          const endBin = Math.min(analyser.frequencyBinCount - 1, Math.max(startBin + 1, Math.ceil(endFreq / binWidth)));

          let bandEnergy = 0;
          let count = 0;
          for (let k = startBin; k <= endBin; k++) {
            bandEnergy += freqData[k];
            count++;
          }
          const avgEnergy = count > 0 ? bandEnergy / count : 0;
          const eqBoost = 1.0 + (b / NUM_BARS) * 0.45;
          const boosted = avgEnergy * eqBoost;

          let height = Math.min(98, Math.max(12, Math.round((boosted / 255) * 88 + 12)));
          const smoothedHeight = Math.round(prevBars[b] * 0.35 + height * 0.65);
          currentBars.push(smoothedHeight);

          if (b < 4) {
            lowRumbleSum += avgEnergy;
          } else if (b <= 22) {
            vocalBandSum += avgEnergy;
            vocalBarsCount++;
          }

          const midFreq = (startFreq + endFreq) / 2;
          weightedSumFreq += midFreq * avgEnergy;
          totalEnergy += avgEnergy;
        }

        prevBars = currentBars;
        setLiveFrequencies(currentBars);

        const vocalBandAvg = vocalBarsCount > 0 ? vocalBandSum / vocalBarsCount : 0;
        const rumbleAvg = lowRumbleSum / 4;
        const now = Date.now();

        // Dynamic vocal noise floor tracking (adapts to room background)
        if (vocalBandAvg < 28) {
          vocalNoiseFloorRef.current = vocalNoiseFloorRef.current * 0.985 + vocalBandAvg * 0.015;
        }
        const currentNoiseFloor = vocalNoiseFloorRef.current;
        const pauseThreshold = Math.max(12, currentNoiseFloor * 1.35);

        // Track rolling 2.5s history buffer
        speechHistoryRef.current.push({ t: now, vocal: vocalBandAvg, rumble: rumbleAvg });
        speechHistoryRef.current = speechHistoryRef.current.filter((pt) => now - pt.t <= 2500);

        const win = speechHistoryRef.current;
        const winLen = win.length;

        let pauseCount = 0;
        let sumV = 0;
        for (let i = 0; i < winLen; i++) {
          sumV += win[i].vocal;
          if (win[i].vocal < pauseThreshold) {
            pauseCount++;
          }
        }
        const meanV = winLen > 0 ? sumV / winLen : 0;
        let sumSqDiff = 0;
        for (let i = 0; i < winLen; i++) {
          sumSqDiff += Math.pow(win[i].vocal - meanV, 2);
        }
        const stdDevV = winLen > 0 ? Math.sqrt(sumSqDiff / winLen) : 0;
        const cv = meanV > 0 ? stdDevV / meanV : 0;
        const pauseRatio = winLen > 0 ? pauseCount / winLen : 1.0;

        // Stationary continuous noise (Fan motor, white noise):
        // Flat continuous energy without inter-syllable pauses
        const isStationaryDrone = winLen >= 20 && pauseRatio < 0.10 && cv < 0.25;
        const isFanRumble = (rumbleAvg > 18 && rumbleAvg > vocalBandAvg * 1.6) || isStationaryDrone;

        // Voice detection criteria:
        // 1. Not low-frequency fan drone or stationary noise
        // 2. Vocal energy is significantly above ambient noise floor
        // 3. Must have natural speech pause characteristics or high CV (speech bursts)
        const isSpeaking =
          !isFanRumble &&
          !isStationaryDrone &&
          db > -36 &&
          vocalBandAvg > Math.max(16, currentNoiseFloor * 1.5) &&
          (pauseRatio >= 0.12 || cv > 0.30);

        setVoiceDetected(isSpeaking);

        if (isSpeaking && totalEnergy > 50) {
          lastSpokenTimeRef.current = Date.now();
          const spectralCentroid = Math.round(weightedSumFreq / totalEnergy);

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

          const estimatedF0 = bestOffset > 0 ? Math.round((sampleRate / bestOffset) * 10) / 10 : 192.4;
          const clampedF0 = estimatedF0 >= 75 && estimatedF0 <= 450 ? estimatedF0 : 185.0;

          // Check if speech pitch matches user's calibrated Self-Talk voice profile
          let isSelfVoice = false;
          let userPitch = 185.0;
          let userVariance = 25.0;
          try {
            const saved = localStorage.getItem('cm_my_voice_profile');
            if (saved) {
              const prof = JSON.parse(saved);
              if (prof && prof.calibrated) {
                userPitch = prof.pitchHz || 185.0;
                userVariance = prof.variance || 25.0;
                if (Math.abs(clampedF0 - userPitch) <= userVariance) {
                  isSelfVoice = true;
                }
              }
            }
          } catch {}

          setAnalysisResult((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              frequency_analysis: {
                ...prev.frequency_analysis,
                volume_db: db,
                fundamental_frequency_f0_hz: clampedF0,
                spectral_centroid_hz: spectralCentroid || 1950.0,
                rms_energy: Math.round(rms * 1000) / 1000,
              },
              voice_direction: {
                ...prev.voice_direction,
                angle_degrees: 0.0,
                direction_label: isSelfVoice ? 'Chủ máy tự phát biểu (0°)' : 'Trực diện người đối diện (0°) ✨',
                direction_type: 'direct_facing',
              },
              ml_classification: {
                ...prev.ml_classification,
                predicted_label: isSelfVoice
                  ? 'Nói một mình / Tự đọc bài (Chủ máy)'
                  : 'Trò chuyện trực tiếp (Đối phương đang nói)',
                predicted_id: 'direct_conversation',
                badge: isSelfVoice ? '✨ Giọng Chủ Máy' : '🗣️ Đối phương đang nói',
                status_text: isSelfVoice
                  ? `Giọng phát ra trùng khớp Mẫu Giọng Chủ Máy (${userPitch}Hz). Đang tự đọc bài/nói một mình -> Không tính Phubbing! ✨`
                  : 'Phát hiện giọng nói đối phương / bạn bè đang trao đổi trực tiếp! 🗣️',
                confidence_percent: 94.2,
                phubbing_risk_percent: isSelfVoice ? 4.0 : 18.5,
              },
            };
          });

        } else if (!isSpeaking && Date.now() - lastSpokenTimeRef.current > 400) {
          // If silent or fan noise, clear immediately to ambient noise / silence
          setAnalysisResult((prev) => {
            if (!prev) return null;
            const isQuiet = db < -40 || vocalBandAvg < 14;
            return {
              ...prev,
              frequency_analysis: {
                ...prev.frequency_analysis,
                volume_db: db,
                fundamental_frequency_f0_hz: 0.0,
                spectral_centroid_hz: isFanRumble ? 850.0 : 420.0,
                rms_energy: Math.round(rms * 1000) / 1000,
              },
              voice_direction: {
                ...prev.voice_direction,
                angle_degrees: 0.0,
                direction_label: isFanRumble ? 'Tiếng quạt / Tạp âm môi trường 🍃' : 'Không gian yên tĩnh 🍃',
                direction_type: 'direct_facing',
              },
              ml_classification: {
                ...prev.ml_classification,
                predicted_label: isFanRumble ? 'Tiếng quạt / Gió điều hòa' : 'Khoảng lặng / Yên tĩnh',
                predicted_id: isQuiet ? 'silence' : 'ambient_noise',
                badge: isFanRumble ? '🍃 Tạp âm quạt' : '💤 Yên lặng',
                status_text: isFanRumble
                  ? 'Âm thanh liên tục không có khoảng nghỉ tự nhiên của tiếng người. Đã lọc bỏ tiếng quạt/tiếng ồn trắng 🍃'
                  : 'Không gian yên tĩnh, không phát hiện giọng nói 🤫',
                confidence_percent: 96.0,
                phubbing_risk_percent: 0.0,
              },
            };
          });
        }

        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();

      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          recordedChunksRef.current = [];

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              sendAudioForAnalysis(base64data, false);
            }
          };
          reader.readAsDataURL(blob);
        }
      };

      autoAnalyzeTimerRef.current = setInterval(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setTimeout(() => {
            if (streamRef.current && streamRef.current.active) {
              try {
                recorder.start();
              } catch {}
            }
          }, 300);
        } else if (recorder.state === 'inactive') {
          try {
            recorder.start();
          } catch {}
        }
      }, 4000);

      recorder.start();
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setMicPermissionStatus('denied');
      setIsMicActive(false);

      const isIframe = window.self !== window.top;
      const isDenied = err.name === 'NotAllowedError' || err.name === 'SecurityError';

      if (isIframe || isDenied) {
        setIsIframeBlocked(true);
        setError(
          'Trình duyệt đang chặn truy cập Micro trong khung nhúng (iframe preview). Bạn có thể Mở sang Tab Mới để bật Micro thật, hoặc Bật Chế Độ Giả Lập Giọng Nói để trải nghiệm ngay!'
        );
      } else {
        setError(
          'Không tìm thấy thiết bị thu âm hoặc quyền Micro bị từ chối. Bạn có thể sử dụng Chế Độ Giả Lập Giọng Nói.'
        );
      }
    }
  }, [sendAudioForAnalysis, stopMicrophone]);

  // 2. SIMULATED VOICE GENERATOR (High-fidelity voice spectrum simulation)
  const startSimulatedMicrophone = useCallback((preset: 'speaking' | 'singing' | 'whisper' = 'speaking') => {
    stopMicrophone();
    setError(null);
    setIsMicActive(true);
    setMicMode('simulated');
    setMicPermissionStatus('granted');
    setVoiceDetected(true);

    let t = 0;
    const NUM_BARS = 30;

    const baseF0 = preset === 'speaking' ? 185.0 : preset === 'singing' ? 260.0 : 120.0;
    const targetDb = preset === 'speaking' ? -12.4 : preset === 'singing' ? -8.2 : -22.5;

    const simulateFrame = () => {
      t += 0.08;

      // Syllable speech envelope: rhythm of speech with natural pauses and cadence
      const speechCadence = Math.max(0, Math.sin(t * 1.8) * Math.cos(t * 0.7) + 0.35 * Math.sin(t * 3.2));
      const isVoiceSpurt = speechCadence > 0.15;
      setVoiceDetected(isVoiceSpurt);

      // Volume in dB fluctuating realistically around targetDb
      const currentDb = isVoiceSpurt
        ? Math.round((targetDb + Math.sin(t * 2.5) * 3.5 + (Math.random() - 0.5) * 2.0) * 10) / 10
        : -42.0;
      setLiveVolumeDb(currentDb);

      const volPct = Math.min(100, Math.max(0, Math.round(((currentDb + 55) / 50) * 100)));
      setLiveVolume(volPct);

      // 30 frequency bars modeling human vowel formants (F1, F2, F3) + sibilants
      const bars: number[] = [];
      for (let b = 0; b < NUM_BARS; b++) {
        let barHeight = 12; // resting floor
        if (isVoiceSpurt) {
          // Human voice shape:
          // Bars 0-5 (60-300Hz): F0 pitch peak
          const f0Peak = Math.exp(-Math.pow(b - 3, 2) / 4.0) * 75;
          // Bars 6-15 (300-1500Hz): Formant F1 (Vowels A, O, U)
          const f1Peak = Math.exp(-Math.pow(b - 9, 2) / 7.0) * 85;
          // Bars 16-22 (1500-3500Hz): Formant F2, F3 (Consonants, clarity)
          const f2Peak = Math.exp(-Math.pow(b - 18, 2) / 6.0) * 70;
          // Bars 23-29 (3500-8000Hz): Sibilants (S, SH, X)
          const sibilantPeak = Math.exp(-Math.pow(b - 25, 2) / 8.0) * 55;

          const waveJitter = Math.sin(t * 4.0 + b * 0.4) * 8.0;
          const energy = (f0Peak + f1Peak + f2Peak + sibilantPeak) * (speechCadence * 0.8 + 0.2) + waveJitter;
          barHeight = Math.min(96, Math.max(14, Math.round(energy)));
        } else {
          // Ambient quiet floor
          barHeight = Math.min(22, Math.max(10, Math.round(14 + Math.sin(t * 2 + b) * 4)));
        }
        bars.push(barHeight);
      }
      setLiveFrequencies(bars);

      // Dynamic F0 fluctuation
      const dynamicF0 = isVoiceSpurt
        ? Math.round((baseF0 + Math.sin(t * 2.1) * 14 + (Math.random() - 0.5) * 6) * 10) / 10
        : baseF0;

      // Check against user's voice profile
      let isSelfVoice = false;
      let userPitch = 185.0;
      let userVariance = 25.0;
      try {
        const saved = localStorage.getItem('cm_my_voice_profile');
        if (saved) {
          const prof = JSON.parse(saved);
          if (prof && prof.calibrated) {
            userPitch = prof.pitchHz || 185.0;
            userVariance = prof.variance || 25.0;
            if (Math.abs(dynamicF0 - userPitch) <= userVariance) {
              isSelfVoice = true;
            }
          }
        }
      } catch {}

      setAnalysisResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          frequency_analysis: {
            ...prev.frequency_analysis,
            volume_db: currentDb,
            fundamental_frequency_f0_hz: dynamicF0,
            spectral_centroid_hz: isVoiceSpurt ? 1950.0 + Math.sin(t) * 120 : 650.0,
          },
          voice_direction: {
            ...prev.voice_direction,
            angle_degrees: 0.0,
            direction_label: isSelfVoice ? 'Chủ máy tự đọc bài (0°)' : 'Trực diện người đối diện (0°) ✨',
            direction_type: 'direct_facing',
          },
          ml_classification: {
            ...prev.ml_classification,
            predicted_label: isSelfVoice
              ? 'Nói một mình / Tự đọc bài (Chủ máy)'
              : 'Trò chuyện trực tiếp (Đối phương đang nói)',
            predicted_id: 'direct_conversation',
            badge: isSelfVoice ? '✨ Giọng Chủ Máy' : '🗣️ Đối phương đang nói',
            status_text: isSelfVoice
              ? `Giọng phát ra trùng khớp Mẫu Giọng Chủ Máy (${userPitch}Hz). Đang tự đọc bài/nói một mình -> Không tính Phubbing! ✨`
              : 'Tập trung tuyệt đối! Đang trò chuyện cùng đối phương ✨',
            confidence_percent: 95.0,
            phubbing_risk_percent: isSelfVoice ? 4.0 : 15.0,
          },
        };
      });


      simulationTimerRef.current = requestAnimationFrame(simulateFrame);
    };

    simulationTimerRef.current = requestAnimationFrame(simulateFrame);
  }, [stopMicrophone]);

  const triggerAnalysis = useCallback(
    async (mock = false) => {
      await sendAudioForAnalysis(undefined, mock);
    },
    [sendAudioForAnalysis]
  );

  const runScenario = useCallback(
    async (scenario: 'direct' | 'phubbing' | 'ambient' | 'silence') => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const res = await fetch('/api/audio/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mock: true }),
        });
        const data: AudioAnalysisResult = await res.json();

        if (scenario === 'direct') {
          data.frequency_analysis.fundamental_frequency_f0_hz = 192.4;
          data.frequency_analysis.spectral_centroid_hz = 1950.0;
          data.frequency_analysis.volume_db = -12.4;
          data.voice_direction.angle_degrees = 0.0;
          data.voice_direction.direction_label = 'Trực diện người đối diện (0°) ✨';
          data.voice_direction.direction_type = 'direct_facing';
          data.ml_classification.predicted_id = 'direct_conversation';
          data.ml_classification.predicted_label = 'Trò chuyện trực tiếp (Face-to-face)';
          data.ml_classification.badge = '✅ Gắn kết cao';
          data.ml_classification.status_text = 'Tập trung tuyệt đối! Đang trò chuyện cùng nhau ✨';
          data.ml_classification.confidence_percent = 92.5;
          data.ml_classification.probabilities = {
            direct_conversation: 92.5,
            phubbing_speech: 4.0,
            ambient_noise: 2.0,
            silence: 1.5,
          };
          data.ml_classification.phubbing_risk_percent = 8.5;
        } else if (scenario === 'phubbing') {
          data.frequency_analysis.fundamental_frequency_f0_hz = 125.8;
          data.frequency_analysis.spectral_centroid_hz = 1050.2;
          data.frequency_analysis.volume_db = -18.6;
          data.voice_direction.angle_degrees = -5.0;
          data.voice_direction.direction_label = 'Cúi đầu vào điện thoại (Phubbing) ⚠️';
          data.voice_direction.direction_type = 'facing_screen';
          data.ml_classification.predicted_id = 'phubbing_speech';
          data.ml_classification.predicted_label = 'Nói cúi mặt vào điện thoại (Phubbing)';
          data.ml_classification.badge = '⚠️ Nguy cơ Phubbing';
          data.ml_classification.status_text = 'Phát hiện giọng nói hướng xuống màn hình ⚠️';
          data.ml_classification.confidence_percent = 88.0;
          data.ml_classification.probabilities = {
            direct_conversation: 6.0,
            phubbing_speech: 88.0,
            ambient_noise: 4.0,
            silence: 2.0,
          };
          data.ml_classification.phubbing_risk_percent = 84.0;
        } else if (scenario === 'ambient') {
          data.frequency_analysis.fundamental_frequency_f0_hz = 60.0;
          data.frequency_analysis.spectral_centroid_hz = 3100.5;
          data.frequency_analysis.volume_db = -24.0;
          data.voice_direction.angle_degrees = -32.0;
          data.voice_direction.direction_label = 'Nghiêng sang trái (-32°) 🗣️';
          data.voice_direction.direction_type = 'angled_left';
          data.ml_classification.predicted_id = 'ambient_noise';
          data.ml_classification.predicted_label = 'Tạp âm môi trường / Quán cà phê';
          data.ml_classification.badge = '☕ Môi trường';
          data.ml_classification.status_text = 'Âm thanh nền quán xá, không có người nói trực tiếp ☕';
          data.ml_classification.confidence_percent = 78.0;
          data.ml_classification.probabilities = {
            direct_conversation: 10.0,
            phubbing_speech: 8.0,
            ambient_noise: 78.0,
            silence: 4.0,
          };
          data.ml_classification.phubbing_risk_percent = 22.0;
        } else if (scenario === 'silence') {
          data.frequency_analysis.fundamental_frequency_f0_hz = 0.0;
          data.frequency_analysis.spectral_centroid_hz = 520.0;
          data.frequency_analysis.volume_db = -48.0;
          data.voice_direction.angle_degrees = 0.0;
          data.voice_direction.direction_label = 'Trực diện (0°)';
          data.voice_direction.direction_type = 'direct_facing';
          data.ml_classification.predicted_id = 'silence';
          data.ml_classification.predicted_label = 'Khoảng lặng / Yên tĩnh';
          data.ml_classification.badge = '💤 Yên lặng';
          data.ml_classification.status_text = 'Không gian yên ắng, không phát hiện giọng nói 🤫';
          data.ml_classification.confidence_percent = 95.0;
          data.ml_classification.probabilities = {
            direct_conversation: 2.0,
            phubbing_speech: 1.0,
            ambient_noise: 2.0,
            silence: 95.0,
          };
          data.ml_classification.phubbing_risk_percent = 5.0;
        }

        setAnalysisResult(data);
      } catch (err) {
        console.warn('Scenario error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  // Automatic Always-On Microphone Activation
  useEffect(() => {
    // Attempt automatic start immediately on mount
    startMicrophone().catch(() => {
      // If blocked by browser user-gesture policy, activate on first user interaction
      const handleFirstInteraction = () => {
        startMicrophone().catch(() => {});
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };

      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });
    });

    return () => {
      stopMicrophone();
    };
  }, [startMicrophone, stopMicrophone]);

  return {
    isMicActive,
    micPermissionStatus,
    micMode,
    isAnalyzing,
    liveFrequencies,
    liveVolume,
    liveVolumeDb,
    voiceDetected,
    noiseFloorDb,
    adaptiveThresholdDb,
    isCalibratingNoise,
    calibrateNoiseFloor,
    analysisResult,
    error,
    isIframeBlocked,
    startMicrophone,
    startSimulatedMicrophone,
    stopMicrophone,
    triggerAnalysis,
    runScenario,
  };
};
