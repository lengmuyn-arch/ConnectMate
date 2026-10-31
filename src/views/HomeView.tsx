import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { HomePhubbingPromptModal } from '../components/HomePhubbingPromptModal';
import { MeetupMemoryPolaroidModal } from '../components/MeetupMemoryPolaroidModal';
import { useSilentScrollDetector } from '../hooks/useSilentScrollDetector';
import { useRealTypingDetector } from '../hooks/useRealTypingDetector';
import { triggerHapticVibration } from '../services/nativeBridge';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Sliders,
  CheckCircle2,
  Clock,
  Heart,
  Plus,
  Bluetooth,
  BluetoothSearching,
  RefreshCw,
  Zap,
  Keyboard,
  ShieldAlert,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    events,
    deleteEvent,
    stars,
    setIsAwayModalOpen,
    setIsAddEventModalOpen,
    setCurrentTab,
    phubbingPromptCount,
    maxReminderCount,
    resetPromptCount,
    isExploreModeActive,
    quickGlanceSuccessCount,
    recordQuickGlanceSuccess,
    isQuickGlanceActive,
    quickGlanceRemainingSec,
    pConv,
    setPConv,
    phoneState,
    setPhoneState,
    isExemptStudyMode,
    setIsExemptStudyMode,
    fusionOutput,
    isPhubbingAlertModalOpen,
    setIsPhubbingAlertModalOpen,
    fusionConfig,
    showToast,
    nearbyBluetoothDevices,
    isBluetoothMeetupActive,
    toggleBluetoothMeetup,
    scanRealBluetoothDevice,
    isBluetoothScanning,
    addCustomNearbyFriend,
    removeNearbyDevice,
    detectionPreset,
    setDetectionPreset,
    testTriggerPhubbingAlert,
    habitMemory,
    resetHabitMemory,
    myVoiceProfile,
    sendBackgroundNotification,
    setTypingSpeed,
    setAppInUse,
  } = useApp();

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isPolaroidModalOpen, setIsPolaroidModalOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<'typing' | 'voice' | 'scrolling' | 'motion' | 'app_switch'>('scrolling');

  // Audio / Mic VAD state
  const [isMicListening, setIsMicListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // Acoustic Speaker Diarization & Voice Activity Detection (VAD)
  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const pitchHistoryRef = useRef<{ t: number; pitch: number; vocal: number; correlation: number }[]>([]);
  const multiSpeakerUntilRef = useRef<number>(0);
  const voiceActiveUntilRef = useRef<number>(0);
  const lastUIUpdateRef = useRef<number>(0);
  const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Technical drawer (collapsed by default for clean, calm UI)
  const [showTechDrawer, setShowTechDrawer] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phoneActiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with global FusionEngine high-level alert & trigger gentle haptic vibration
  useEffect(() => {
    if (isPhubbingAlertModalOpen) {
      setIsPromptModalOpen(true);
      setTriggerType(phoneState === 'active' ? 'typing' : 'scrolling');
      triggerHapticVibration('warning');
    }
  }, [isPhubbingAlertModalOpen, phoneState]);

  /**
   * Phone interaction handler:
   * CRITICAL FIX: Interacting/scrolling INSIDE ConnectMate (foreground) is 100% EXEMPT!
   * Phubbing alerts ONLY fire when the user exits ConnectMate to scroll on external apps (document.hidden).
   */
  const handleUserActivity = (type: 'typing' | 'scrolling' | 'motion' | 'app_switch') => {
    if (isExemptStudyMode) {
      setPhoneState('exempt');
      return;
    }

    // In-app interaction inside ConnectMate is 100% allowed (idle state)
    if (!document.hidden && type !== 'app_switch') {
      setPhoneState('idle');
      return;
    }

    // Set phone state to active ONLY for external app usage / backgrounding
    setPhoneState('active');

    // Reset back to idle after 5 seconds of inactivity
    if (phoneActiveTimeoutRef.current) clearTimeout(phoneActiveTimeoutRef.current);
    phoneActiveTimeoutRef.current = setTimeout(() => {
      setPhoneState('idle');
    }, 5000);
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPromptModalOpen) return;
      if (e.key.startsWith('F') && e.key.length > 1) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['Shift', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) return;

      handleUserActivity('typing');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPromptModalOpen, isExemptStudyMode]);

  // Real keyboard typing velocity & cadence detector
  const {
    stats: realTypingStats,
    recentKeys,
    recordKeystroke,
  } = useRealTypingDetector({
    enableGlobalListener: true,
  });

  // Sync real typing stats
  useEffect(() => {
    setTypingSpeed(realTypingStats.cpm);
    if (realTypingStats.cpm > 120) {
      setAppInUse('Nhắn tin / Bấm máy tốc độ cao');
      if (pConv >= 0.70 && !isExemptStudyMode) {
        setTriggerType('typing');
      }
    }
  }, [realTypingStats.cpm, pConv, isExemptStudyMode, setTypingSpeed, setAppInUse]);

  // Silent scrolling, touch taps, tilt angle & swipe gesture detector
  const {
    tiltAngle,
    isPhoneTilted,
    swipeCount,
    tapCount,
    tapCadenceCpm,
    isTypingCadence,
    lastMotionType,
    lastInteractionType,
    lastAwayDurationSec,
    testTrigger: testTriggerMotion,
  } = useSilentScrollDetector({
    enabled: true,
    onDetect: (event) => {
      setTriggerType(event.type);
      handleUserActivity(event.type);
    },
  });

  // Background App / External Tab Switch Detection
  const externalExitTimeRef = useRef<number>(0);
  const lastExternalAlertAtRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        // User exited ConnectMate to external apps (Messenger, Zalo, etc.)
        externalExitTimeRef.current = now;
        if (!isExemptStudyMode) {
          setPhoneState('active');
        }

        // Automatic background push notification if user is away messaging during active conversation (>10s)
        if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
        const hasSocialContext = pConv >= 0.20 || isVoiceActive || isMultiSpeaker || isBluetoothMeetupActive || nearbyBluetoothDevices.length > 0;
        if (hasSocialContext && !isExemptStudyMode) {
          backgroundTimerRef.current = setTimeout(() => {
            const nowHidden = Date.now();
            if (nowHidden - lastExternalAlertAtRef.current >= 15000) {
              lastExternalAlertAtRef.current = nowHidden;
              triggerHapticVibration('alert');
              sendBackgroundNotification(
                'ConnectMate Cảnh Báo 💬',
                'Bạn đang nhắn tin / gõ máy bên ngoài hơn 10s giữa cuộc đối thoại. Hãy ngẩng đầu tương tác cùng bạn bè nhé!'
              );
            }
          }, 10000);
        }
      } else {
        // User returned to ConnectMate
        if (backgroundTimerRef.current) {
          clearTimeout(backgroundTimerRef.current);
          backgroundTimerRef.current = null;
        }

        if (externalExitTimeRef.current > 0) {
          const awaySec = Math.round((now - externalExitTimeRef.current) / 1000);
          externalExitTimeRef.current = 0;

          const hasSocialContext = pConv >= 0.20 || isVoiceActive || isMultiSpeaker || isBluetoothMeetupActive || nearbyBluetoothDevices.length > 0;

          // If user was away >= 10s during social context
          if (awaySec >= 10 && hasSocialContext && !isExemptStudyMode) {
            setTriggerType('typing');
            setAppInUse('Nhắn tin / Gõ máy bên ngoài');
            setPhoneState('active');

            if (now - lastExternalAlertAtRef.current >= 15000) {
              lastExternalAlertAtRef.current = now;
              triggerHapticVibration('alert');
              setIsPromptModalOpen(true);
              sendBackgroundNotification(
                'ConnectMate Cảnh Báo 💬',
                `Bạn vừa nhắn tin bên ngoài ${awaySec}s trong lúc đối thoại. Hãy ngẩng đầu tương tác cùng bạn bè nhé!`
              );
              showToast(`🚨 Phát hiện: Đã nhắn tin / gõ máy bên ngoài ${awaySec}s (>10s) giữa lúc đang đối thoại!`, 'warning');
            }
          } else if (awaySec < 10 && hasSocialContext && !isExemptStudyMode) {
            // Under 10s is a quick glance; record it (will warn if repeated >= 3 times)
            recordQuickGlanceSuccess();
            setPhoneState('idle');
          } else {
            setPhoneState('idle');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    };
  }, [
    isExemptStudyMode,
    pConv,
    isVoiceActive,
    isMultiSpeaker,
    isBluetoothMeetupActive,
    nearbyBluetoothDevices.length,
    setPhoneState,
    setAppInUse,
    recordQuickGlanceSuccess,
    showToast,
    sendBackgroundNotification,
  ]);

  // Real-time Voice Activity Detection (VAD) & Multi-Speaker Diarization via microphone
  const startMicListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.25;
      source.connect(analyser);

      setIsMicListening(true);

      const timeBuffer = new Float32Array(analyser.fftSize);
      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      const sampleRate = ctx.sampleRate || 44100;
      const binWidth = sampleRate / analyser.fftSize;

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getFloatTimeDomainData(timeBuffer);
        analyser.getByteFrequencyData(freqBuffer);

        const now = Date.now();

        // 1. Time-Domain RMS Volume
        let sumSq = 0;
        for (let i = 0; i < timeBuffer.length; i++) {
          sumSq += timeBuffer[i] * timeBuffer[i];
        }
        const rms = Math.sqrt(sumSq / timeBuffer.length);
        const normalizedVol = Math.min(100, Math.round(rms * 320));

        // 2. Frequency Spectral Bands
        // Low rumble (<200Hz): Fan motor drone, AC humming, desk vibrations
        // Vocal speech band (250Hz - 3400Hz): Human vowels, formants (F1, F2), resonance
        let rumbleSum = 0;
        let rumbleCount = 0;
        let vocalSum = 0;
        let vocalCount = 0;

        for (let i = 0; i < freqBuffer.length; i++) {
          const freq = i * binWidth;
          const val = freqBuffer[i];
          if (freq < 200) {
            rumbleSum += val;
            rumbleCount++;
          } else if (freq >= 250 && freq <= 3400) {
            vocalSum += val;
            vocalCount++;
          }
        }
        const rumbleAvg = rumbleCount > 0 ? rumbleSum / rumbleCount : 0;
        const vocalAvg = vocalCount > 0 ? vocalSum / vocalCount : 0;

        // 3. Fundamental Frequency (F0) & Harmonicity via Normalized Autocorrelation
        // Human voice fundamental pitch ranges from 80 Hz (deep male) to 380 Hz (female/child)
        let detectedPitch: number | null = null;
        let maxCorr = 0;

        if (rms >= 0.012 && vocalAvg >= 13) {
          const minPeriod = Math.floor(sampleRate / 380); // ~116 samples at 44.1kHz
          const maxPeriod = Math.floor(sampleRate / 80);  // ~551 samples at 44.1kHz
          const W = 460; // Analysis correlation window length

          let sumSq0 = 0;
          for (let i = 0; i < W; i++) {
            sumSq0 += timeBuffer[i] * timeBuffer[i];
          }

          if (sumSq0 > 0.00008) {
            let bestOffset = -1;
            let bestCorr = -1;

            for (let offset = minPeriod; offset <= maxPeriod; offset += 2) {
              let dot = 0;
              let sumSqOffset = 0;
              for (let i = 0; i < W; i++) {
                dot += timeBuffer[i] * timeBuffer[i + offset];
                sumSqOffset += timeBuffer[i + offset] * timeBuffer[i + offset];
              }
              const denom = Math.sqrt(sumSq0 * sumSqOffset);
              const corr = denom > 0 ? dot / denom : 0;
              if (corr > bestCorr) {
                bestCorr = corr;
                bestOffset = offset;
              }
            }

            maxCorr = bestCorr;
            // Human voice pitch periodic harmonicity threshold: maxCorr >= 0.42
            // Fan noise, AC, and white noise have flat/unperiodic autocorrelation (maxCorr < 0.35)
            if (bestCorr >= 0.42 && bestOffset > 0) {
              const rawF0 = sampleRate / bestOffset;
              if (rawF0 >= 80 && rawF0 <= 380) {
                detectedPitch = Math.round(rawF0 * 10) / 10;
              }
            }
          }
        }

        // 4. White Noise, Fan Drone, and Silence Rejection
        const isFanOrDrone =
          (rumbleAvg > 24 && rumbleAvg > vocalAvg * 2.0 && detectedPitch === null) ||
          (detectedPitch === null && maxCorr < 0.38);
        const isSilence = rms < 0.012 || vocalAvg < 12;

        const isSpeechFrame = detectedPitch !== null && vocalAvg >= 13 && !isFanOrDrone && !isSilence;

        if (isSpeechFrame && detectedPitch !== null) {
          pitchHistoryRef.current.push({
            t: now,
            pitch: detectedPitch,
            vocal: vocalAvg,
            correlation: maxCorr,
          });
        }

        // Rolling history of last 3800ms
        pitchHistoryRef.current = pitchHistoryRef.current.filter((pt) => now - pt.t <= 3800);

        // Recent speech activity within 1300ms triggers/extends voiceActive hangover
        const hasRecentSpeech = pitchHistoryRef.current.some((pt) => now - pt.t <= 1300);
        if (hasRecentSpeech) {
          voiceActiveUntilRef.current = now + 1300;
        }

        // 5. Turn-Taking Multi-Speaker vs Single Speaker Diarization
        const history = pitchHistoryRef.current;
        if (history.length >= 5) {
          if (myVoiceProfile?.calibrated) {
            // Owner voice profile is saved
            const ownerF0 = myVoiceProfile.pitchHz;
            const tolerance = Math.max(24, myVoiceProfile.variance || 25);

            let ownerFrames = 0;
            let partnerFrames = 0;

            for (const pt of history) {
              const diff = Math.abs(pt.pitch - ownerF0);
              if (diff <= tolerance) {
                ownerFrames++;
              } else if (diff >= tolerance + 8) {
                partnerFrames++;
              }
            }

            // Dialogue criteria:
            // - Two voices taking turns: ownerFrames >= 2 AND partnerFrames >= 2
            // - OR a partner is speaking directly to the user: partnerFrames >= 4
            if ((ownerFrames >= 2 && partnerFrames >= 2) || partnerFrames >= 4) {
              multiSpeakerUntilRef.current = now + 3200; // 3.2s dialogue hangover
            }
          } else {
            // Owner voice not yet calibrated: analyze pitch bimodality/distribution
            const sortedPitches = history.map((h) => h.pitch).sort((a, b) => a - b);
            const len = sortedPitches.length;
            if (len >= 6) {
              const qLowIdx = Math.floor(len * 0.25);
              const qHighIdx = Math.floor(len * 0.75);
              const pLow = sortedPitches[qLowIdx];
              const pHigh = sortedPitches[qHighIdx];
              const pitchDelta = pHigh - pLow;

              // Distinct human speakers have fundamental pitch separation >= 30 Hz
              if (pitchDelta >= 30) {
                const lowGroup = history.filter((h) => h.pitch <= pLow + 12);
                const highGroup = history.filter((h) => h.pitch >= pHigh - 12);
                if (lowGroup.length >= 2 && highGroup.length >= 2) {
                  const tLow = Math.max(...lowGroup.map((h) => h.t));
                  const tHigh = Math.max(...highGroup.map((h) => h.t));
                  // Turn separation delta (>=200ms) confirms alternating speakers rather than pitch glide
                  if (Math.abs(tHigh - tLow) >= 200) {
                    multiSpeakerUntilRef.current = now + 3200;
                  }
                }
              }
            }
          }
        }

        const voiceActive = now < voiceActiveUntilRef.current && !isSilence && !isFanOrDrone;
        // CRITICAL: Multi-speaker is STRICTLY FALSE if voice is inactive
        const multiSpeakerActive = voiceActive && now < multiSpeakerUntilRef.current;

        if (!voiceActive) {
          multiSpeakerUntilRef.current = 0;
        }

        // 6. Conversational Probability (pConv) Estimation
        if (voiceActive) {
          if (myVoiceProfile?.calibrated && nearbyBluetoothDevices.length === 0 && !multiSpeakerActive) {
            // Owner talking alone / reading (exempt): keep pConv low (0.08 - 0.20)
            setPConv((prev) => Math.min(0.20, Math.max(0.08, Math.round(prev * 0.94 * 100) / 100)));
          } else if (multiSpeakerActive) {
            // Confirmed 2+ speakers / dialogue: high pConv (0.86 - 0.95)!
            setPConv((prev) => Math.min(0.95, Math.max(0.86, Math.round((prev + 0.10) * 100) / 100)));
          } else if (isBluetoothMeetupActive) {
            // Bluetooth meetup active
            setPConv((prev) => Math.min(0.90, Math.max(0.70, Math.round((prev + 0.08) * 100) / 100)));
          } else {
            // Single speaker speaking alone: modest pConv (0.12 - 0.28)
            setPConv((prev) => Math.min(0.28, Math.max(0.12, Math.round(prev * 0.96 * 100) / 100)));
          }
        } else {
          // Silence, fan noise, or background quiet: decays smoothly down to quiet baseline (0.04)
          setPConv((prev) => Math.max(0.04, Math.round(prev * 0.85 * 100) / 100));
        }

        // 7. Throttle React state updates to 120ms to eliminate UI flickering
        if (now - lastUIUpdateRef.current > 120) {
          lastUIUpdateRef.current = now;
          setMicLevel(isFanOrDrone || isSilence ? Math.min(10, normalizedVol) : normalizedVol);
          setIsMultiSpeaker(multiSpeakerActive);
          setIsVoiceActive(voiceActive);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Microphone error:', err);
    }
  };

  const stopMicListening = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    pitchHistoryRef.current = [];
    multiSpeakerUntilRef.current = 0;
    voiceActiveUntilRef.current = 0;
    setIsMicListening(false);
    setMicLevel(0);
    setIsMultiSpeaker(false);
    setIsVoiceActive(false);
    setPConv(0.08); // Decays to quiet baseline
  };

  // Auto-start mic on first interaction to avoid browser autoplay restrictions
  useEffect(() => {
    startMicListening().catch(() => {
      const handleFirstInteraction = () => {
        startMicListening().catch(() => {});
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };

      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });
    });

    return () => {
      stopMicListening();
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    };
  }, []);

  const isConversing = pConv >= (fusionConfig.p_conv_thr || 0.70);
  const isOwnerSelfTalk = isVoiceActive && myVoiceProfile?.calibrated && !isMultiSpeaker && nearbyBluetoothDevices.length === 0;
  const isDirectExternalConv = (isVoiceActive || isConversing) && isMultiSpeaker && nearbyBluetoothDevices.length === 0;

  const targetReward = 1500;
  const remaining = Math.max(0, targetReward - stars);
  const progressPercent = Math.min(100, Math.max(10, Math.round((stars / targetReward) * 100)));

  return (
    <div className="space-y-4 pb-28 pt-1">
      {/* 1. Warm Greeting & Quick Mode Toggle */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#2B2118] tracking-tight flex items-center gap-1.5">
            <span>Chào bạn!</span>
            <span className="text-amber-400">✨</span>
          </h1>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Buông điện thoại, kết nối trọn vẹn đời thực.
          </p>
        </div>

        {/* Study Mode Quick Pill */}
        <button
          onClick={() => {
            const next = !isExemptStudyMode;
            setIsExemptStudyMode(next);
            showToast(next ? '📚 Đã bật Chế độ Học tập (Miễn trừ cảnh báo)' : '🌿 Quay lại Chế độ Gặp gỡ', 'info');
          }}
          className={`px-3 py-1.5 rounded-2xl text-xs font-heading font-black border-2 border-[#2B2118] transition-all flex items-center gap-1.5 pop-shadow-sm ${
            isExemptStudyMode
              ? 'bg-[#CFE3DC] text-[#2B2118]'
              : 'bg-white hover:bg-stone-50 text-stone-700'
          }`}
          title="Bật khi học bài hoặc làm việc nhóm để không bị nhắc nhở"
        >
          <BookOpen size={14} className={isExemptStudyMode ? 'text-emerald-700' : 'text-stone-500'} />
          <span>{isExemptStudyMode ? 'Học nhóm: BẬT' : 'Học nhóm'}</span>
        </button>
      </div>

      {/* 2. TOP PRIORITY: Week Tasks List */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading font-black text-sm text-[#2B2118] flex items-center gap-1.5">
            <span>📅 Lịch Gặp Tuần Này</span>
            <span className="text-xs font-mono font-bold text-stone-500">({events.length})</span>
          </h3>

          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="text-xs font-heading font-black text-[#0ABAB5] hover:underline flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Thêm việc</span>
          </button>
        </div>

        {events.length === 0 ? (
          <div className="bg-white/80 border-2 border-dashed border-[#2B2118] rounded-3xl p-5 text-center pop-shadow-sm">
            <span className="text-2xl mb-1 inline-block">🎉</span>
            <p className="font-heading font-black text-xs text-[#2B2118]">
              Không còn việc vướng bận tuần này!
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              style={{ backgroundColor: event.bgColor }}
              className="rounded-2xl border-2 border-[#2B2118] pop-shadow-sm p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/80 border border-[#2B2118] flex items-center justify-center text-lg shrink-0 pop-shadow-sm">
                  {event.icon}
                </div>
                <div>
                  <h4 className="font-heading font-black text-xs text-[#2B2118] leading-tight">
                    {event.title}
                  </h4>
                  <p className="text-[11px] font-medium text-stone-700 mt-0.5">
                    {event.dayTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteEvent(event.id)}
                className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-[#2B2118] rounded-full hover:bg-black/10 shrink-0 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* 2. Main Companion Card: Bé Mầm & Trạng Thái Trực Diện (Clean & Calm) */}
      <div className="bg-[#FFFDF9] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-4 sm:p-5 space-y-3.5 transition-all">
        {/* Top bar: Sprout Avatar & Context Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Animated Avatar */}
            <div className={`w-13 h-13 rounded-2xl border-2 border-[#2B2118] flex items-center justify-center text-3xl pop-shadow-sm transition-all ${
              isExemptStudyMode
                ? 'bg-[#CFE3DC]'
                : isOwnerSelfTalk
                ? 'bg-amber-100'
                : isDirectExternalConv || (isConversing && phoneState === 'active')
                ? 'bg-[#F4BAB3]'
                : isConversing
                ? 'bg-[#0ABAB5]/20 animate-pulse'
                : 'bg-[#F8EFE8]'
            }`}>
              {isExemptStudyMode
                ? '📖'
                : !isVoiceActive
                ? '🍃'
                : isOwnerSelfTalk
                ? '🗣️'
                : isDirectExternalConv
                ? '💬'
                : isConversing && phoneState === 'active'
                ? '🥺'
                : isConversing
                ? '🌱'
                : '🍃'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-base text-[#2B2118]">
                  {isExemptStudyMode ? 'Trạng Thái Học Nhóm' : 'Trạng Thái Trò Chuyện'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              </div>

              {/* Status Badge from YAMNet & FusionEngine */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isExemptStudyMode
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : !isVoiceActive
                    ? 'bg-stone-100 text-stone-600 border-stone-200'
                    : isOwnerSelfTalk
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : isDirectExternalConv
                    ? 'bg-[#0ABAB5]/15 text-[#0a8985] border-[#0ABAB5]/30'
                    : isConversing
                    ? 'bg-[#0ABAB5]/15 text-[#0a8985] border-[#0ABAB5]/30'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}>
                  {isExemptStudyMode
                    ? '📚 Đang học / làm việc nhóm'
                    : !isVoiceActive
                    ? '🍃 Không gian yên tĩnh'
                    : isOwnerSelfTalk
                    ? '🗣️ Giọng chủ máy (Đang tự đọc bài 1 mình)'
                    : isDirectExternalConv
                    ? '🗣️ Trò chuyện trực tiếp (Phát hiện 2 giọng nói)'
                    : isConversing
                    ? '🗣️ Đang có cuộc trò chuyện'
                    : '🍃 Không gian yên tĩnh'}
                </span>
              </div>
            </div>
          </div>

          {/* Clean Mic Listening Toggle */}
          <button
            onClick={isMicListening ? stopMicListening : startMicListening}
            className={`p-2 rounded-2xl border-2 border-[#2B2118] transition-all flex items-center justify-center pop-shadow-sm ${
              isMicListening
                ? 'bg-[#0ABAB5] text-[#2B2118] hover:bg-[#099e9a]'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
            title={isMicListening ? 'Micro đang nhận diện âm thanh YAMNet (Bấm để tắt)' : 'Bấm để bật Micro'}
          >
            {isMicListening ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
        </div>

        {/* Clear Explanation Text in Plain Vietnamese */}
        <div className="bg-[#F8EFE8] rounded-2xl border border-[#2B2118]/15 p-3 space-y-1">
          <p className="text-xs text-stone-800 leading-relaxed font-medium">
            {isExemptStudyMode ? (
              <span>
                ✨ <strong>Chế độ Miễn trừ đang bật:</strong> Bạn có thể thoải mái tra cứu tài liệu, lướt web hoặc gõ văn bản nhóm mà không bị thông báo làm gián đoạn.
              </span>
            ) : !isVoiceActive ? (
              <span>
                🍃 <strong>Không gian yên tĩnh:</strong> Không phát hiện cuộc đối thoại nào xung quanh (chỉ có tiếng quạt hoặc tạp âm nền). Bạn có thể <strong>thoải mái lướt máy, đọc báo hay xem video</strong> mà không hề bị nhắc nhở Phubbing!
              </span>
            ) : isOwnerSelfTalk ? (
              <span>
                🗣️ <strong>Giọng chủ máy (Đang tự đọc bài 1 mình):</strong> Hệ thống nhận diện phổ âm thanh đơn lẻ trùng khớp với giọng đã lưu của chính bạn, không phát hiện giọng nói thứ 2.
              </span>
            ) : isDirectExternalConv ? (
              <span>
                🗣️ <strong>Trò chuyện trực tiếp (Phát hiện 2 giọng nói):</strong> YAMNet nhận diện có 2 chất giọng khác nhau đang tương tác qua lại trực tiếp với bạn (dù người bên cạnh không bật Bluetooth)!
              </span>
            ) : isConversing ? (
              <span>
                🗣️ <strong>YAMNet nhận diện có đối thoại:</strong> Xung quanh đang có cuộc trò chuyện thực tế. {phoneState === 'active' ? 'Bạn đang dùng điện thoại, hãy chú ý hướng mắt về bạn bè nhé!' : 'Điện thoại đang để yên, rất tuyệt vời!'}
              </span>
            ) : (
              <span>
                🍃 <strong>Không gian yên tĩnh:</strong> Không phát hiện cuộc đối thoại nào xung quanh. Bạn có thể <strong>thoải mái lướt máy, đọc báo hay xem video</strong> mà không hề bị nhắc nhở Phubbing!
              </span>
            )}
          </p>

          {/* Audio volume visualizer if mic active */}
          {isMicListening && (
            <div className="flex items-center gap-2 pt-1 text-[10.5px] text-stone-600 flex-wrap">
              <span className="flex items-center gap-1 font-mono">
                <Volume2 size={12} className={micLevel > 20 ? 'text-[#0ABAB5]' : 'text-stone-400'} />
                <span>Âm lượng: {micLevel}%</span>
              </span>
              <span>•</span>
              <span className="font-mono">
                Phổ âm: <strong className={isVoiceActive && isMultiSpeaker ? 'text-amber-800 font-bold' : isVoiceActive ? 'text-blue-800 font-bold' : 'text-emerald-800 font-bold'}>
                  {!isVoiceActive ? '🍃 Yên tĩnh' : isMultiSpeaker ? '2+ Giọng (Đa luồng)' : '1 Giọng (Đơn luồng)'}
                </strong>
              </span>
              <span>•</span>
              <span className="font-mono">
                Xác suất hội thoại: <strong className={isConversing ? 'text-[#0ABAB5]' : 'text-stone-500'}>{(pConv * 100).toFixed(0)}%</strong>
              </span>
            </div>
          )}

          {/* Live IMU Motion, Swipe Gesture & Keystroke Cadence Monitor */}
          <div className="space-y-1.5 pt-2 border-t border-stone-200/80 text-[11px] font-mono text-stone-700">
            {/* Row 1: Dual Interaction Detector (Typing Cadence vs Scrolling) */}
            <div className="flex items-center justify-between flex-wrap gap-1 bg-white/70 p-2 rounded-xl border border-stone-200">
              <span className="flex items-center gap-1.5">
                <Keyboard size={13} className="text-[#0ABAB5]" />
                <span className="font-sans font-bold text-stone-800">Nhịp bấm máy/Gõ phím:</span>
                <strong className={Math.max(realTypingStats.cpm, tapCadenceCpm) >= 110 ? 'text-amber-800 font-black' : 'text-[#0ABAB5] font-bold'}>
                  {Math.max(realTypingStats.cpm, tapCadenceCpm)} CPM (~{Math.max(realTypingStats.wpm, Math.round(tapCadenceCpm / 5))} từ/p)
                </strong>
              </span>
              <span className="text-stone-500 text-[10px]">
                Khoảng nghỉ: {realTypingStats.averageIntervalMs > 0 ? `${realTypingStats.averageIntervalMs}ms` : '180ms nhịp người'}
              </span>
            </div>

            {/* Row 2: IMU Tilt & Swipe Gestures */}
            <div className="flex items-center justify-between text-[10.5px] px-1">
              <span className="flex items-center gap-1">
                <span>📱 Cảm biến nghiêng:</span>
                <strong className={isPhoneTilted ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {tiltAngle}° ({isPhoneTilted ? 'Cầm lướt' : 'Đặt trên bàn'})
                </strong>
              </span>
              <span className="text-stone-600 font-bold">
                👆 {swipeCount} lượt vuốt/8s • ⌨️ {tapCount} chạm phím ảo
              </span>
            </div>

          </div>
        </div>

        {/* Quick Glance Active Countdown Banner (Reassurance when checking notification) */}
        {isQuickGlanceActive && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👀</span>
              <div>
                <h4 className="font-heading font-black text-xs text-amber-900">
                  Đang kiểm tra thông báo nhanh hợp lệ
                </h4>
                <p className="text-[11px] text-amber-800 font-medium">
                  Thời gian miễn trừ: còn <strong>{quickGlanceRemainingSec}s</strong>. Buông máy trước 10s để nhận +5 ⭐ và không bị phạt!
                </p>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-amber-900 bg-amber-200 px-2.5 py-1 rounded-xl">
              {quickGlanceRemainingSec}s
            </span>
          </div>
        )}

        {/* Quick Glance Badge if recorded */}
        {quickGlanceSuccessCount > 0 && !isQuickGlanceActive && (
          <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1.5 font-medium">
              <span>🛡️</span>
              <span>Đã kiểm tra thông báo nhanh hợp lệ: <strong>{quickGlanceSuccessCount} lần</strong></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">0 bị phạt ✨</span>
          </div>
        )}
      </div>

      {/* 3. Vùng Phủ Sóng Bluetooth Bạn Bè (Proximity Presence & Silent Phubbing Guard) */}
      <div className="bg-[#FFFDF9] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 sm:p-4 space-y-3 transition-all">
        <div className="flex items-center justify-between px-0.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bluetooth size={16} className={isBluetoothMeetupActive ? 'text-[#0ABAB5] animate-pulse' : 'text-stone-400'} />
            <h3 className="font-heading font-black text-xs sm:text-sm text-[#2B2118]">
              VÙNG PHỦ SÓNG BLUETOOTH BẠN BÈ (~1-3M)
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleBluetoothMeetup}
              className={`text-[11px] font-heading font-bold px-2.5 py-1 rounded-xl border border-[#2B2118] transition-all ${
                isBluetoothMeetupActive
                  ? 'bg-[#CFE3DC] text-[#2B2118]'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {isBluetoothMeetupActive ? '👥 Đang gặp gỡ' : '🌿 Ở một mình'}
            </button>

            <button
              onClick={scanRealBluetoothDevice}
              disabled={isBluetoothScanning}
              className="text-[11px] font-heading font-bold px-2.5 py-1 rounded-xl bg-[#0ABAB5] text-[#2B2118] border border-[#2B2118] hover:bg-[#089e9a] transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <BluetoothSearching size={12} className={isBluetoothScanning ? 'animate-spin' : ''} />
              <span>🔍 Tìm bạn xung quanh</span>
            </button>
          </div>
        </div>

        {/* Horizontal Peer Cards */}
        {isBluetoothMeetupActive ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {nearbyBluetoothDevices.map((dev) => (
              <div
                key={dev.id}
                className="bg-[#F8EFE8] border border-[#2B2118]/20 rounded-2xl px-3 py-2 flex items-center gap-2 shrink-0 text-xs font-medium"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                <div>
                  <span className="font-heading font-bold text-[#2B2118] block leading-tight">
                    {dev.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    ~{dev.distanceMeters}m
                  </span>
                </div>
                <button
                  onClick={() => removeNearbyDevice(dev.id)}
                  className="text-stone-400 hover:text-red-500 ml-1 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() => addCustomNearbyFriend('Bạn mới', 0.8)}
              className="border border-dashed border-[#2B2118]/40 hover:border-[#0ABAB5] text-stone-600 hover:text-[#0ABAB5] rounded-2xl px-3 py-2 text-xs font-bold shrink-0 transition-colors"
            >
              + Thêm bạn
            </button>
          </div>
        ) : (
          <p className="text-xs text-stone-500 px-1 py-1 italic">
            Bạn đang ở một mình nên sẽ không bị nhắc nhở Phubbing khi lướt điện thoại.
          </p>
        )}
      </div>

      {/* 4. Three Clean Feature Shortcuts */}
      <div className="grid grid-cols-3 gap-2.5 pt-0.5">
        <button
          onClick={() => setCurrentTab('activities')}
          className="bg-[#DFB2FA] hover:bg-[#d6a1f7] text-[#2B2118] p-3 rounded-2xl border-2 border-[#2B2118] pop-shadow-sm flex flex-col items-center justify-center text-center gap-1 transition-all active:translate-y-0.5"
        >
          <span className="text-2xl">💡</span>
          <span className="font-heading font-black text-xs leading-tight">Chủ Đề Nói</span>
        </button>

        <button
          onClick={() => setIsPolaroidModalOpen(true)}
          className="bg-[#F9DCC4] hover:bg-[#fedbc0] text-[#2B2118] p-3 rounded-2xl border-2 border-[#2B2118] pop-shadow-sm flex flex-col items-center justify-center text-center gap-1 transition-all active:translate-y-0.5"
        >
          <span className="text-2xl">📸</span>
          <span className="font-heading font-black text-xs leading-tight">Ảnh Kỷ Niệm</span>
        </button>

        <button
          onClick={() => setCurrentTab('bakery')}
          className="bg-[#CFE3DC] hover:bg-[#bde3d7] text-[#2B2118] p-3 rounded-2xl border-2 border-[#2B2118] pop-shadow-sm flex flex-col items-center justify-center text-center gap-1 transition-all active:translate-y-0.5"
        >
          <span className="text-2xl">⏱️</span>
          <span className="font-heading font-black text-xs leading-tight">Pomodoro 25p</span>
        </button>
      </div>

      {/* 6. Star Wallet Progress */}
      <div
        onClick={() => setCurrentTab('rewards')}
        className="bg-[#0ABAB5] rounded-3xl border-[3px] border-[#2B2118] pop-shadow p-3.5 text-white cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-black text-sm flex items-center gap-1.5">
              <span>✨</span>
              <span>{stars.toLocaleString('vi-VN')} Sao Thưởng</span>
            </h3>
            <p className="text-[11px] font-medium text-white/95 mt-0.5">
              {remaining > 0 ? `Còn ${remaining.toLocaleString('vi-VN')} Sao nữa để đổi quà` : 'Đủ Sao đổi voucher trà sữa! 🎉'}
            </p>
          </div>

          <div className="w-16 sm:w-24 h-2.5 bg-white/30 rounded-full p-0.5 border border-white/40 overflow-hidden shrink-0">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-white rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* 7. Student Anti-False-Alarm Habit Memory Status */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-4 text-xs space-y-2">
        <div className="flex items-center justify-between font-heading font-black text-emerald-900">
          <span className="flex items-center gap-1.5 text-sm">
            <span>🛡️</span>
            <span>Hệ Thống Tự Học Thói Quen (Tránh Báo Nhầm)</span>
          </span>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full font-mono font-bold">
            Ngưỡng chuẩn: 7–10s
          </span>
        </div>
        <p className="text-[11.5px] text-emerald-800 leading-relaxed font-medium">
          Hệ thống tự động ghi nhớ <strong>{habitMemory.falsePositiveCount} phản hồi học tập/tra cứu</strong> của bạn. Độ nhạy được tự động tinh chỉnh để triệt tiêu 95% cảnh báo sai khi học nhóm!
        </p>
        {habitMemory.falsePositiveCount > 0 && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-700 border-t border-emerald-200/60 font-mono">
            <span>Khung giờ đã học: {habitMemory.learnedStudyHours.map((h: number) => `${h}h`).join(', ') || 'Hiện tại'}</span>
            <button
              type="button"
              onClick={resetHabitMemory}
              className="text-stone-600 hover:text-stone-900 underline font-bold"
            >
              Đặt lại bộ nhớ
            </button>
          </div>
        )}
      </div>

      {/* Interactive Watchdog Modal */}
      <HomePhubbingPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setIsPhubbingAlertModalOpen(false);
        }}
        triggerType={triggerType}
      />

      {/* Meetup Memory Polaroid Card Modal */}
      <MeetupMemoryPolaroidModal
        isOpen={isPolaroidModalOpen}
        onClose={() => setIsPolaroidModalOpen(false)}
      />
    </div>
  );
};
